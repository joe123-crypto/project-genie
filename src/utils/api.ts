export const getApiBaseUrlRuntime = (): string => {
  // Helper to detect if we're in a static export (Android build)
  const isStaticExport = (): boolean => {
    if (typeof window === 'undefined') return false;
    const isCapacitor = !!(window as any).Capacitor || !!(window as any).capacitor;
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.startsWith('192.168.') ||
                        window.location.hostname.startsWith('10.0.');
    return isCapacitor || (!!process.env.NEXT_PUBLIC_API_BASE_URL && !isLocalhost);
  };

  // If we're in Capacitor/static export (Android), use production API URL
  if (typeof window !== 'undefined' && isStaticExport()) {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    return 'https://project-genie-sigma.vercel.app';
  }
  
  // For web (dev and production), always use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // SSR fallback
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  
  return '';
};
