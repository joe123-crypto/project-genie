import React, { useState, useEffect } from 'react';


interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
    isDark: boolean;
    toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, isDark, toggleTheme }) => {
    const [apkUrl, setApkUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchLatestRelease = async () => {
            const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;
            if (!repo) return;

            try {
                const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
                if (res.ok) {
                    const data = await res.json();
                    const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));
                    if (apkAsset) {
                        setApkUrl(apkAsset.browser_download_url);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch latest release:", error);
            }
        };

        fetchLatestRelease();
    }, []);
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated gradient background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600 dark:from-purple-900 dark:via-blue-900 dark:to-pink-900 animate-gradient-shift" />
                <div className="absolute inset-0 backdrop-blur-3xl opacity-60" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header with theme toggle */}
                <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex justify-end">
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md hover:bg-white/20 dark:hover:bg-black/30 transition-all duration-300"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-purple-900" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                </header>

                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
                    <div className="text-center">
                        {/* Logo */}
                        <div className="flex justify-center mb-8 animate-fade-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-50 animate-pulse" />
                                <img
                                    src="/lamp.png"
                                    alt="Genaie Logo"
                                    className="h-32 w-32 relative z-10 drop-shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Genaie</span>
                        </h1>

                        <p className="text-xl sm:text-2xl text-white/90 mb-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            Transform Your Photos with AI Magic
                        </p>

                        <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            Create stunning filters, design unique outfits, and share your creations with a vibrant community.
                            Powered by cutting-edge AI technology to bring your creative visions to life.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <button
                                onClick={onGetStarted}
                                className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
                            >
                                Get Started
                            </button>
                            <button
                                onClick={onSignIn}
                                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                            >
                                Sign In / Sign Up
                            </button>
                            {apkUrl && (
                                <a
                                    href={apkUrl}
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-green-500/50 flex items-center gap-2"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download App
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <h2 className="text-4xl font-bold text-white text-center mb-16">
                        Unleash Your <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Creativity</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-bold text-white mb-2">Custom Filters</h3>
                            <p className="text-white/80">Design and apply unique AI-powered filters to transform your photos instantly.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">👔</div>
                            <h3 className="text-xl font-bold text-white mb-2">Outfit Design</h3>
                            <p className="text-white/80">Create stunning outfits and visualize how they look with AI assistance.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🌟</div>
                            <h3 className="text-xl font-bold text-white mb-2">Community Sharing</h3>
                            <p className="text-white/80">Share your creations and discover amazing content from other creators.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🤖</div>
                            <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
                            <p className="text-white/80">Leverage cutting-edge AI technology for breathtaking transformations.</p>
                        </div>
                    </div>
                </section>

                {/* Showcase Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
                    <h2 className="text-4xl font-bold text-white text-center mb-16">
                        See It In <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Action</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Showcase 1 */}
                        <div className="group relative overflow-hidden rounded-3xl aspect-square">
                            <img
                                src="/showcase-filter-1.png"
                                alt="Filter showcase"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <p className="text-white font-bold text-lg">Stunning Filters</p>
                            </div>
                        </div>

                        {/* Showcase 2 */}
                        <div className="group relative overflow-hidden rounded-3xl aspect-square">
                            <img
                                src="/showcase-filter-2.png"
                                alt="Filter showcase"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <p className="text-white font-bold text-lg">Creative Styles</p>
                            </div>
                        </div>

                        {/* Showcase 3 */}
                        <div className="group relative overflow-hidden rounded-3xl aspect-square">
                            <img
                                src="/showcase-outfit-1.png"
                                alt="Outfit showcase"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <p className="text-white font-bold text-lg">Perfect Outfits</p>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center">
                        <p className="text-2xl text-white/90 mb-6">Ready to create magic? ✨</p>
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
                        >
                            Start Creating Now
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="text-center text-white/60 text-sm">
                        <p>© {new Date().getFullYear()} Genaie. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
