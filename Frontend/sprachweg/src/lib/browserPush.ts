import { API_BASE_URL } from './api';

export const PUSH_NOTIFICATION_QUERY_PARAM = 'notificationId';
export const APPLE_HOME_SCREEN_PUSH_HELPER =
    'On iPhone and iPad, add this app to Home Screen and open it from there to enable push notifications.';
export const BROWSER_PUSH_BLOCKED_HELPER_DESKTOP =
    'Notifications are blocked for this site. Open your browser site settings, allow notifications for this site, then return here and tap the toggle again.';
export const BROWSER_PUSH_BLOCKED_HELPER_ANDROID =
    'Notifications are blocked for this site. In your mobile browser, open site settings, allow notifications, then return here and tap the toggle again.';
export const BROWSER_PUSH_BLOCKED_HELPER_IOS =
    'Notifications are blocked for this site. Open browser settings for this website, allow notifications, then return here and tap the toggle again.';

const PUSH_SERVICE_WORKER_PATH = '/push-sw.js';

type BrowserPushSupportDetails = {
    supported: boolean;
    canUse: boolean;
    helperText: string;
};

const isBrowserEnvironment = () => (
    typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
);

const isAppleMobileDevice = () => {
    if (!isBrowserEnvironment()) {
        return false;
    }

    const userAgent = navigator.userAgent || '';
    const platform = navigator.platform || '';

    return /iPhone|iPad|iPod/i.test(userAgent)
        || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isAndroidDevice = () => {
    if (!isBrowserEnvironment()) {
        return false;
    }

    return /Android/i.test(navigator.userAgent || '');
};

export const isStandaloneWebApp = () => {
    if (!isBrowserEnvironment()) {
        return false;
    }

    const mediaQueryMatches = typeof window.matchMedia === 'function'
        && window.matchMedia('(display-mode: standalone)').matches;
    const navigatorStandalone = 'standalone' in navigator
        && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    return mediaQueryMatches || navigatorStandalone;
};

export const getBrowserPushSupportDetails = (): BrowserPushSupportDetails => {
    if (!isBrowserEnvironment()) {
        return {
            supported: false,
            canUse: false,
            helperText: 'Not supported in this browser.',
        };
    }

    const hasCoreSupport = 'serviceWorker' in navigator && 'Notification' in window;

    if (!hasCoreSupport) {
        return {
            supported: false,
            canUse: false,
            helperText: 'Not supported in this browser.',
        };
    }

    if (isAppleMobileDevice() && !isStandaloneWebApp()) {
        return {
            supported: true,
            canUse: false,
            helperText: APPLE_HOME_SCREEN_PUSH_HELPER,
        };
    }

    return {
        supported: true,
        canUse: true,
        helperText: '',
    };
};

export const getBlockedBrowserPushHelperText = () => {
    if (!isBrowserEnvironment()) {
        return 'Notifications are blocked in this browser.';
    }

    if (isAppleMobileDevice()) {
        return BROWSER_PUSH_BLOCKED_HELPER_IOS;
    }

    if (isAndroidDevice()) {
        return BROWSER_PUSH_BLOCKED_HELPER_ANDROID;
    }

    return BROWSER_PUSH_BLOCKED_HELPER_DESKTOP;
};

export const getBrowserPushEnabledStorageKey = (userId: string) => (
    `browser_push_enabled_${String(userId || '').trim()}`
);

export const clearBrowserPushEnabledFlag = (userId: string) => {
    const key = getBrowserPushEnabledStorageKey(userId);

    if (!key.endsWith('_')) {
        localStorage.removeItem(key);
    }
};

export const isBrowserPushSupported = () => getBrowserPushSupportDetails().supported;

const urlBase64ToUint8Array = (value: string) => {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        outputArray[index] = rawData.charCodeAt(index);
    }

    return outputArray;
};

export const registerBrowserPushServiceWorker = async () => {
    const supportDetails = getBrowserPushSupportDetails();

    if (!supportDetails.canUse) {
        throw new Error(supportDetails.helperText || 'Browser push is not supported');
    }

    const registration = await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_PATH);
    const readyRegistration = await navigator.serviceWorker.ready;
    const pushRegistration = readyRegistration || registration;

    if (!pushRegistration.pushManager) {
        throw new Error('Browser push is not supported');
    }

    return pushRegistration;
};

export const getExistingBrowserPushSubscription = async () => {
    if (!getBrowserPushSupportDetails().canUse) {
        return null;
    }

    const registration = await registerBrowserPushServiceWorker();
    return registration.pushManager.getSubscription();
};

export const subscribeBrowserPush = async (publicKey: string) => {
    const registration = await registerBrowserPushServiceWorker();
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
        return existingSubscription;
    }

    return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
};

export const serializeBrowserPushSubscription = (subscription: PushSubscription) => {
    const json = subscription.toJSON();

    return {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: json.keys?.p256dh || '',
            auth: json.keys?.auth || '',
        },
    };
};

export const bestEffortUnbindBrowserPushOnLogout = async (token: string) => {
    if (!token || !getBrowserPushSupportDetails().canUse) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (!registration) {
            return;
        }

        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            return;
        }

        await fetch(`${API_BASE_URL}/api/push/subscriptions`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
    } catch (error) {
        console.error('Failed to unbind browser push subscription during logout', error);
    }
};
