self.addEventListener('push', (event) => {
    event.waitUntil((async () => {
        if (!event.data) {
            return;
        }

        const payload = event.data.json();
        const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const hasVisibleClient = windowClients.some((client) => client.visibilityState === 'visible');

        if (hasVisibleClient) {
            return;
        }

        await self.registration.showNotification(payload.title || 'SprachWeg', {
            body: payload.body || '',
            icon: '/sovir-logo.png',
            badge: '/sovir-logo.png',
            tag: payload.notificationId ? `notification-${payload.notificationId}` : undefined,
            data: {
                notificationId: payload.notificationId || null,
                linkPath: payload.linkPath || '/',
            },
        });
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil((async () => {
        const notificationId = event.notification.data?.notificationId;
        const linkPath = event.notification.data?.linkPath || '/';
        const targetUrl = new URL(linkPath, self.location.origin);

        if (notificationId) {
            targetUrl.searchParams.set('notificationId', notificationId);
        }

        const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        for (const client of windowClients) {
            if (client.url.startsWith(self.location.origin)) {
                await client.focus();

                if ('navigate' in client) {
                    await client.navigate(targetUrl.toString());
                }

                return;
            }
        }

        await self.clients.openWindow(targetUrl.toString());
    })());
});
