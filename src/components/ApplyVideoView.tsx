import React, { useEffect, useState } from 'react';
import { User, VideoTemplate, ViewState } from '../types';
import { BackArrowIcon, SparklesIcon } from './icons';
import { Spinner } from './Spinner';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../utils/fileUtils';
import { commonClasses } from '../utils/theme';
import { getApiBaseUrlRuntime } from '../utils/api';
import StatusBanner from './StatusBanner';

interface ApplyVideoViewProps {
    videoTemplate: VideoTemplate;
    setViewState: (viewState: ViewState) => void;
    user: User | null;
}

const ApplyVideoView: React.FC<ApplyVideoViewProps> = ({
    videoTemplate,
    setViewState,
    user,
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [duration, setDuration] = useState<string>('5s');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [motion, setMotion] = useState<number>(5);
    const [feedback, setFeedback] = useState<{
        kind: 'error' | 'success' | 'info';
        message: string;
    } | null>(null);

    useEffect(() => {
        return () => {
            if (generatedVideoUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(generatedVideoUrl);
            }
        };
    }, [generatedVideoUrl]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!isSupportedImageFormat(file)) {
            setFeedback({
                kind: 'error',
                message: 'Unsupported file format. Please upload a supported image file.',
            });
            return;
        }

        try {
            const base64 = await fileToBase64WithHEIFSupport(file);
            setSelectedImage(base64);
            setFeedback({
                kind: 'info',
                message: 'Photo ready. Review your settings and generate the video when you are ready.',
            });
        } catch {
            setFeedback({
                kind: 'error',
                message: 'Failed to read that image file. Please try another one.',
            });
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage || !user) return;

        setIsGenerating(true);
        setStatus('Generating video...');
        setGeneratedVideoUrl(null);
        setFeedback(null);

        const baseUrl = getApiBaseUrlRuntime();

        try {
            const response = await fetch(`${baseUrl}/api/generateVideo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: videoTemplate.prompt,
                    imageBase64: selectedImage,
                    mediaType: 'image/webp',
                    duration,
                    aspectRatio,
                    motion
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate video');
            }

            const data = await response.json();

            if (!data.videoBase64) {
                throw new Error('No video data returned');
            }

            const mimeType = data.mimeType || 'video/mp4';
            const byteCharacters = atob(data.videoBase64);
            const byteNumbers = new Uint8Array(byteCharacters.length);

            for (let index = 0; index < byteCharacters.length; index += 1) {
                byteNumbers[index] = byteCharacters.charCodeAt(index);
            }

            const blob = new Blob([byteNumbers], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            setGeneratedVideoUrl(blobUrl);
            setStatus('Completed!');
            setFeedback({
                kind: 'success',
                message: 'Video ready. Preview it here or download it below.',
            });
        } catch (error) {
            console.error(error);
            setStatus('');
            setFeedback({
                kind: 'error',
                message: (error as Error).message,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <button
                onClick={() => setViewState({ view: 'videos' })}
                className="mb-6 flex items-center gap-2 font-semibold text-content-200 transition-colors hover:text-content-100 dark:text-dark-content-200 dark:hover:text-dark-content-100"
            >
                <BackArrowIcon />
                Back to Videos
            </button>

            {feedback ? (
                <StatusBanner
                    kind={feedback.kind}
                    message={feedback.message}
                    className="mb-6"
                />
            ) : null}

            <div className="flex h-full flex-col gap-6 lg:h-[700px] lg:flex-row">
                <div className="flex w-full flex-col space-y-6 lg:w-[35%]">
                    <div className={commonClasses.container.card}>
                        <h2 className={`mb-2 text-2xl ${commonClasses.text.heading}`}>
                            {videoTemplate.name}
                        </h2>
                        <p className={`${commonClasses.text.body} mb-6`}>
                            {videoTemplate.description}
                        </p>

                        <div className="mb-6">
                            <label className={`mb-2 block text-sm font-medium ${commonClasses.text.heading}`}>
                                Upload Your Photo
                            </label>
                            <div className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-border-color bg-base-200 transition-colors hover:border-brand-primary dark:border-dark-border-color dark:bg-dark-base-200">
                                {selectedImage ? (
                                    <img src={selectedImage} alt="Selected" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-content-300 dark:text-dark-content-300">
                                        <svg className="mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm font-medium">Click to upload</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!selectedImage || isGenerating}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${!selectedImage || isGenerating
                                ? 'cursor-not-allowed bg-neutral-200 text-content-300 dark:bg-dark-neutral-200 dark:text-dark-content-300'
                                : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-brand-soft-strong'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="h-6 w-6 text-white" />
                                    <span>{status}</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-6 w-6" />
                                    Generate Video
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex h-full w-full flex-col lg:w-[45%]">
                    <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-2xl ${generatedVideoUrl ? 'border-none' : 'border border-border-color dark:border-dark-border-color'}`}>
                        {generatedVideoUrl ? (
                            <video src={generatedVideoUrl} controls autoPlay loop className="h-full w-full object-contain" />
                        ) : (
                            <div className="p-8 text-center">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center">
                                        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
                                        <p className="animate-pulse font-medium text-white">{status}</p>
                                        <p className="mt-2 text-sm text-gray-400">This may take a minute...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500">
                                        <svg className="mb-4 h-16 w-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Generated video will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {generatedVideoUrl ? (
                        <div className="mt-4 flex justify-end">
                            <a
                                href={generatedVideoUrl}
                                download={`genie-video-${Date.now()}.mp4`}
                                className={commonClasses.button.secondary}
                            >
                                Download Video
                            </a>
                        </div>
                    ) : null}
                </div>

                <div className="flex w-full flex-col space-y-6 lg:w-[20%]">
                    <div className={`${commonClasses.container.card} flex h-full flex-col`}>
                        <h2 className={`mb-4 flex items-center gap-2 text-lg ${commonClasses.text.heading}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </h2>

                        <div className="flex-1 space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-content-100 dark:text-dark-content-100">Video Duration</label>
                                <select
                                    className="w-full rounded-lg border border-border-color bg-base-100 px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                                    value={duration}
                                    onChange={(event) => setDuration(event.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="5s">5 Seconds</option>
                                    <option value="10s">10 Seconds</option>
                                    <option value="15s">15 Seconds</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-content-100 dark:text-dark-content-100">Aspect Ratio</label>
                                <select
                                    className="w-full rounded-lg border border-border-color bg-base-100 px-3 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                                    value={aspectRatio}
                                    onChange={(event) => setAspectRatio(event.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="16:9">Landscape 16:9</option>
                                    <option value="9:16">Portrait 9:16</option>
                                    <option value="1:1">Square 1:1</option>
                                </select>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100">Motion Scale</label>
                                    <span className="rounded-md bg-base-200 px-2 py-1 text-xs font-semibold dark:bg-dark-base-200">{motion}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-200 accent-brand-primary dark:bg-dark-neutral-200"
                                    value={motion}
                                    onChange={(event) => setMotion(parseInt(event.target.value, 10))}
                                    disabled={isGenerating}
                                />
                                <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-content-300 dark:text-dark-content-300">
                                    <span>Subtle</span>
                                    <span>Dynamic</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyVideoView;

