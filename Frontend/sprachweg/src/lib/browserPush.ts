import { API_BASE_URL } from './api';

export const PUSH_NOTIFICATION_QUERY_PARAM = 'notificationId';

const PUSH_SERVICE_WORKER_PATH = '/push-sw.js';

export const getBrowserPushEnabledStorageKey = (userId: string) => (
    `browser_push_enabled_${String(userId || '').trim()}`
);

export const clearBrowserPushEnabledFlag = (userId: string) => {
    const key = getBrowserPushEnabledStorageKey(userId);

    if (!key.endsWith('_')) {
        localStorage.removeItem(key);
    }
};

export const isBrowserPushSupported = () => (
    typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
);

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
    if (!isBrowserPushSupported()) {
        throw new Error('Browser push is not supported');
    }

    await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_PATH);
    return navigator.serviceWorker.ready;
};

export const getExistingBrowserPushSubscription = async () => {
    if (!isBrowserPushSupported()) {
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
    if (!token || !isBrowserPushSupported()) {
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
