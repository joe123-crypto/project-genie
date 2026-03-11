import React from 'react';
import Link from 'next/link';

const walkthroughSteps = [
    {
        title: 'Create a template',
        description: 'Show how a user picks a style and uploads a base image.',
    },
    {
        title: 'Apply the look',
        description: 'Preview the result, save it, and refine the prompt.',
    },
    {
        title: 'Share the result',
        description: 'End with publishing to the feed or sharing the final image.',
    },
];


interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
    isDark: boolean;
    toggleTheme: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, isDark, toggleTheme }) => {
    return (
        <div className="min-h-screen relative overflow-hidden">
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

                        <p className="text-xl sm:text-2xl text-black/90 mb-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            Transform Your Photos with AI Magic
                        </p>

                        <p className="text-lg text-black/80 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            Create stunning templates, design unique outfits, and share your creations with a vibrant community.
                            Powered by cutting-edge AI technology to bring your creative visions to life.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                            <Link
                                href="/login"
                                //onClick={onGetStarted}
                                className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-purple-50 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
                            >
                                Get Started
                            </Link>
                            <button
                                onClick={onSignIn}
                                className="px-8 py-4 bg-white/10 backdrop-blur-md text-black/30 border-2 border-white/60 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                            >
                                Sign In / Sign Up
                            </button>
                        </div>

                        <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                            <div className="mx-auto max-w-6xl rounded-[2rem] border border-white/40 bg-white/10 p-4 shadow-[0_30px_120px_rgba(190,24,93,0.16)] backdrop-blur-xl">
                                <div className="overflow-hidden rounded-[1.6rem] border border-white/20 bg-slate-950/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                                    <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-left sm:px-6">
                                        <div className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full bg-rose-400" />
                                            <span className="h-3 w-3 rounded-full bg-amber-300" />
                                            <span className="h-3 w-3 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/50">Product Walkthrough</p>
                                            <p className="text-sm font-semibold text-white/80">Placeholder demo frame</p>
                                        </div>
                                        <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                                            01:28
                                        </div>
                                    </div>

                                    <div className="relative aspect-video overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.35),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.94))]">
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

                                        <div className="absolute left-5 top-5 rounded-full border border-fuchsia-300/35 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-100">
                                            Coming Soon
                                        </div>

                                        <div className="absolute inset-x-6 top-16 hidden gap-4 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
                                            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                                <div className="flex items-center justify-between text-xs text-white/60">
                                                    <span>Template Flow</span>
                                                    <span>Scene 01</span>
                                                </div>
                                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                                    <div className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                                                    <div className="h-24 rounded-2xl border border-white/10 bg-white/5" />
                                                    <div className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                                                </div>
                                            </div>
                                            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-sm">
                                                <div className="h-full rounded-[1.1rem] border border-dashed border-fuchsia-200/35 bg-black/10 p-4 text-left">
                                                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Narration cue</p>
                                                    <p className="mt-3 text-lg font-semibold text-white">Walk viewers through the app in under 90 seconds.</p>
                                                    <p className="mt-2 text-sm leading-6 text-white/70">
                                                        Replace this placeholder with a real screen recording, voiceover, or animated promo clip.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                                            <button
                                                type="button"
                                                className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-[0_10px_40px_rgba(236,72,153,0.3)] backdrop-blur-md transition-transform duration-300 hover:scale-105"
                                                aria-label="Video placeholder"
                                            >
                                                <svg className="ml-1 h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                    <path d="M8 5.14v13.72c0 .72.77 1.17 1.39.82l10.24-5.86a.95.95 0 0 0 0-1.64L9.39 4.32A.95.95 0 0 0 8 5.14Z" />
                                                </svg>
                                            </button>

                                            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.38em] text-fuchsia-200/80">
                                                App demo placeholder
                                            </p>
                                            <h3 className="mt-3 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
                                                Replace this frame with a short video that shows the Genie workflow end to end.
                                            </h3>
                                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                                                A clean walkthrough here should cover template selection, image generation, save/share actions, and the final result.
                                            </p>
                                        </div>

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-5 pb-5 pt-24 sm:px-6">
                                            <div className="h-1.5 rounded-full bg-white/10">
                                                <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-300 to-white" />
                                            </div>
                                            <div className="mt-5 grid gap-3 text-left md:grid-cols-3">
                                                {walkthroughSteps.map((step, index) => (
                                                    <div
                                                        key={step.title}
                                                        className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm"
                                                    >
                                                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
                                                            Step 0{index + 1}
                                                        </p>
                                                        <p className="mt-2 text-base font-semibold text-white">{step.title}</p>
                                                        <p className="mt-2 text-sm leading-6 text-white/65">{step.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <h2 className="text-4xl font-bold text-black/90 text-center mb-16">
                        Unleash Your <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Creativity</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-xl font-bold text-black/90 mb-2">Custom Templates</h3>
                            <p className="text-black/80">Design and apply unique AI-powered templates to transform your photos instantly.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">👔</div>
                            <h3 className="text-xl font-bold text-black/90 mb-2">Outfit Design</h3>
                            <p className="text-black/80">Create stunning outfits and visualize how they look with AI assistance.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🌟</div>
                            <h3 className="text-xl font-bold text-black/90 mb-2">Community Sharing</h3>
                            <p className="text-black/80">Share your creations and discover amazing content from other creators.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                            <div className="text-4xl mb-4">🤖</div>
                            <h3 className="text-xl font-bold text-black/90 mb-2">AI-Powered</h3>
                            <p className="text-black/80">Leverage cutting-edge AI technology for breathtaking transformations.</p>
                        </div>
                    </div>
                </section>

                {/* Showcase Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-32">
                    <h2 className="text-4xl font-bold text-black/60 text-center mb-16">
                        See It In <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">Action</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Showcase 1 */}
                        <div className="group relative overflow-hidden rounded-3xl aspect-square">
                            <img
                                src="/showcase-filter-1.png"
                                alt="Template showcase"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <p className="text-white font-bold text-lg">Stunning Templates</p>
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
