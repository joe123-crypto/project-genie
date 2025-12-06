'use client';

import { useState, useCallback, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { Filter, ViewState, User, Outfit, Hairstyle } from "../types";
import CreateMenu from "../components/CreateMenu";
import Marketplace from "../components/Marketplace";
import ApplyFilterView from "../components/ApplyFilterView";
import ApplyOutfitView from "../components/ApplyOutfitView";
import CreateHairstyleView from "../components/CreateHairstyleView";
import ApplyHairstyleView from "../components/ApplyHairstyleView";
import HairstylesView from "../components/HairstylesView";
import OutfitsView from "../components/OutfitsView";
import StudioView from "../components/CreateFilterView";
import AuthView from "../components/AuthView"; // Keep existing AuthView for later access if needed
import SharedImageView from "../components/SharedImageView";
import WelcomeModal from "../components/WelcomeModal";
import { SunIcon, MoonIcon, WhatsAppIcon, SearchIcon } from "../components/icons";
import { getFilters, deleteFilter, incrementFilterAccessCount, updateFilter, getOutfits, incrementOutfitAccessCount, getFilterById, getHairstyles, incrementHairstyleAccessCount, deleteHairstyle, updateHairstyle } from "../services/firebaseService";
import { deleteUser } from "../services/userService";
import { getAuthUser, signOut } from "../services/authService";
import { Spinner } from "../components/Spinner"; // Corrected import for Spinner
import { commonClasses } from "../utils/theme";
import UserIcon from '../components/UserIcon';
import ConfirmationDialog from '../components/ConfirmationDialog';
import ProfileView from '../components/ProfileView';
import Dashboard from '../components/Dashboard';
import FeedView from '../components/FeedView'; // Import FeedView
import { fetchFilterById } from "../services/filterService";
import { InitialAuthView } from "../components/InitialAuthView"; // Import the new InitialAuthView
import SearchView from "../components/SearchView";
import LandingPage from "../components/LandingPage";

const CreateOutfitView = dynamic(() => import('../components/CreateOutfitView'), { ssr: false });

export default function Home() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ view: "initialAuth" });
  const [isLoading, setIsLoading] = useState<boolean>(true); // Combined loading state
  const [user, setUser] = useState<User | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false);
  const [isWeb, setIsWeb] = useState<boolean>(false);

  // Check if running on web platform
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isWebPlatform = platform === 'web';
    setIsWeb(isWebPlatform);

    // Show landing page only on web and if user hasn't dismissed it
    const hasSeenLanding = sessionStorage.getItem('hasSeenLanding');
    if (isWebPlatform && !hasSeenLanding) {
      setShowLandingPage(true);
    }
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (prefersDark) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newIsDark);
  };

  // Pre-fetch data and handle initial state
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      try {
        // Concurrently fetch data and check user session
        const dataPromise = Promise.all([getFilters(), getOutfits()]);
        const userPromise = getAuthUser(); // Use the new getAuthUser function

        const [data, currentUser] = await Promise.all([dataPromise, userPromise]);
        const [fetchedFilters, fetchedOutfits] = data;
        const fetchedHairstyles = await getHairstyles();

        setFilters(fetchedFilters);
        setOutfits(fetchedOutfits);
        setHairstyles(fetchedHairstyles);

        if (currentUser) {
          setUser(currentUser);
          setViewState({ view: "marketplace" });
        } else {
          setViewState({ view: "initialAuth" });
        }

        // Handle initial URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view");
        const filterId = urlParams.get("filterId");
        const shareId = urlParams.get("share");

        if (shareId) {
          setViewState({ view: "shared", shareId });
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (view === "apply" && filterId) {
          const selectedFilter = fetchedFilters.find(f => f.id === filterId) || await getFilterById(filterId);
          if (selectedFilter) {
            setViewState({ view: "apply", filter: selectedFilter });
          } else if (!currentUser) {
            setViewState({ view: "initialAuth" });
          } else {
            setViewState({ view: "marketplace" });
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }

      } catch (err) {
        console.error("Error during initial app load:", err);
        setViewState({ view: "initialAuth" });
      } finally {
        setIsLoading(false);
      }
    };
    initialLoad();
  }, []);

  // Handle successful sign-in from InitialAuthView
  const handleInitialSignInSuccess = useCallback((signedInUser: User) => {
    setUser(signedInUser);
    setViewState({ view: "marketplace" });
    setIsWelcomeModalOpen(true);
  }, []);

  // Handle landing page actions
  const handleGetStarted = useCallback(() => {
    sessionStorage.setItem('hasSeenLanding', 'true');
    setShowLandingPage(false);
    // If user is already signed in, go to marketplace, otherwise show auth
    if (!user) {
      setViewState({ view: "initialAuth" });
    }
  }, [user]);

  const handleLandingSignIn = useCallback(() => {
    sessionStorage.setItem('hasSeenLanding', 'true');
    setShowLandingPage(false);
    setViewState({ view: "initialAuth" });
  }, []);

  const addFilter = useCallback(
    (newFilter: Filter) => setFilters(prev => [newFilter, ...prev]),
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

  const handleDeleteFilter = useCallback(
    async (filterId: string) => {
      if (!user || user.email !== "munemojoseph332@gmail.com")
        throw new Error("No permission to delete filters");
      try {
        await deleteFilter(filterId);
        setFilters(prev => prev.filter(f => f.id !== filterId));
      }
      catch (err) {
        console.error(err);
        throw err;
      }
    },
    [user]
  );

  const handleUpdateFilter = useCallback(
    async (filterToUpdate: Filter) => {
      if (!user || user.email !== "munemojoseph332@gmail.com")
        throw new Error("No permission to update filters");
      try {
        const { id, ...dataToUpdate } = filterToUpdate;
        const updatedFilter = await updateFilter(id, dataToUpdate);
        setFilters(prev => prev.map(f => (f.id === id ? updatedFilter : f)));
      }
      catch (err) {
        console.error(err);
        throw err;
      }
    },
    [user]
  );

  const handleSelectFilter = useCallback(
    (filter: Filter) => {
      setViewState({ view: "apply", filter });
      incrementFilterAccessCount(filter.id);
      setFilters(prevFilters =>
        prevFilters.map(f =>
          f.id === filter.id
            ? { ...f, accessCount: (f.accessCount || 0) + 1 }
            : f
        )
      );
    },
    []
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

  const handleCreateYourOwn = async (filterId: string) => {
    try {
      const filter = await fetchFilterById(filterId);
      setViewState({ view: 'apply', filter });
    }
    catch (error) {
      console.error('Error fetching filter:', error);
      alert('Error fetching filter. Please try again.');
    }
  };

  const handleSignInSuccess = (signedInUser: User) => {
    setUser(signedInUser);
    setViewState({ view: "marketplace" });
    setIsWelcomeModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if sign out fails (e.g. network), we should clear local state
    } finally {
      setUser(null);
      setViewState({ view: "initialAuth" }); // Go back to InitialAuthView on sign out
    }
  };

  const handleRemoveAccount = async () => {
    setShowConfirmDialog(true);
  };

  const confirmRemoveAccount = async () => {
    try {
      await deleteUser();
      handleSignOut();
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setShowConfirmDialog(false);
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

    // If not loading and the view is initialAuth, or if there's no user, show the auth view.
    if ((!isLoading && viewState.view === "initialAuth") || !user) {
      return (
        <div className="flex justify-center items-center h-screen">
          <InitialAuthView onSignInSuccess={handleInitialSignInSuccess} />
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
                  filters={filters}
                  onSelectFilter={handleSelectFilter}
                  user={user}
                  onDeleteFilter={handleDeleteFilter}
                  onEditFilter={(f: Filter) => setViewState({ view: "edit", filter: f })}
                />
              );
            case "apply":
              return <ApplyFilterView filter={viewState.filter!} setViewState={setViewState} user={user} />;
            case "create":
              return (
                <CreateMenu
                  setViewState={setViewState}
                  user={user}
                  addFilter={addFilter}
                  addHairstyle={addHairstyle}
                  onBack={() => setViewState({ view: "create" })}
                />
              );
            case "createOutfit":
              return <CreateOutfitView setViewState={setViewState} user={user} addOutfit={addOutfit} />;
            case "createHairstyle":
              return <CreateHairstyleView
                setViewState={setViewState}
                user={user}
                addHairstyle={addHairstyle}
                hairstyleToEdit={viewState.editingHairstyle}
                onUpdateHairstyle={handleUpdateHairstyle}
              />;
            case "edit":
              return <StudioView setViewState={setViewState} user={user} filterToEdit={viewState.filter} onUpdateFilter={handleUpdateFilter} />;
            case "auth":
              return <AuthView setViewState={setViewState} onSignInSuccess={handleSignInSuccess} />;
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
            case "feed":
              return <FeedView user={user} onCreateYourOwn={handleCreateYourOwn} />;
            case "search":
              return (
                <SearchView
                  filters={filters}
                  outfits={outfits}
                  onSelectFilter={handleSelectFilter}
                  onSelectOutfit={handleSelectOutfit}
                  user={user}
                  onDeleteFilter={handleDeleteFilter}
                  onEditFilter={(f: Filter) => setViewState({ view: "edit", filter: f })}
                />
              );
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  const showDashboard = user && (viewState.view === "marketplace" || viewState.view === "feed" || viewState.view === "outfits" || viewState.view === "hairstyles");

  // Show landing page on web for first-time visitors
  if (isWeb && showLandingPage) {
    return (
      <LandingPage
        onGetStarted={handleGetStarted}
        onSignIn={handleLandingSignIn}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className={`${commonClasses.container.base} min-h-screen flex flex-col ${commonClasses.transitions.default} relative`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Blurred background overlay */}
      {user && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
        </div>
      )}

      <div className="flex-grow p-4 sm:p-6 md:p-8 pb-56 sm:pb-24 relative z-10">
        {user && (
          <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setViewState({ view: "marketplace" })}
            >
              <img src="/lamp.png" alt="Genie Lamp" className="h-8 w-8" />
              <h1 className={`text-2xl sm:text-3xl ${commonClasses.text.heading}`}>
                GenAIe
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <>
                <button
                  onClick={() => setViewState({ view: "create" })}
                  className={commonClasses.button.primary}
                >
                  Create
                </button>
                <UserIcon
                  user={user}
                  onSignOut={handleSignOut}
                  onGoToProfile={() => setViewState({ view: "profile", user: user })}
                  onRemoveAccount={handleRemoveAccount}
                />
              </>
              <button
                className={commonClasses.button.icon}
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </header>
        )}

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
                Filters
              </button>
              <button
                onClick={() => setViewState({ view: "outfits" })}
                className={`py-3 font-semibold transition-colors ${viewState.view === "outfits"
                  ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                  : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
                  }`}
              >
                Outfits
              </button>
              <button
                onClick={() => setViewState({ view: "hairstyles" })}
                className={`py-3 font-semibold transition-colors ${viewState.view === "hairstyles"
                  ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                  : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
                  }`}
              >
                Hairstyles
              </button>

            </div>
          </div>
        )}

        {renderView()}
      </div>

      {isWelcomeModalOpen && (
        <WelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={() => setIsWelcomeModalOpen(false)}
        />
      )}
      {showConfirmDialog && (
        <ConfirmationDialog
          message="Are you sure you want to remove your account? This action is irreversible."
          onConfirm={confirmRemoveAccount}
          onCancel={() => setShowConfirmDialog(false)}
        />
      )}

      {showDashboard && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="mx-auto w-full max-w-xl p-4 pointer-events-auto">
            <Dashboard setViewState={setViewState} addFilter={addFilter} />
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
