'use client'

import { InitialAuthView } from "@/components/InitialAuthView";
import { useRouter } from "next/navigation";
import { User } from "@/types"
import { useState, useCallback, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';

export default function Page() {
    const router = useRouter();
    const { login } = useAuth();

    const handleSignInSuccess = useCallback((signedInUser: User) => {
        login(signedInUser);
        router.replace(`/${signedInUser.displayName ||
            signedInUser.username}/dashboard`);
    }, [login, router]);

    return (
        <div className="flex justify-center items-center h-screen ">
            <InitialAuthView onSignInSuccess={handleSignInSuccess} />
        </div>
    );
}