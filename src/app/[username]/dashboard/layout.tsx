"use client";
import { useAuth } from "@/context/AuthContext";
import { commonClasses } from "@/utils/theme";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";
import Link from "next/link";
import UserIcon from "@/components/UserIcon";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { deleteUser } from "@/services/userService";
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { buildDashboardHref } from "@/utils/dashboard";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const params = useParams();
    const [isDark, setIsDark] = useState(false);
    const router = useRouter();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const usernameParam = (Array.isArray(params.username)
        ? params.username[0]
        : params.username) || '';

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
            <div className="relative z-10 px-4 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
                {user && (
                    <header className="mx-auto mb-6 flex max-w-7xl items-center justify-between gap-3 sm:mb-8">
                        <div
                            className="group flex cursor-pointer items-center gap-3 rounded-full"
                            onClick={() => router.push(buildDashboardHref(usernameParam))}
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 p-2 shadow-[0_14px_34px_rgba(239,177,210,0.24)] ring-1 ring-black/5 backdrop-blur transition-shadow duration-200 group-hover:shadow-[0_18px_40px_rgba(239,177,210,0.3)] dark:bg-white/10 dark:ring-white/10">
                                <img src="/lamp.png" alt="Genie Lamp" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-content-300 dark:text-dark-content-300">
                                    Creative Workspace
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight text-content-100 dark:text-dark-content-100 sm:text-3xl">
                                    GenAIe
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/${params.username}/createmenu`}
                                className={`${commonClasses.button.primary} px-5`}
                            >
                                Create
                            </Link>
                            <UserIcon
                                user={user}
                                onSignOut={handleSignOut}
                                onGoToProfile={() => router.push(buildDashboardHref(usernameParam, "profile"))}
                                onRemoveAccount={handleRemoveAccount}
                            />
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

            {showConfirmDialog && (
                <ConfirmationDialog
                    message="Are you sure you want to remove your account? This action is irreversible."
                    onConfirm={confirmRemoveAccount}
                    onCancel={() => setShowConfirmDialog(false)}
                />
            )}
            <main className="relative z-10 flex-1 pb-56 sm:pb-24">
                {children}
            </main>
            {/*renderView()*/}
        </div>
    )
}
