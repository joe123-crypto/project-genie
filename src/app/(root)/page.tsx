'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';

export default function Page() {
    const router = useRouter();
    const [isDark, setIsDark] = useState<boolean>(false);

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
        router.push('/login');
    }, [router]);
    const handleGetStarted = useCallback(() => {
        sessionStorage.setItem("hasSeenLanding", "true");
        router.push('/login');
    }, [router]);

    return (
        <LandingPage
            onGetStarted={handleGetStarted}
            onSignIn={handleLandingSignIn}
            isDark={isDark}
            toggleTheme={toggleTheme}
        />
    );
}
