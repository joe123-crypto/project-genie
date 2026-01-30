'use client';

import { useCallback, useEffect, useState } from 'react';
import LandingPage from "../components/LandingPage";
import { User } from "../types";

export default function Page() {
    const [showLandingPage, setShowLandingPage] = useState<boolean>(false);
    const [showAuthview, setShowAuthview] = useState<boolean>(false);
    const [isDark, setIsDark] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const prefersDark = savedTheme === "dark" ||
            (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

        if (prefersDark) {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        } else {
            document.documentElement.classList.remove("dark");
            setIsDark(false);
        }
    }, [])

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        localStorage.setItem("theme", newIsDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", newIsDark)
    }

    const handleLandingSignIn = useCallback(() => {
        sessionStorage.setItem('hasSeenLanding', 'true');
        setShowLandingPage(false);
        setShowAuthview(true);
    }, [])
    const handleGetStarted = useCallback(() => {
        sessionStorage.setItem("hasSeenLanding", "true");
        setShowLandingPage(false);

        if (!user) {
            setShowAuthview(true);
        }
    }, []
    )

    return (
        <LandingPage
            onGetStarted={handleGetStarted}
            onSignIn={handleLandingSignIn}
            isDark={isDark}
            toggleTheme={toggleTheme}
        />
    );
}