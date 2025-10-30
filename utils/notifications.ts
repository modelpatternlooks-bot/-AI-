/**
 * Checks for notification permission and requests it if not already granted or denied.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn("This browser does not support desktop notification.");
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    // Only request if the user hasn't actively denied it.
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

/**
 * Displays a browser notification if permission has been granted.
 * @param {string} title - The title of the notification.
 * @param {NotificationOptions} [options] - Optional notification options (e.g., body, icon).
 */
export const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) {
        return;
    }

    const notificationOptions: NotificationOptions = {
        icon: '/icons/icon-192x192.png', // App icon
        ...options,
    };
    
    // Ensure the service worker is ready before creating the notification
    // This allows the notification to be managed by the service worker,
    // making it more robust.
    navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, notificationOptions);
    });
};
