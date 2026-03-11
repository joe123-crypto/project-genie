'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, ReactEventHandler } from 'react';
import { Template, VideoTemplate } from '@/types';
import { getTemplates, getVideoTemplates, getTemplateById } from "@/services/firebaseService";

interface TemplateContextType {
    templates: Template[];
    videoTemplates: VideoTemplate[];
    isLoading: boolean;
    currentTemplate: Template | undefined;
    fetchTemplateById: (id: string) => Promise<Template | null>;
    refreshTemplates: () => Promise<void>;
    refreshVideos: () => Promise<void>;
    setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
    setVideoTemplates: React.Dispatch<React.SetStateAction<VideoTemplate[]>>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [templates, setTemplates] = useState<Template[]>([])
    const [videoTemplates, setVideoTemplates] = useState<VideoTemplate[]>([])
    const [isLoading, setIsLoading] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

    const refreshTemplates = useCallback(async () => {
        try {
            const data = await getTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    }, []);

    const refreshVideos = useCallback(async () => {
        try {
            const data = await getVideoTemplates();
            setVideoTemplates(data);
        } catch (error) {
            console.error('Error fetching video templates:', error);
        }
    }, []);

    const fetchTemplateById = useCallback(async (id: string) => {
        const existing = templates.find(t => t.id == id);
        if (existing) {
            setCurrentTemplate(existing);
            return existing;
        }
        setIsLoading(true);
        try {
            const fetched = await getTemplateById(id);
            if (fetched) {
                setCurrentTemplate(fetched);
                setTemplates(prev => {
                    if (prev.find(t => t.id === fetched.id)) return prev;
                    return [...prev, fetched];
                });
            }
            return fetched;
        } finally {
            setIsLoading(false);
        }
    }, [templates]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                refreshTemplates(),
                refreshVideos(),
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [refreshTemplates, refreshVideos]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const value = React.useMemo(() => ({
        templates,
        videoTemplates,
        isLoading,
        currentTemplate: currentTemplate || undefined,
        fetchTemplateById,
        refreshTemplates,
        refreshVideos,
        setTemplates,
        setVideoTemplates
    }), [
        templates,
        videoTemplates,
        isLoading,
        currentTemplate,
        fetchTemplateById,
        refreshTemplates,
        refreshVideos
    ]);

    return (
        <TemplateContext.Provider value={value}>
            {children}
        </TemplateContext.Provider>
    );
};

export const useTemplates = () => {
    const context = useContext(TemplateContext);
    if (context === undefined) {
        throw new Error('useTemplates must be used within a TemplateProvider');
    }
    return context;
};
