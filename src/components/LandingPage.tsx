import React from 'react';
import Link from 'next/link';

const navLinks = [
    { label: 'Home', href: '#top' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Gallery', href: '#gallery' },
];

const workflowCards = [
    {
        step: '01',
        title: 'Create custom templates',
        description: 'Build reusable looks from prompts and reference images so your favorite styles are always one click away.',
    },
    {
        step: '02',
        title: 'Generate photos and videos',
        description: 'Turn a single idea into styled images, short motion pieces, and polished variations for different use cases.',
        featured: true,
    },
    {
        step: '03',
        title: 'Apply, save, and share',
        description: 'Reuse your templates, save the best result, and publish it to your feed or profile.',
    },
];

const galleryCards = [
    { label: 'Fashion portrait', image: '/showcase-filter-1.png' },
    { label: 'Editorial close-up', image: '/showcase-filter-2.png' },
    { label: 'Cinematic character', image: '/showcase-outfit-1.png' },
];

const floatingArt = [
    {
        className: 'left-[-0.5rem] top-12 hidden h-24 w-24 md:block lg:h-32 lg:w-32',
        image: '/showcase-filter-1.png',
    },
    {
        className: 'left-12 top-72 hidden h-16 w-16 sm:block lg:left-20',
        image: '/showcase-outfit-1.png',
    },
    {
        className: 'left-[-1.5rem] top-[26rem] hidden h-20 w-20 lg:block',
        tint: 'from-[#f7b6d2] via-[#ffe7cf] to-[#f0d8ff]',
    },
    {
        className: 'right-0 top-10 hidden h-24 w-24 md:block lg:h-32 lg:w-32',
        image: '/showcase-filter-2.png',
    },
    {
        className: 'right-8 top-60 hidden h-16 w-16 sm:block lg:right-20',
        tint: 'from-[#a9d8ff] via-[#efe3ff] to-[#ffd6d6]',
    },
    {
        className: 'right-[-1rem] top-[25rem] hidden h-20 w-20 lg:block',
        image: '/showcase-outfit-1.png',
    },
];

interface LandingPageProps {
    onGetStarted: () => void;
    onSignIn: () => void;
    isDark: boolean;
    toggleTheme: () => void;
}

const FloatingAvatar = ({
    className,
    image,
    tint,
}: {
    className: string;
    image?: string;
    tint?: string;
}) => {
    if (image) {
        return (
            <div className={`landing-float absolute overflow-hidden rounded-full border border-white/70 bg-white p-1 shadow-[0_22px_50px_rgba(174,104,197,0.22)] ${className}`}>
                <img src={image} alt="" className="h-full w-full rounded-full object-cover" />
            </div>
        );
    }

    return (
        <div
            className={`landing-float absolute rounded-full border border-white/70 bg-gradient-to-br ${tint} shadow-[0_22px_50px_rgba(174,104,197,0.18)] ${className}`}
            aria-hidden="true"
        />
    );
};

const SparkleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
        <path d="M12 2 14.6 9.4 22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" fill="currentColor" />
    </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, isDark, toggleTheme }) => {
    const sectionSurface = isDark
        ? 'border-white/10 bg-white/[0.04] text-white shadow-[0_25px_80px_rgba(0,0,0,0.28)]'
        : 'border-black/5 bg-white/80 text-slate-900 shadow-[0_25px_80px_rgba(240,162,208,0.18)]';
    const mutedText = isDark ? 'text-white/65' : 'text-slate-600';
    const softText = isDark ? 'text-white/45' : 'text-slate-500';
    const navSurface = isDark
        ? 'border-white/10 bg-white/[0.04] text-white'
        : 'border-black/5 bg-white/75 text-slate-900';

    return (
        <div
            className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-[#0f1117] text-white' : 'bg-[#fbf7f3] text-slate-900'}`}
        >
            <div className="landing-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="absolute left-1/2 top-[-12rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(241,157,214,0.55),_rgba(241,157,214,0)_68%)] blur-3xl" />
            <div className="absolute left-[-8rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(253,227,201,0.7),_rgba(253,227,201,0)_70%)] blur-3xl" />
            <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(194,205,255,0.75),_rgba(194,205,255,0)_70%)] blur-3xl" />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <Link href="/" className="group flex cursor-pointer items-center gap-3 rounded-full transition-transform duration-200 hover:scale-[1.01]">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 p-2 shadow-[0_10px_30px_rgba(240,162,208,0.28)] ring-1 ring-black/5 backdrop-blur transition-shadow duration-200 group-hover:shadow-[0_14px_34px_rgba(240,162,208,0.36)]">
                            <img src="/lamp.png" alt="Genaie logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 transition-colors duration-200 group-hover:text-slate-700">Genaie</p>
                        </div>
                    </Link>

                    <div className={`hidden items-center gap-2 rounded-full border px-2 py-2 backdrop-blur md:flex ${navSurface}`}>
                        {navLinks.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-all duration-200 ${isDark ? 'hover:bg-white/10 hover:text-white' : 'hover:bg-black/[0.04] hover:text-slate-950'}`}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border backdrop-blur transition-all duration-200 hover:scale-105 ${isDark ? 'hover:bg-white/10' : 'hover:bg-white/95 hover:shadow-md'} ${navSurface}`}
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <svg className="h-5 w-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1Zm4 8a4 4 0 11-8 0 4 4 0 018 0Zm-.464 4.95.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414Zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0ZM17 11a1 1 0 100-2h-1a1 1 0 100 2h1Zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1ZM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707Zm1.414 8.486-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414ZM4 11a1 1 0 100-2H3a1 1 0 000 2h1Z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8 8 0 1010.586 10.586Z" />
                                </svg>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onSignIn}
                            className={`cursor-pointer rounded-full border px-5 py-3 text-sm font-medium backdrop-blur transition-all duration-200 hover:scale-[1.02] ${isDark ? 'hover:bg-white/10 hover:shadow-[0_12px_30px_rgba(0,0,0,0.22)]' : 'hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]'} ${navSurface}`}
                        >
                            Sign in
                        </button>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col pt-10 sm:pt-14">
                    <section id="top" className="relative text-center">
                        {floatingArt.map((art, index) => (
                            <FloatingAvatar key={`${art.className}-${index}`} className={art.className} image={art.image} tint={art.tint} />
                        ))}

                        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-500 shadow-[0_12px_35px_rgba(239,177,210,0.22)] backdrop-blur">
                            <SparkleIcon />
                            Templates, image generation, video tools, and search
                        </div>

                        <h1 className={`landing-display mx-auto mt-8 max-w-4xl text-5xl leading-tight sm:text-6xl lg:text-7xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            Create templates, generate videos, and transform images with one AI studio
                        </h1>

                        <p className={`mx-auto mt-6 max-w-2xl text-base leading-8 sm:text-lg ${mutedText}`}>
                            Explore template creation, image generation, quick video creation, and sharing in a single polished workflow.
                        </p>

                        <div className={`mx-auto mt-10 flex w-full max-w-3xl flex-col gap-4 rounded-[2rem] border p-3 backdrop-blur-xl sm:flex-row sm:items-center ${sectionSurface}`}>
                            <div className={`flex flex-1 items-center gap-3 rounded-[1.4rem] px-4 py-4 ${isDark ? 'bg-black/20' : 'bg-[#f9f6f2]'}`}>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${isDark ? 'bg-white/10 text-white/70' : 'bg-white text-slate-500 shadow-sm'}`}>
                                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                                        <path d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="min-w-0 text-left">
                                    <p className={`text-[0.7rem] uppercase tracking-[0.28em] ${softText}`}>Concept prompt</p>
                                    <p className={`truncate text-sm sm:text-base ${mutedText}`}>
                                        Create a fashion template, generate a styled portrait, or turn the result into a short video
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onGetStarted}
                                className="cursor-pointer rounded-[1.35rem] bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_rgba(15,23,42,0.26)] transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800 hover:shadow-[0_20px_50px_rgba(15,23,42,0.32)] sm:px-7"
                            >
                                Start creating
                            </button>
                        </div>

                        <div className={`mt-5 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] ${softText}`}>
                            {['Templates', 'Videos', 'Search', 'Sharing'].map((item) => (
                                <span key={item} className={`rounded-full px-3 py-2 ${isDark ? 'bg-white/5' : 'bg-white/70'} shadow-sm`}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section id="how-it-works" className="mt-24 scroll-mt-24">
                        <div className="text-center">
                            <p className={`text-xs uppercase tracking-[0.35em] ${softText}`}>How it works</p>
                            <h2 className={`landing-display mt-4 text-3xl sm:text-4xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
                                Everything needed to go from prompt to polished result
                            </h2>
                            <p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base ${mutedText}`}>
                                build a template, generate assets, then reuse and share them anywhere in the product.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-6 lg:grid-cols-3">
                            {workflowCards.map((card) => (
                                <article
                                    key={card.title}
                                    className={`rounded-[2rem] border p-5 backdrop-blur-xl ${card.featured
                                        ? isDark
                                            ? 'border-fuchsia-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] shadow-[0_25px_80px_rgba(196,80,204,0.2)]'
                                            : 'border-fuchsia-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,239,249,0.85))] shadow-[0_25px_80px_rgba(227,132,205,0.22)]'
                                        : sectionSurface}`}
                                >
                                    <div className={`rounded-[1.6rem] p-5 ${isDark ? 'bg-black/20' : 'bg-white/80'}`}>
                                        <div className={`rounded-[1.3rem] border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-[#fff7fb]'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="h-3 w-3 rounded-full bg-[#f59dbd]" />
                                                <span className="h-3 w-3 rounded-full bg-[#ffd37d]" />
                                                <span className="h-3 w-3 rounded-full bg-[#9de3c7]" />
                                            </div>
                                            <div className="mt-5 space-y-3">
                                                <div className={`h-4 rounded-full ${isDark ? 'bg-white/10' : 'bg-[#eddcf8]'}`} />
                                                <div className={`h-24 rounded-[1rem] ${card.featured ? 'bg-gradient-to-br from-[#ffd7ea] via-[#f4dcff] to-[#d8e7ff]' : isDark ? 'bg-white/10' : 'bg-[#f7f0ff]'}`} />
                                                <div className={`grid grid-cols-3 gap-2 ${softText}`}>
                                                    <div className={`h-10 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-white'}`} />
                                                    <div className={`h-10 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-white'}`} />
                                                    <div className={`h-10 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-white'}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2 pb-2 pt-5">
                                        <p className={`text-xs uppercase tracking-[0.32em] ${softText}`}>Step {card.step}</p>
                                        <h3 className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{card.title}</h3>
                                        <p className={`mt-3 text-sm leading-7 ${mutedText}`}>{card.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section id="gallery" className="mt-24 scroll-mt-24">
                        <p className={`mb-8 text-xs uppercase tracking-[0.35em] ${softText}`}>Gallery preview</p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {galleryCards.map((card) => (
                                <article
                                    key={card.label}
                                    className={`group overflow-hidden rounded-[1.7rem] border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-black/5 bg-white/75'} shadow-[0_18px_60px_rgba(217,154,202,0.14)]`}
                                >
                                    <img
                                        src={card.image}
                                        alt={card.label}
                                        className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="p-4">
                                        <p className={`text-xs uppercase tracking-[0.24em] ${softText}`}>Sample</p>
                                        <p className={`mt-2 text-sm font-medium ${isDark ? 'text-white/85' : 'text-slate-800'}`}>{card.label}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className={`mt-24 rounded-[2.2rem] border px-6 py-10 text-center backdrop-blur-xl sm:px-10 ${sectionSurface}`}>
                        <p className={`text-xs uppercase tracking-[0.35em] ${softText}`}>Momentum</p>
                        <h2 className={`landing-display mt-4 text-3xl sm:text-4xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            Build templates, create videos, and share finished looks from one place
                        </h2>
                        <p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 sm:text-base ${mutedText}`}>
                            Create standout templates, explore fresh looks, and turn your ideas into polished results with an app built to keep inspiration flowing.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <button
                                type="button"
                                onClick={onSignIn}
                                className={`cursor-pointer rounded-full border px-7 py-4 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] ${isDark ? 'hover:bg-white/10 hover:shadow-[0_14px_36px_rgba(0,0,0,0.24)]' : 'hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.08)]'} ${navSurface}`}
                            >
                                Continue to sign in
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default LandingPage;
