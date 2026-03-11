'use client';

import ApplyTemplateView from "@/components/ApplyTemplateView";
import { ViewState } from "@/types";
import { useState, useEffect, useCallback, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTemplates } from "@/context/TemplateContext";
import { Template } from '@/types'
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from "@/components/Spinner";
import { BackArrowIcon } from "@/components/icons";
import { commonClasses } from "@/utils/theme";


export default function Page({ params }: { params: Promise<{ username: string; template: string }> }) {
    //const params = useParams();
    const { username, template: templateId } = use(params);
    const router = useRouter();
    const { fetchTemplateById, currentTemplate, isLoading } = useTemplates();
    const { user } = useAuth();
    //const [currentTemplate, setCurrentTemplate] = useState<Template | null | undefined | void>(null);
    const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });

    useEffect(() => {
        fetchTemplateById(templateId);
    }, [templateId, fetchTemplateById]);

    if (isLoading || !currentTemplate || currentTemplate.id !== templateId) {
        return (
            <div className='flex flex-col items-center justify-center pt-20'>
                <Spinner className="h-10 w-10 text-brand-primary" />
                <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${commonClasses.container.base} p-4 sm:p-8`}>
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push(`/${username}/dashboard`)}
                    className="mb-6 flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary transition-colors group"
                >
                    <BackArrowIcon />
                    <span className="font-semibold text-lg">Back to Dashboard</span>
                </button>
                <ApplyTemplateView
                    template={currentTemplate}
                    templateId={templateId}
                    setViewState={setViewState}
                    user={user}
                />
            </div>
        </div>
    );
}
