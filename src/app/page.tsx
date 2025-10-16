'use client';

import { useState, useCallback, useEffect } from "react";
import { Filter, ViewState, User, Outfit } from "../types";
import CreateMenu from "../components/CreateMenu";
import Marketplace from "../components/Marketplace";
import ApplyFilterView from "../components/ApplyFilterView";
import ApplyOutfitView from "../components/ApplyOutfitView";
import StudioView from "../components/CreateFilterView";
import AuthView from "../components/AuthView";
import SharedImageView from "../components/SharedImageView";
import WelcomeModal from "../components/WelcomeModal";
import { SunIcon, MoonIcon, WhatsAppIcon } from "../components/icons";
import { getFilters, deleteFilter, incrementFilterAccessCount, updateFilter, getOutfits, incrementOutfitAccessCount, getFilterById } from "../services/firebaseService";
import { loadUserSession, signOut, getValidIdToken } from "../services/authService";
import Spinner from "../components/Spinner";
import { commonClasses } from "../utils/theme";

// Only cache minimal filter info
interface CachedFilter {
  id: string;
  name: string;
  accessCount?: number;
  previewImageUrl?: string;
}

// Only cache minimal outfit info
interface CachedOutfit {
  id: string;
  name: string;
  accessCount?: number;
  previewImageUrl?: string;
}

export default function Home() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState(false);

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

  // Load cached filters first
  useEffect(() => {
    const cached = localStorage.getItem("filters");
    if (cached) {
      try {
        const parsed: CachedFilter[] = JSON.parse(cached);
        setFilters(parsed.map(f => ({ ...f } as Filter)));
      } catch {
        localStorage.removeItem("filters");
      }
    }
  }, []);

  // Load cached outfits first
  useEffect(() => {
    const cached = localStorage.getItem("outfits");
    if (cached) {
      try {
        const parsed: CachedOutfit[] = JSON.parse(cached);
        setOutfits(parsed.map(o => ({ ...o } as Outfit)));
      } catch {
        localStorage.removeItem("outfits");
      }
    }
  }, []);

  // Initialize app: fetch full filters and outfits from backend
  useEffect(() => {
    const currentUser = loadUserSession();
    if (currentUser) setUser(currentUser);

    const initializeApp = async () => {
      try {
        setIsLoading(true);
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view");
        const filterId = urlParams.get("filterId");
        const shareId = urlParams.get("share");

        if (shareId) {
          setViewState({ view: "shared", shareId });
          window.history.replaceState({}, document.title, window.location.pathname);
        } else if (view === "apply" && filterId) {
          // Fetch the specific filter if the view is 'apply'
          const selectedFilter = await getFilterById(filterId);
          if (selectedFilter) {
            setViewState({ view: "apply", filter: selectedFilter });
          } else {
            // Fallback to marketplace if filter not found
            setViewState({ view: "marketplace" });
          }
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setViewState({ view: "marketplace" });
        }

        const fetchedFilters = await getFilters();
        setFilters(fetchedFilters);

        // Save minimal info to localStorage
        const minimalCache: CachedFilter[] = fetchedFilters.map(f => ({
          id: f.id,
          name: f.name,
          accessCount: f.accessCount,
          previewImageUrl: f.previewImageUrl,
        }));
        localStorage.setItem("filters", JSON.stringify(minimalCache));

        // Fetch outfits from Firestore "outfits" collection
        const fetchedOutfits = await getOutfits();
        setOutfits(fetchedOutfits);
        const minimalOutfitCache: CachedOutfit[] = fetchedOutfits.map(o => ({
          id: o.id,
          name: o.name,
          accessCount: o.accessCount,
          previewImageUrl: o.previewImageUrl,
        }));
        localStorage.setItem("outfits", JSON.stringify(minimalOutfitCache));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  // Update local cache whenever filters change
  const updateLocalCache = (updatedFilters: Filter[]) => {
    setFilters(updatedFilters);
    const minimalCache: CachedFilter[] = updatedFilters.map(f => ({
      id: f.id,
      name: f.name,
      accessCount: f.accessCount,
      previewImageUrl: f.previewImageUrl,
    }));
    try {
      localStorage.setItem("filters", JSON.stringify(minimalCache));
    } catch {
      console.warn("Failed to update localStorage cache: size exceeded");
    }
  };

  // Update local cache whenever outfits change
  const updateLocalOutfitCache = (updatedOutfits: Outfit[]) => {
    setOutfits(updatedOutfits);
    const minimalCache: CachedOutfit[] = updatedOutfits.map(o => ({
      id: o.id,
      name: o.name,
      accessCount: o.accessCount,
      previewImageUrl: o.previewImageUrl,
    }));
    try {
      localStorage.setItem("outfits", JSON.stringify(minimalCache));
    } catch {
      console.warn("Failed to update localStorage cache: size exceeded");
    }
  };

  // Filter handlers
  const addFilter = useCallback(
    (newFilter: Filter) => updateLocalCache([newFilter, ...filters]),
    [filters]
  );

  const handleDeleteFilter = useCallback(
    async (filterId: string) => {
      if (!user || user.email !== "munemojoseph332@gmail.com")
        throw new Error("No permission to delete filters");
      try {
        const idToken = await getValidIdToken();
        if (!idToken) throw new Error("Session expired");
        await deleteFilter(filterId, idToken);
        updateLocalCache(filters.filter(f => f.id !== filterId));
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [filters, user]
  );

  const handleUpdateFilter = useCallback(
    async (filterToUpdate: Filter) => {
      if (!user || user.email !== "munemojoseph332@gmail.com")
        throw new Error("No permission to update filters");
      try {
        const idToken = await getValidIdToken();
        if (!idToken) throw new Error("Session expired");
        const { id, ...dataToUpdate } =
          filterToUpdate;
        const updatedFilter = await updateFilter(id, dataToUpdate, idToken);
        updateLocalCache(filters.map(f => (f.id === id ? updatedFilter : f)));
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [filters, user]
  );

  const handleSelectFilter = useCallback(
    (filter: Filter) => {
      setViewState({ view: "apply", filter });
      incrementFilterAccessCount(filter.id);
      updateLocalCache(
        filters.map(f =>
          f.id === filter.id
            ? { ...f, accessCount: (f.accessCount || 0) + 1 }
            : f
        )
      );
    },
    [filters]
  );

  const handleSelectOutfit = useCallback(
    (outfit: Outfit) => {
      setViewState({ view: "applyOutfit", outfit });
      incrementOutfitAccessCount(outfit.id);
      // incrementOutfitAccessCount(outfit.id);
      updateLocalOutfitCache(
        outfits.map(o =>
          o.id === outfit.id
            ? { ...o, accessCount: (o.accessCount || 0) + 1 }
            : o
        )
      );
    },
    [outfits]
  );

  const handleSignInSuccess = (signedInUser: User) => {
    setUser(signedInUser);
    setViewState({ view: "marketplace" });
    setIsWelcomeModalOpen(true);
  };

  const handleSignOut = () => {
    signOut();
    setUser(null);
    setViewState({ view: "marketplace" });
  };

  // Render view
  const renderView = () => {
    if (isLoading && viewState.view !== "shared") {
      return (
        <div className="flex flex-col items-center justify-center pt-20">
          <Spinner className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary"/>
          <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">
            Loading Filters...
          </p>
        </div>
      );
    }
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
        return <ApplyFilterView filter={viewState.filter} setViewState={setViewState} user={user} />;
      case "create":
        return (
          <CreateMenu
            setViewState={setViewState}
            user={user}
            addFilter={addFilter}
            onBack={()=> setViewState({view: "create"})}
          />
        );   
      case "edit":
        return <StudioView setViewState={setViewState} user={user} filterToEdit={viewState.filter} onUpdateFilter={handleUpdateFilter} />;
      case "auth":
        return <AuthView setViewState={setViewState} onSignInSuccess={handleSignInSuccess} />;
      case "shared":
        return <SharedImageView shareId={viewState.shareId} setViewState={setViewState} />;
      case "outfits":
        return (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-8">Outfits</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outfits.map(outfit => (
                <div key={outfit.id} className="bg-base-200 dark:bg-dark-base-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectOutfit(outfit)}>
                  <img src={outfit.previewImageUrl} alt={outfit.name} className="w-full h-48 object-cover rounded mb-4" />
                  <h3 className="text-xl font-semibold text-content-100 dark:text-dark-content-100 mb-2">{outfit.name}</h3>
                  <p className="text-content-200 dark:text-dark-content-200">{outfit.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
        case "applyOutfit":
          return (
            <ApplyOutfitView
              outfit={viewState.outfit}   // this comes from handleSelectOutfit
              user={user}
            />
          );
        
    }
  };

  return (
    <div className={`${commonClasses.container.base} min-h-screen flex flex-col ${commonClasses.transitions.default}`}>
      <div className="flex-grow p-4 sm:p-6 md:p-8">
        <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setViewState({ view: "marketplace" })}
          >
            <img src="/lamp.png" alt="Genie Lamp" className="h-8 w-8" />
            <h1 className={`text-2xl sm:text-3xl ${commonClasses.text.heading}`}>
              Genie
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={() => setViewState({ view: "create" })}
                  className={commonClasses.button.primary}
                >
                  Create
                </button>
                <button
                  onClick={handleSignOut}
                  className={commonClasses.button.secondary}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setViewState({ view: "auth" })}
                className={commonClasses.button.primary}
              >
                Sign In
              </button>
            )}
            <button
              className={commonClasses.button.icon}
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </header>
        {/* Add tabs for Filters and Outfits */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewState({ view: "marketplace" })}
              className={`py-3 font-semibold transition-colors ${
                viewState.view === "marketplace"
                  ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                  : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
              }`}
            >
              Filters
            </button>
            <button
              onClick={() => setViewState({ view: "outfits" })}
              className={`py-3 font-semibold transition-colors ${
                viewState.view === "outfits"
                  ? "border-b-2 border-brand-primary text-brand-primary dark:text-dark-brand-primary dark:border-dark-brand-primary"
                  : "text-content-200 dark:text-dark-content-200 hover:text-brand-primary dark:hover:text-dark-brand-primary"
              }`}
            >
              Outfits
            </button>
          </div>
        </div>
        {renderView()}
      </div>
      {isWelcomeModalOpen && (
        <WelcomeModal 
          isOpen={isWelcomeModalOpen} 
          onClose={() => setIsWelcomeModalOpen(false)} 
        />
      )}
      <footer className="text-center py-4  text-sm text-content-300 dark:text-dark-content-300">
        <p>&copy; {new Date().getFullYear()} Genie. All rights reserved.</p>
      </footer>
      <a
        href="https://chat.whatsapp.com/ERJZxNP5UpCF8Fp1JECUK0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white font-bold py-3 px-4 rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        <WhatsAppIcon />
        <span className="hidden sm:block">Join Community for Support</span>
      </a>
    </div>
  );
}
