'use client';

import React, { useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { scheduleNotification } from '../utils/notificationUtils';

const NotificationManager: React.FC = () => {
    useEffect(() => {
        // Only listen for changes that happen AFTER the component mounts (app starts)
        // We use a slightly delayed timestamp to avoid picking up existing items if the clock is slightly off
        const startTime = new Date();

        // Listen for new filters
        const filtersQuery = query(
            collection(db, 'filters'),
            where('createdAt', '>', Timestamp.fromDate(startTime))
        );

        const unsubscribeFilters = onSnapshot(filtersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    scheduleNotification(
                        'New Filter Available!',
                        `Check out the new "${data.name}" filter!`,
                        'lamp',
                        data.previewImageUrl
                    );
                }
            });
        });

        const outfitsQuery = query(
            collection(db, 'outfits'),
            where('createdAt', '>', Timestamp.fromDate(startTime))
        );

        const unsubscribeOutfits = onSnapshot(outfitsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    scheduleNotification(
                        'New Outfit Created!',
                        `Someone just created a new outfit: "${data.name}"`,
                        'lamp',
                        data.previewImageUrl
                    );
                }
            });
        });

        return () => {
            unsubscribeFilters();
            unsubscribeOutfits();
        };
    }, []);

    return null; // This component doesn't render anything
};

export default NotificationManager;
