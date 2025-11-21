import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const scheduleNotification = async (
    title: string,
    body: string,
    largeIcon?: string,
    attachmentUrl?: string
) => {
    if (!Capacitor.isNativePlatform()) {
        console.log('Notifications are only supported on native platforms.');
        return;
    }

    try {
        const permStatus = await LocalNotifications.checkPermissions();

        if (permStatus.display !== 'granted') {
            const newStatus = await LocalNotifications.requestPermissions();
            if (newStatus.display !== 'granted') {
                console.warn('Notification permissions denied.');
                return;
            }
        }

        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: Math.floor(Math.random() * 100000),
                    schedule: { at: new Date(Date.now() + 1000) }, // Schedule for 1 second later
                    sound: undefined,
                    attachments: attachmentUrl ? [{ id: 'image', url: attachmentUrl }] : undefined,
                    largeIcon: largeIcon,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
        console.log('Notification scheduled');
    } catch (error) {
        console.error('Failed to schedule notification:', error);
    }
};
