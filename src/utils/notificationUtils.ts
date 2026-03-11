export const scheduleNotification = async (
    title: string,
    body: string,
    _largeIcon?: string,
    attachmentUrl?: string
) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Browser notifications are not supported in this environment.');
        return;
    }

    try {
        let permission = Notification.permission;

        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('Notification permissions denied.');
            return;
        }

        window.setTimeout(() => {
            const notification = new Notification(title, {
                body,
                icon: attachmentUrl ?? '/lamp.png',
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }, 1000);

        console.log('Notification scheduled');
    } catch (error) {
        console.error('Failed to schedule notification:', error);
    }
};
