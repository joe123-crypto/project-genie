'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Hairstyle,
    Outfit,
    Template,
    VideoTemplate,
    ViewState,
} from "@/types";
import Marketplace from "@/components/Marketplace";
import ApplyOutfitView from "@/components/ApplyOutfitView";
import ApplyHairstyleView from "@/components/ApplyHairstyleView";
import HairstylesView from "@/components/HairstylesView";
import OutfitsView from "@/components/OutfitsView";
import VideosView from "@/components/VideosView";
import ApplyVideoView from "@/components/ApplyVideoView";
import SharedImageView from "@/components/SharedImageView";
import { SearchIcon, WhatsAppIcon } from "@/components/icons";
import {
    deleteHairstyle,
    deleteTemplate,
    getHairstyles,
    getOutfits,
    incrementHairstyleAccessCount,
    incrementOutfitAccessCount,
    incrementTemplateAccessCount,
    incrementVideoAccessCount,
} from "@/services/firebaseService";
import { Spinner } from "@/components/Spinner";
import { commonClasses } from "@/utils/theme";
import ProfileView from "@/components/ProfileView";
import DashboardBar from "@/components/DashboardBar";
import SearchView from "@/components/SearchView";
import StatusBanner from "@/components/StatusBanner";
import { useAuth } from "@/context/AuthContext";
import { useTemplates } from "@/context/TemplateContext";
import {
    buildDashboardHref,
    DashboardTab,
    getDashboardTab,
    getDashboardTabFromView,
} from "@/utils/dashboard";

const dashboardNavItems: Array<{
    tab: DashboardTab;
    label: string;
    icon?: typeof SearchIcon;
}> = [
    { tab: "marketplace", label: "Templates" },
    { tab: "videos", label: "Videos" },
    { tab: "outfits", label: "Outfits" },
    { tab: "hairstyles", label: "Hairstyles" },
    { tab: "search", label: "Search", icon: SearchIcon },
];

export default function Page() {
    const { user, isLoading: authLoading } = useAuth();
    const { templates, videoTemplates, isLoading, setTemplates } = useTemplates();
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
    const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });
    const [contentError, setContentError] = useState<string | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | "none">("none");
    const minSwipeDistance = 50;
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const username = (Array.isArray(params.username) ? params.username[0] : params.username) || '';
    const requestedTab = getDashboardTab(searchParams.get("tab"));

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/login");
        }
    }, [authLoading, router, user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        setViewState((current) => {
            const currentTab = getDashboardTabFromView(current.view);

            if (currentTab === requestedTab) {
                if (current.view === "profile" && current.user?.uid !== user.uid) {
                    return { view: "profile", user };
                }
                return current;
            }

            return requestedTab === "profile"
                ? { view: "profile", user }
                : { view: requestedTab };
        });
    }, [requestedTab, user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        const loadSupplementalCollections = async () => {
            try {
                const [nextOutfits, nextHairstyles] = await Promise.all([
                    getOutfits(),
                    getHairstyles(),
                ]);

                if (cancelled) {
                    return;
                }

                setOutfits(nextOutfits);
                setHairstyles(nextHairstyles);
                setContentError(null);
            } catch (error) {
                console.error("Failed to load outfits or hairstyles:", error);
                if (!cancelled) {
                    setContentError(
                        "Some collections could not be loaded. Templates and videos are still available."
                    );
                }
            }
        };

        void loadSupplementalCollections();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const addTemplate = useCallback(
        (newTemplate: Template) => setTemplates((prev) => [newTemplate, ...prev]),
        [setTemplates]
    );

    const handleDeleteTemplate = useCallback(
        async (templateId: string) => {
            if (!user || user.email !== "munemojoseph332@gmail.com") {
                throw new Error("No permission to delete templates");
            }

            await deleteTemplate(templateId);
            setTemplates((prev) => prev.filter((template) => template.id !== templateId));
        },
        [setTemplates, user]
    );

    const handleEditTemplate = useCallback(
        (template: Template) => {
            router.push(
                `/${username}/createmenu/templateTemplate?templateId=${template.id}`
            );
        },
        [router, username]
    );

    const handleSelectTemplate = useCallback(
        (template: Template) => {
            void incrementTemplateAccessCount(template.id);
            setTemplates((prevTemplates) =>
                prevTemplates.map((currentTemplate) =>
                    currentTemplate.id === template.id
                        ? {
                            ...currentTemplate,
                            accessCount: (currentTemplate.accessCount || 0) + 1,
                        }
                        : currentTemplate
                )
            );
            router.push(`/${username}/dashboard/${template.id}`);
        },
        [router, setTemplates, username]
    );

    const handleSelectOutfit = useCallback((outfit: Outfit) => {
        setViewState({ view: "applyOutfit", outfit });
        void incrementOutfitAccessCount(outfit.id);
        setOutfits((prevOutfits) =>
            prevOutfits.map((currentOutfit) =>
                currentOutfit.id === outfit.id
                    ? { ...currentOutfit, accessCount: (currentOutfit.accessCount || 0) + 1 }
                    : currentOutfit
            )
        );
    }, []);

    const handleSelectHairstyle = useCallback((hairstyle: Hairstyle) => {
        setViewState({ view: "applyHairstyle", hairstyle });
        void incrementHairstyleAccessCount(hairstyle.id);
        setHairstyles((prevHairstyles) =>
            prevHairstyles.map((currentHairstyle) =>
                currentHairstyle.id === hairstyle.id
                    ? {
                        ...currentHairstyle,
                        accessCount: (currentHairstyle.accessCount || 0) + 1,
                    }
                    : currentHairstyle
            )
        );
    }, []);

    const handleDeleteHairstyle = useCallback(
        async (hairstyleId: string) => {
            if (!user) {
                throw new Error("Must be logged in");
            }

            await deleteHairstyle(hairstyleId);
            setHairstyles((prev) => prev.filter((hairstyle) => hairstyle.id !== hairstyleId));
        },
        [user]
    );

    const handleSelectVideo = useCallback((videoTemplate: VideoTemplate) => {
        setViewState({ view: "applyVideo", videoTemplate });
        void incrementVideoAccessCount(videoTemplate.id);
    }, []);

    const navigateToTab = useCallback(
        (tab: DashboardTab) => {
            if (!username) {
                return;
            }

            setTransitionDirection("none");
            setViewState(tab === "profile" && user ? { view: "profile", user } : { view: tab });
            router.replace(buildDashboardHref(username, tab));
        },
        [router, user, username]
    );

    const onTouchStart = (event: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(event.targetTouches[0].clientX);
    };

    const onTouchMove = (event: React.TouchEvent) => {
        setTouchEnd(event.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        const swipeTabs: DashboardTab[] = [
            "search",
            "marketplace",
            "videos",
            "outfits",
            "hairstyles",
        ];

        const currentIndex = swipeTabs.indexOf(requestedTab);

        if (currentIndex === -1) {
            return;
        }

        if (isLeftSwipe && currentIndex < swipeTabs.length - 1) {
            setTransitionDirection("left");
            navigateToTab(swipeTabs[currentIndex + 1]);
        } else if (isRightSwipe && currentIndex > 0) {
            setTransitionDirection("right");
            navigateToTab(swipeTabs[currentIndex - 1]);
        }
    };

    const renderView = () => {
        if (authLoading || !user) {
            return (
                <div className="flex flex-col items-center justify-center pt-20">
                    <Spinner className="h-10 w-10 text-brand-primary" />
                    <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">
                        {authLoading ? "Loading your workspace..." : "Redirecting to sign in..."}
                    </p>
                </div>
            );
        }

        if (
            isLoading &&
            templates.length === 0 &&
            videoTemplates.length === 0 &&
            (requestedTab === "marketplace" ||
                requestedTab === "videos" ||
                requestedTab === "search")
        ) {
            return (
                <div className="flex flex-col items-center justify-center pt-20">
                    <Spinner className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
                    <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">
                        Loading your content...
                    </p>
                </div>
            );
        }

        const animationClass =
            transitionDirection === "left"
                ? "animate-slide-left"
                : transitionDirection === "right"
                    ? "animate-slide-right"
                    : "animate-fade-in";

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
                                    onEditTemplate={handleEditTemplate}
                                />
                            );
                        case "shared":
                            return (
                                <SharedImageView
                                    shareId={viewState.shareId}
                                    setViewState={setViewState}
                                />
                            );
                        case "profile":
                            return (
                                <ProfileView
                                    user={viewState.user || user}
                                    currentUser={user}
                                    onBackToDashboard={() => navigateToTab("marketplace")}
                                    onSelectOutfit={handleSelectOutfit}
                                    onOpenTemplate={handleSelectTemplate}
                                />
                            );
                        case "outfits":
                            return (
                                <OutfitsView
                                    outfits={outfits}
                                    onSelectOutfit={handleSelectOutfit}
                                />
                            );
                        case "applyOutfit":
                            return <ApplyOutfitView outfit={viewState.outfit} user={user} />;
                        case "hairstyles":
                            return (
                                <HairstylesView
                                    hairstyles={hairstyles}
                                    onSelectHairstyle={handleSelectHairstyle}
                                    user={user}
                                    onDeleteHairstyle={handleDeleteHairstyle}
                                />
                            );
                        case "applyHairstyle":
                            return (
                                <ApplyHairstyleView
                                    hairstyle={viewState.hairstyle}
                                    user={user}
                                />
                            );
                        case "search":
                            return (
                                <SearchView
                                    templates={templates}
                                    outfits={outfits}
                                    hairstyles={hairstyles}
                                    videoTemplates={videoTemplates}
                                    onSelectTemplate={handleSelectTemplate}
                                    onSelectOutfit={handleSelectOutfit}
                                    onSelectHairstyle={handleSelectHairstyle}
                                    onSelectVideo={handleSelectVideo}
                                    user={user}
                                    onDeleteTemplate={handleDeleteTemplate}
                                    onEditTemplate={handleEditTemplate}
                                />
                            );
                        case "videos":
                            return (
                                <VideosView
                                    videos={videoTemplates}
                                    onSelectVideo={handleSelectVideo}
                                    user={user}
                                />
                            );
                        case "applyVideo":
                            return (
                                <ApplyVideoView
                                    videoTemplate={viewState.videoTemplate}
                                    setViewState={setViewState}
                                    user={user}
                                />
                            );
                        default:
                            return null;
                    }
                })()}
            </div>
        );
    };

    const showDashboardBar = user && viewState.view === "marketplace";

    return (
        <div
            className={`${commonClasses.container.base} relative flex min-h-screen flex-col ${commonClasses.transitions.default}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {user && (
                <div className="mx-auto mb-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    {contentError && (
                        <StatusBanner
                            kind="info"
                            message={contentError}
                            className="mb-4"
                        />
                    )}

                    <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-1 dark:border-gray-700">
                        {dashboardNavItems.map(({ tab, label, icon: Icon }) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => navigateToTab(tab)}
                                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-sm font-semibold transition-colors ${requestedTab === tab
                                    ? "bg-brand-primary/10 text-brand-primary dark:bg-dark-brand-primary/10 dark:text-dark-brand-primary"
                                    : "text-content-200 hover:bg-black/[0.04] hover:text-content-100 dark:text-dark-content-200 dark:hover:bg-white/5 dark:hover:text-dark-content-100"
                                    }`}
                            >
                                {Icon ? <Icon className="h-4 w-4" /> : null}
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {renderView()}

            {showDashboardBar && (
                <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[100]">
                    <div className="pointer-events-auto mx-auto w-full max-w-xl p-4">
                        <DashboardBar
                            addTemplate={addTemplate}
                            username={username}
                        />
                    </div>
                    <div className="pointer-events-none w-full py-2 text-center">
                        <p className="text-xs font-medium text-white opacity-80 mix-blend-difference">
                            &copy; {new Date().getFullYear()} Genie. All rights reserved.
                        </p>
                    </div>
                </div>
            )}

            <a
                href="https://chat.whatsapp.com/ERJZxNP5UpCF8Fp1JECUK0"
                target="_blank"
                rel="noopener noreferrer"
                className={`fixed right-4 z-40 flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 font-bold text-white shadow-lg transition-colors hover:bg-green-600 ${showDashboardBar ? "bottom-24 sm:bottom-6" : "bottom-4"
                    }`}
            >
                <WhatsAppIcon />
                <span className="hidden sm:inline">Join community for support</span>
            </a>
        </div>
    );
}
