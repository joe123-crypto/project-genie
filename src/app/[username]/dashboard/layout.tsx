"use client";
import { useAuth } from "@/context/AuthContext";
import { commonClasses } from "@/utils/theme";
import { useState, useEffect } from "react";
import { SearchIcon, SunIcon, MoonIcon } from "@/components/icons";
import Link from "next/link";
import UserIcon from "@/components/UserIcon";
import { useRouter } from "next/navigation";
import { ViewState, User } from "@/types";
import WelcomeModal from "@/components/WelcomeModal";
import { useParams } from "next/navigation";
import { deleteUser } from "@/services/userService";
import ConfirmationDialog from '@/components/ConfirmationDialog';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout, login, isLoading: authLoading } = useAuth();
    const [viewState, setViewState] = useState<ViewState>({ view: "marketplace" });
    const params = useParams();
    const [isDark, setIsDark] = useState(false);
    const router = useRouter();
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

    //load theme from local storage
    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        localStorage.setItem("theme", newIsDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", newIsDark);
    };

    const handleSignOut = async () => {
        await logout();
        router.replace('/login');
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
    // If not loading and the view is initialAuth, or if there's no user, show the auth view.

    return (
        <div
            className={`${commonClasses.container.base} min-h-screen flex flex-col ${commonClasses.transitions.default} relative`}
        >
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
                                <Link
                                    href={`/${params.username}/createmenu`}
                                    className={commonClasses.button.primary}
                                >
                                    Create
                                </Link>
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
            {children}
            {/*renderView()*/}
        </div>
    )
}
