// Updated dailyTrendService.ts to only call our API routes
import { Filter } from '../types';
import { generateTrendingFilter } from './geminiService';
import { saveFilter } from './firebaseService';

const LAST_TREND_CHECK_KEY = 'lastTrendCheck';

/**
 * Checks if a daily trending filter needs to be generated. If so, it creates one
 * using the Gemini API and saves it to Firestore.
 * @returns A promise that resolves to the newly created Filter object, or null if no filter was created.
 */
export const checkAndGenerateDailyTrend = async (): Promise<Filter | null> => {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
    const lastCheck = localStorage.getItem(LAST_TREND_CHECK_KEY);

    if (lastCheck === today) {
        console.log("Daily trend filter already generated today.");
        return null;
    }

    try {
        // Generate a trending filter using our API
        const trendingFilterData = await generateTrendingFilter();
        
        // Create a complete filter object
        const trendingFilter: Omit<Filter, 'id'> = {
            name: trendingFilterData.name,
            description: trendingFilterData.description,
            prompt: trendingFilterData.prompt,
            previewImageUrl: trendingFilterData.previewImageUrl || "",
            category: 'Trending',
            type: 'single',
            accessCount: 0,
            createdAt: new Date().toISOString()
        };

        // Save the filter to our backend
        const savedFilter = await saveFilter(trendingFilter, ''); // No auth required for trending filters
        
        // Mark today as checked
        localStorage.setItem(LAST_TREND_CHECK_KEY, today);
        
        console.log("Daily trending filter generated and saved:", savedFilter);
        return savedFilter;
    } catch (error) {
        console.error("Error generating daily trending filter:", error);
        // Don't throw the error - this is a non-critical feature
        return null;
    }
};
