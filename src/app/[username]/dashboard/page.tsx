'use client';

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Template, ViewState, User, Outfit, Hairstyle, VideoTemplate } from "@/types";
import Marketplace from "@/components/Marketplace";
import ApplyTemplateView from "@/components/ApplyTemplateView";
import ApplyOutfitView from "@/components/ApplyOutfitView";
import ApplyHairstyleView from "@/components/ApplyHairstyleView";
import HairstylesView from "@/components/HairstylesView";
import OutfitsView from "@/components/OutfitsView";
import VideosView from "@/components/VideosView";
import ApplyVideoView from "@/components/ApplyVideoView";
import SharedImageView from "@/components/SharedImageView";
import { SunIcon, MoonIcon, WhatsAppIcon, SearchIcon } from "@/components/icons";
import { getTemplates, deleteTemplate, incrementTemplateAccessCount, updateTemplate, getOutfits, incrementOutfitAccessCount, getTemplateById, getHairstyles, incrementHairstyleAccessCount, deleteHairstyle, updateHairstyle, getVideoTemplates, incrementVideoAccessCount } from "@/services/firebaseService";
import { Spinner } from "@/components/Spinner";
import { commonClasses } from "@/utils/theme";
import ProfileView from '@/components/ProfileView';
import DashboardBar from '@/components/DashboardBar';
import { fetchTemplateById } from "@/services/templateService";
import SearchView from "@/components/SearchView";
import { useAuth } from '@/context/AuthContext';
import { useTemplates } from '@/context/TemplateContext';

export default function Page() {
    const { user, logout, login, isLoading: authLoading } = useAuth();
    //const [templates, setTemplates] = useState<Template[]>([]);
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
    //const [videoTemplates, setVideoTemplates] = useState<VideoTemplate[]>([]);
    const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
    const params = useParams();
    //const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    const { templates, videoTemplates,
        isLoading, setTemplates, setVideoTemplates } = useTemplates();
    // Pre-fetch data and handle initial state

    const addTemplate = useCallback(
        (newTemplate: Template) => setTemplates(prev => [newTemplate, ...prev]),
        []
    );

    const addOutfit = useCallback(
        (newOutfit: Outfit) => setOutfits(prev => [newOutfit, ...prev]),
        []
    );

    const addHairstyle = useCallback(
        (newHairstyle: Hairstyle) => setHairstyles(prev => [newHairstyle, ...prev]),
        []
    );

    const handleDeleteTemplate = useCallback(
        async (templateId: string) => {
            if (!user || user.email !== "munemojoseph332@gmail.com")
                throw new Error("No permission to delete templates");
            try {
                await deleteTemplate(templateId);
                setTemplates(prev => prev.filter(t => t.id !== templateId));
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        },
        [user]
    );

    const handleUpdateTemplate = useCallback(
        async (templateToUpdate: Template) => {
            if (!user || user.email !== "munemojoseph332@gmail.com")
                throw new Error("No permission to update templates");
            try {
                const { id, ...dataToUpdate } = templateToUpdate;
                const updatedTemplate = await updateTemplate(id, dataToUpdate);
                setTemplates(prev => prev.map(t => (t.id === id ? updatedTemplate : t)));
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        },
        [user]
    );

    const handleSelectTemplate = useCallback(
        (template: Template) => {
            //setViewState({ view: "apply", template });
            //console.log("template in dashboard", template);
            router.push(`/${user?.displayName ||
                user?.username}/dashboard/${template.id}`);
            /*incrementTemplateAccessCount(template.id);
            setTemplates(prevTemplates =>
                prevTemplates.map(t =>
                    t.id === template.id
                        ? { ...t, accessCount: (t.accessCount || 0) + 1 }
                        : t
                )
            );*/
        },
        [user, router]
    );

    const handleSelectOutfit = useCallback(
        (outfit: Outfit) => {
            setViewState({ view: "applyOutfit", outfit });
            incrementOutfitAccessCount(outfit.id);
            setOutfits(prevOutfits =>
                prevOutfits.map(o =>
                    o.id === outfit.id
                        ? { ...o, accessCount: (o.accessCount || 0) + 1 }
                        : o
                )
            );
        },
        []
    );

    const handleSelectHairstyle = useCallback(
        (hairstyle: Hairstyle) => {
            setViewState({ view: "applyHairstyle", hairstyle });
            incrementHairstyleAccessCount(hairstyle.id);
            setHairstyles(prevHairstyles =>
                prevHairstyles.map(h =>
                    h.id === hairstyle.id
                        ? { ...h, accessCount: (h.accessCount || 0) + 1 }
                        : h
                )
            );
        },
        []
    );

    const handleDeleteHairstyle = useCallback(
        async (hairstyleId: string) => {
            if (!user) throw new Error("Must be logged in");
            try {
                await deleteHairstyle(hairstyleId);
                setHairstyles(prev => prev.filter(h => h.id !== hairstyleId));
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        },
        [user]
    );

    const handleUpdateHairstyle = useCallback(
        async (hairstyleToUpdate: Hairstyle) => {
            if (!user) throw new Error("Must be logged in");
            try {
                const { id, ...dataToUpdate } = hairstyleToUpdate;
                const updatedHairstyle = await updateHairstyle(id, dataToUpdate);
                setHairstyles(prev => prev.map(h => (h.id === id ? updatedHairstyle : h)));
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        },
        [user]
    );

    const handleSelectVideo = useCallback(
        (videoTemplate: VideoTemplate) => {
            setViewState({ view: "applyVideo", videoTemplate });
            incrementVideoAccessCount(videoTemplate.id);
            setVideoTemplates(prevVideos =>
                prevVideos.map(v =>
                    v.id === videoTemplate.id
                        ? { ...v, accessCount: (v.accessCount || 0) + 1 }
                        : v
                )
            );
        },
        []
    );
    const handleSignInSuccess = (signedInUser: User) => {
        login(signedInUser);
        setIsWelcomeModalOpen(true);

        router.push(`/${signedInUser.displayName ||
            signedInUser.username}/dashboard`);
    };
    const handleCreateYourOwn = async (templateId: string) => {
        try {
            const template = await fetchTemplateById(templateId);
            setViewState({ view: 'apply', template });
        }
        catch (error) {
            console.error('Error fetching template:', error);
            alert('Error fetching template. Please try again.');
        }
    };

    // Swipe Navigation State
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | "none">("none");
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const tabs = ["search", "marketplace", "outfits", "hairstyles"];
            const currentIndex = tabs.indexOf(viewState.view);

            if (currentIndex !== -1) {
                if (isLeftSwipe && currentIndex < tabs.length - 1) {
                    setTransitionDirection("left");
                    const nextView = tabs[currentIndex + 1] as "search" | "marketplace" | "outfits" | "hairstyles" | "feed";
                    setViewState({ view: nextView });
                } else if (isRightSwipe && currentIndex > 0) {
                    setTransitionDirection("right");
                    const prevView = tabs[currentIndex - 1] as "search" | "marketplace" | "outfits" | "hairstyles" | "feed";
                    setViewState({ view: prevView });
                }
            }
        }
    };

    const renderView = () => {
        if (authLoading || (isLoading && user) || !(user)) {
            return (
                <div className='flex flex-col items-center justify-center pt-20'>
                    <Spinner className="h-10 w-10 text-brand-primary" />
                    <p>Loading...</p>
                </div>
            );
        }

        // If loading, and we either have a user or are not on the auth screen, show a spinner.
        if (isLoading && (user || viewState.view !== 'initialAuth')) {
            return (
                <div className="flex flex-col items-center justify-center pt-20">
                    <Spinner className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
                    <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">
                        Loading...
                    </p>
                </div>
            );
        }
        const animationClass = transitionDirection === "left" ? "animate-slide-left" : transitionDirection === "right" ? "animate-slide-right" : "animate-fade-in";

        return (
            <div key={viewState.view} className={animationClass}>
                {(() => {
                    switch (viewState.view) {
                        case "marketplace":
                            return (
                                <Marketplace
                                    templates={templates}
                                    onSelectTemplate={handleSelectTemplate}
                                    user={user}
                                    onDeleteTemplate={handleDeleteTemplate}
                                    onEditTemplate={(t: Template) => setViewState({ view: "edit", template: t })}
                                />
                            );
                        /*case "apply":
                            return <ApplyTemplateView template={viewState.template!} setViewState={setViewState} user={user} />;*/
                        case "shared":
                            return <SharedImageView shareId={viewState.shareId!} setViewState={setViewState} />;
                        case "profile":
                            return <ProfileView user={viewState.user || user!} currentUser={user} setViewState={setViewState} onCreateYourOwn={handleCreateYourOwn} />;
                        case "outfits":
                            return <OutfitsView outfits={outfits} onSelectOutfit={handleSelectOutfit} />;
                        case "applyOutfit":
                            return (
                                <ApplyOutfitView
                                    outfit={viewState.outfit!}
                                    user={user}
                                />
                            );
                        case "hairstyles":
                            return <HairstylesView
                                hairstyles={hairstyles}
                                onSelectHairstyle={handleSelectHairstyle}
                                user={user}
                                onDeleteHairstyle={handleDeleteHairstyle}
                                onEditHairstyle={(h) => setViewState({ view: "createHairstyle", editingHairstyle: h })}
                            />;
                        case "applyHairstyle":
                            return (
                                <ApplyHairstyleView
                                    hairstyle={viewState.hairstyle!}
                                    user={user}
                                />
                            );
                        case "search":
                            return (
                                <SearchView
                                    templates={templates}
                                    outfits={outfits}
                                    onSelectTemplate={handleSelectTemplate}
                                    onSelectOutfit={handleSelectOutfit}
                                    user={user}
                                    onDeleteTemplate={handleDeleteTemplate}
                                    onEditTemplate={(t: Template) => setViewState({ view: "edit", template: t })}
                                />
                            );
                        case "videos":
                            return <VideosView videos={videoTemplates} onSelectVideo={handleSelectVideo} user={user} />;
                        case "applyVideo":
                            return <ApplyVideoView videoTemplate={viewState.videoTemplate!} setViewState={setViewState} user={user} />;
                        default:
                            return null;
                    }
                })()}
            </div>
        );
    };

    const showDashboard = user && (viewState.view === "marketplace" || viewState.view === "feed" || viewState.view === "outfits" || viewState.view === "hairstyles");

    return (
        <div
            className={`${commonClasses.container.base} min-h-screen flex flex-col ${commonClasses.transitions.default} relative`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {user && (
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex justify-center gap-8 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewState({ view: "search" })}
                            className={`py-3 px-4 transition-colors ${viewState.view === "search"
                                ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                                : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
                                }`}
                            aria-label="Search"
                        >
                            <SearchIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewState({ view: "marketplace" })}
                            className={`py-3 font-semibold transition-colors ${viewState.view === "marketplace"
                                ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                                : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
                                }`}
                        >
                            Templates
                        </button>
                        <button
                            onClick={() => setViewState({ view: "videos" })}
                            className={`py-3 font-semibold transition-colors ${viewState.view === "videos"
                                ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                                : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
                                }`}
                        >
                            Videos
                        </button>
                    </div>
                </div>
            )}

            {renderView()}

            {showDashboard && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
                    <div className="mx-auto w-full max-w-xl p-4 pointer-events-auto">
                        <DashboardBar setViewState={setViewState} addTemplate={addTemplate} />
                    </div>
                    <div className="w-full py-2 text-center pointer-events-none">
                        <p className="text-xs text-white font-medium mix-blend-difference opacity-80">
                            © {new Date().getFullYear()} Genie. All rights reserved.
                        </p>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
                <div className="flex justify-end p-4">
                    <a href="https://chat.whatsapp.com/ERJZxNP5UpCF8Fp1JECUK0" target="_blank" rel="noopener noreferrer" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2 pointer-events-auto">
                        <WhatsAppIcon />
                        <span className="hidden sm:inline">Join community for support</span>
                    </a>
                </div>
            </div>
        </div>
    );
}