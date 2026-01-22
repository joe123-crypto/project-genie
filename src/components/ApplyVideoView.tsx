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

    const pollStatus = async (taskId: string) => {
        const baseUrl = getApiBaseUrlRuntime();
        const pollInterval = 2000; // 2 seconds

        const check = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/check-video-status?taskId=${taskId}`);
                if (!res.ok) throw new Error('Failed to check status');

                const data = await res.json();
                const generation = data.generations?.[0];

                if (!generation) {
                    setStatus('Checking status...');
                    setTimeout(check, pollInterval);
                    return;
                }

                if (generation.status === 'succeed') {
                    setGeneratedVideoUrl(generation.url);
                    setIsGenerating(false);
                    setStatus('Completed!');
                } else if (generation.status === 'failed') {
                    setIsGenerating(false);
                    setStatus(`Failed: ${generation.failMsg || 'Unknown error'}`);
                    alert(`Video generation failed: ${generation.failMsg}`);
                } else {
                    setStatus(`Processing... (${generation.status})`);
                    setTimeout(check, pollInterval);
                }
            } catch (e) {
                console.error(e);
                setStatus('Error checking status, retrying...');
                setTimeout(check, pollInterval);
            }
        };

        check();
    };

    const handleGenerate = async () => {
        if (!selectedImage || !user) return;

        setIsGenerating(true);
        setStatus('Uploading image...');
        setGeneratedVideoUrl(null);

        const baseUrl = getApiBaseUrlRuntime();

        try {
            // Upload image to R2 instead of Firebase Storage
            const uploadRes = await fetch(`${baseUrl}/api/nanobanana`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textPrompt: 'Keep this image exactly as is.',
                    images: [{ data: selectedImage, mediaType: 'image/webp' }],
                    save: 'video_inputs'
                })
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload image');

            const imageUrl = uploadData.imageUrl || uploadData.transformedImage;
            if (!imageUrl) throw new Error('No URL returned from upload');

            setStatus('Initiating video generation...');

            const res = await fetch(`${baseUrl}/api/generate-video`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: [imageUrl],
                    prompt: videoTemplate.prompt,
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to start generation');
            }

            const data = await res.json();
            const taskId = data.taskId;

            if (!taskId) throw new Error('No taskId returned');

            setStatus('Queued. Waiting for video...');
            pollStatus(taskId);

        } catch (e) {
            console.error(e);
            alert(`Error: ${(e as Error).message}`);
            setIsGenerating(false);
            setStatus('');
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
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

                <div className="flex flex-col h-full">
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
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download Video
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyVideoView;
