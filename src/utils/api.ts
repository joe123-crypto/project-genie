import { Capacitor } from '@capacitor/core';

export const getApiBaseUrlRuntime = (): string => {
  // Use the official Capacitor API to determine if we are on a native platform
  const isNative = Capacitor.isNativePlatform();

  // If we're on a native platform (Android/iOS), always use the production API URL
  if (isNative) {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    return 'https://project-genie-sigma.vercel.app';
  }

  // For all web environments (dev and production), use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }

  // Fallback for Server-Side Rendering (SSR)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }

  return '';
};
