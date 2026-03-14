import React, { useState } from 'react';
import { VideoTemplate, ViewState, User } from '../types';
import { BackArrowIcon, SparklesIcon } from './icons';
import { Spinner } from './Spinner';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../utils/fileUtils';
import { commonClasses } from '../utils/theme';
import { getApiBaseUrlRuntime } from '../utils/api';

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

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isSupportedImageFormat(file)) {
            alert('Unsupported file format.');
            return;
        }

        try {
            const base64 = await fileToBase64WithHEIFSupport(file);
            setSelectedImage(base64);
        } catch {
            alert('Failed to read the image file.');
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage || !user) return;

        setIsGenerating(true);
        setStatus('Generating video...');
        setGeneratedVideoUrl(null);

        const baseUrl = getApiBaseUrlRuntime();

        try {
            const res = await fetch(`${baseUrl}/api/generateVideo`, {
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

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to generate video');
            }

            const data = await res.json();

            if (!data.videoBase64) {
                throw new Error('No video data returned');
            }

            // Convert base64 to a blob URL for playback
            const mimeType = data.mimeType || 'video/mp4';
            const byteCharacters = atob(data.videoBase64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteNumbers], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            setGeneratedVideoUrl(blobUrl);
            setStatus('Completed!');
        } catch (e) {
            console.error(e);
            alert(`Error: ${(e as Error).message}`);
            setStatus('');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <button
                onClick={() => setViewState({ view: 'videos' })}
                className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold transition-colors"
            >
                <BackArrowIcon />
                Back to Videos
            </button>

            <div className="flex flex-col lg:flex-row gap-6 h-full lg:h-[700px]">
                <div className="w-full lg:w-[35%] flex flex-col space-y-6">
                    <div className={commonClasses.container.card}>
                        <h2 className={`text-2xl ${commonClasses.text.heading} mb-2`}>
                            {videoTemplate.name}
                        </h2>
                        <p className={`${commonClasses.text.body} mb-6`}>
                            {videoTemplate.description}
                        </p>

                        <div className="mb-6">
                            <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                                Upload Your Photo
                            </label>
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-base-200 dark:bg-dark-base-200 border-2 border-dashed border-border-color dark:border-dark-border-color hover:border-brand-primary transition-colors group cursor-pointer">
                                {selectedImage ? (
                                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-content-300 dark:text-dark-content-300">
                                        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm font-medium">Click to upload</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!selectedImage || isGenerating}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${!selectedImage || isGenerating
                                ? 'bg-neutral-200 dark:bg-dark-neutral-200 text-content-300 dark:text-dark-content-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-brand-primary/25'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner className="w-6 h-6 text-white" />
                                    <span>{status}</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6" />
                                    Generate Video
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-[45%] flex flex-col h-full">
                    <div className={`flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center relative shadow-2xl ${generatedVideoUrl ? 'border-none' : 'border border-border-color dark:border-dark-border-color'}`}>
                        {generatedVideoUrl ? (
                            <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-8">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-white font-medium animate-pulse">{status}</p>
                                        <p className="text-gray-400 text-sm mt-2">This may take a minute...</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p>Generated video will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {generatedVideoUrl && (
                        <div className="mt-4 flex justify-end">
                            <a
                                href={generatedVideoUrl}
                                download={`genie-video-${Date.now()}.mp4`}
                                className={commonClasses.button.secondary}
                            >
                                Download Video
                            </a>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-[20%] flex flex-col space-y-6">
                    <div className={`${commonClasses.container.card} flex flex-col h-full`}>
                        <h2 className={`text-lg ${commonClasses.text.heading} mb-4 flex items-center gap-2`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                        </h2>

                        <div className="space-y-6 flex-1">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-content-100 dark:text-dark-content-100">Video Duration</label>
                                <select
                                    className="w-full bg-base-100 dark:bg-dark-base-100 border border-border-color dark:border-dark-border-color rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-shadow"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="5s">5 Seconds</option>
                                    <option value="10s">10 Seconds</option>
                                    <option value="15s">15 Seconds</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-content-100 dark:text-dark-content-100">Aspect Ratio</label>
                                <select
                                    className="w-full bg-base-100 dark:bg-dark-base-100 border border-border-color dark:border-dark-border-color rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-shadow"
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="16:9">Landscape 16:9</option>
                                    <option value="9:16">Portrait 9:16</option>
                                    <option value="1:1">Square 1:1</option>
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100">Motion Scale</label>
                                    <span className="text-xs font-semibold bg-base-200 dark:bg-dark-base-200 px-2 py-1 rounded-md">{motion}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="10" step="1"
                                    className="w-full h-2 bg-neutral-200 dark:bg-dark-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    value={motion}
                                    onChange={(e) => setMotion(parseInt(e.target.value))}
                                    disabled={isGenerating}
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-content-300 dark:text-dark-content-300 font-medium uppercase tracking-wider">
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
