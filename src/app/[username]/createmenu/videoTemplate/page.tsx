'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { useTemplates } from '@/context/TemplateContext';
import { VideoTemplate } from '../../../../types';
import { BackArrowIcon, SparklesIcon } from '../../../../components/icons';
import { Spinner } from '../../../../components/Spinner';
import { improvePrompt, generateImage } from '../../../../services/geminiService';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../../../../utils/fileUtils';
import { saveVideoTemplate } from '../../../../services/firebaseService';
import { commonClasses } from '../../../../utils/theme';
import StatusBanner from '../../../../components/StatusBanner';
import { buildDashboardHref } from '@/utils/dashboard';

const CreateVideoView = () => {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const { setVideoTemplates } = useTemplates();
    const username = (Array.isArray(params.username) ? params.username[0] : params.username) || '';

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
        previewImageUrl: '',
        category: '',
    });
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{
        kind: 'error' | 'success' | 'info';
        message: string;
    } | null>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!isSupportedImageFormat(file)) {
            setFeedback({
                kind: 'error',
                message: 'Unsupported file format. Please upload a JPEG, PNG, GIF, WebP, HEIF, or HEIC image.',
            });
            return;
        }

        try {
            const base64 = await fileToBase64WithHEIFSupport(file);
            const response = await fetch('/api/nanobanana', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textPrompt: 'Keep this image exactly as is.',
                    images: [{ data: base64, mediaType: 'image/webp' }],
                    save: 'video_templates'
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setFormData((prev) => ({
                ...prev,
                previewImageUrl: data.imageUrl || data.transformedImage
            }));
            setFeedback({
                kind: 'success',
                message: 'Cover uploaded. You can keep it or generate another one from your prompt.',
            });
        } catch (error) {
            console.error(error);
            setFeedback({
                kind: 'error',
                message: 'Failed to upload the image file.',
            });
        }
    };

    const handleGeneratePrompt = async () => {
        setIsGeneratingPrompt(true);
        setFeedback(null);

        try {
            const improved = await improvePrompt(
                formData.prompt.trim()
                    ? formData.prompt
                    : 'Create a creative and detailed video generation prompt. Return only the prompt.'
            );
            setFormData((prev) => ({ ...prev, prompt: improved }));
            setFeedback({
                kind: 'success',
                message: 'Prompt improved. Review it and tweak anything you want before saving.',
            });
        } catch (error) {
            console.error(error);
            setFeedback({
                kind: 'error',
                message: 'Failed to improve the video prompt.',
            });
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleGenerateCover = async () => {
        if (!formData.prompt.trim()) {
            setFeedback({
                kind: 'info',
                message: 'Enter a video prompt first, then generate the cover image from it.',
            });
            return;
        }

        setIsGeneratingCover(true);
        setFeedback(null);

        try {
            const coverPrompt = `Create a cinematic cover image for a video template with this effect: ${formData.prompt}. Make it stunning and eye-catching.`;
            const image = await generateImage(coverPrompt, 'video_templates');
            setFormData((prev) => ({ ...prev, previewImageUrl: image }));
            setFeedback({
                kind: 'success',
                message: 'Cover image generated. Save the template when everything looks right.',
            });
        } catch (error) {
            console.error(error);
            setFeedback({
                kind: 'error',
                message: 'Failed to generate a cover image.',
            });
        } finally {
            setIsGeneratingCover(false);
        }
    };

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!formData.name.trim() || !formData.prompt.trim() || !formData.category.trim() || !formData.previewImageUrl) {
            setFeedback({
                kind: 'error',
                message: 'Please provide a name, category, prompt, and cover image before saving.',
            });
            return;
        }

        setIsSaving(true);
        setFeedback(null);

        try {
            const payload: Omit<VideoTemplate, 'id'> = {
                name: formData.name,
                description: formData.description,
                prompt: formData.prompt,
                previewImageUrl: formData.previewImageUrl,
                category: formData.category,
                accessCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                creatorId: user?.uid || '',
            };

            const savedTemplate = await saveVideoTemplate(payload);
            setVideoTemplates((prev) => [savedTemplate, ...prev]);
            router.push(buildDashboardHref(username, 'videos'));
        } catch (error) {
            console.error('Failed to save video template', error);
            setFeedback({
                kind: 'error',
                message: 'Failed to save the video template. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button
                onClick={() => router.push(`/${username}/createmenu`)}
                className="mb-6 flex items-center gap-2 font-semibold text-content-200 transition-colors hover:text-content-100 dark:text-dark-content-200 dark:hover:text-dark-content-100"
            >
                <BackArrowIcon />
                Back to Menu
            </button>

            {feedback ? (
                <StatusBanner
                    kind={feedback.kind}
                    message={feedback.message}
                    className="mb-6"
                />
            ) : null}

            <div className={commonClasses.container.card}>
                <h2 className={`text-2xl ${commonClasses.text.heading} mb-6`}>
                    Create Video Template
                </h2>

                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                            className="w-full rounded-lg border border-border-color bg-base-100 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                            placeholder="Enter template name"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                            className="w-full rounded-lg border border-border-color bg-base-100 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            <option value="Cinematic">Cinematic</option>
                            <option value="Animation">Animation</option>
                            <option value="Nature">Nature</option>
                            <option value="Abstract">Abstract</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                            className="w-full rounded-lg border border-border-color bg-base-100 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                            placeholder="Describe your video template"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Video Prompt
                        </label>
                        <div className="flex gap-2">
                            <textarea
                                value={formData.prompt}
                                onChange={(event) => setFormData((prev) => ({ ...prev, prompt: event.target.value }))}
                                className="flex-1 rounded-lg border border-border-color bg-base-100 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                                placeholder="Enter the prompt for video generation"
                                rows={3}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleGeneratePrompt}
                                className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand-secondary/10 px-4 py-2 font-semibold text-brand-primary transition-colors hover:bg-brand-secondary/20 dark:text-dark-brand-primary"
                                disabled={isGeneratingPrompt}
                            >
                                {isGeneratingPrompt ? (
                                    <Spinner className="h-5 w-5" />
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5" />
                                        Improve
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Cover Image
                        </label>
                        <div className="space-y-4">
                            {formData.previewImageUrl ? (
                                <div className="w-full aspect-video overflow-hidden rounded-lg border border-border-color bg-base-300 dark:border-dark-border-color dark:bg-dark-base-300">
                                    <img
                                        src={formData.previewImageUrl}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : null}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateCover}
                                    disabled={isGeneratingCover || !formData.prompt.trim()}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary/10 px-4 py-3 font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-dark-brand-primary"
                                >
                                    {isGeneratingCover ? (
                                        <>
                                            <Spinner className="h-5 w-5" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="h-5 w-5" />
                                            Generate Cover
                                        </>
                                    )}
                                </button>

                                <label className="flex-1 cursor-pointer">
                                    <div className="rounded-lg bg-neutral-200 px-4 py-3 text-center font-semibold text-content-100 transition-colors hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:text-dark-content-100 dark:hover:bg-dark-neutral-300">
                                        Upload Cover
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className={commonClasses.button.primary}
                            disabled={isSaving}
                        >
                            {isSaving ? <Spinner className="h-5 w-5" /> : 'Save Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateVideoView;
