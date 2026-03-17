'use client';

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Template,
    VideoTemplate,
    ViewState,
} from "@/types";
import Marketplace from "@/components/Marketplace";
import VideosView from "@/components/VideosView";
import ApplyVideoView from "@/components/ApplyVideoView";
import SharedImageView from "@/components/SharedImageView";
import { SearchIcon, WhatsAppIcon } from "@/components/icons";
import {
    deleteTemplate,
    incrementTemplateAccessCount,
    incrementVideoAccessCount,
} from "@/services/firebaseService";
import { Spinner } from "@/components/Spinner";
import { commonClasses, studioClasses } from "@/utils/theme";
import ProfileView from "@/components/ProfileView";
import DashboardBar from "@/components/DashboardBar";
import SearchView from "@/components/SearchView";
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
    { tab: "search", label: "Search", icon: SearchIcon },
];

const swipeTabs: DashboardTab[] = ["search", "marketplace", "videos"];

export default function Page() {
    const { user, isLoading: authLoading } = useAuth();
    const { templates, videoTemplates, isLoading, setTemplates } = useTemplates();
    const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [transitionDirection, setTransitionDirection] = useState<"left" | "right" | "none">("none");
    const minSwipeDistance = 50;
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const username = (Array.isArray(params.username) ? params.username[0] : params.username) || '';
    const requestedTabParam = searchParams.get("tab");
    const requestedTab = getDashboardTab(requestedTabParam);

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
        if (!username || !requestedTabParam || requestedTabParam === requestedTab) {
            return;
        }

        router.replace(buildDashboardHref(username, requestedTab));
    }, [requestedTab, requestedTabParam, router, username]);

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
                                    onOpenTemplate={handleSelectTemplate}
                                />
                            );
                        case "search":
                            return (
                                <SearchView
                                    templates={templates}
                                    videoTemplates={videoTemplates}
                                    onSelectTemplate={handleSelectTemplate}
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
                    <div className="studio-panel-soft scrollbar-hidden flex gap-2 overflow-x-auto rounded-full p-2">
                        {dashboardNavItems.map(({ tab, label, icon: Icon }) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => navigateToTab(tab)}
                                className={requestedTab === tab ? studioClasses.tabActive : studioClasses.tabInactive}
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
                        <p className="text-xs uppercase tracking-[0.28em] text-content-300 dark:text-dark-content-300">
                            &copy; {new Date().getFullYear()} Genie. All rights reserved.
                        </p>
                    </div>
                </div>
            )}

            <a
                href="https://chat.whatsapp.com/ERJZxNP5UpCF8Fp1JECUK0"
                target="_blank"
                rel="noopener noreferrer"
                className={`fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#19c463] px-4 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(25,196,99,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#16af58] ${showDashboardBar ? "bottom-24 sm:bottom-6" : "bottom-4"
                    }`}
            >
                <WhatsAppIcon />
                <span className="hidden sm:inline">Join community for support</span>
            </a>
        </div>
    );
}
