'use client';

import { useState } from 'react';
import { VideoTemplate, ViewState, User } from '../../../../types';
import { BackArrowIcon, SparklesIcon } from '../../../../components/icons';
import { Spinner } from '../../../../components/Spinner';
import { improvePrompt, generateImage } from '../../../../services/geminiService';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../../../../utils/fileUtils';
import { saveVideoTemplate } from '../../../../services/firebaseService';
import { commonClasses } from '../../../../utils/theme';

interface CreateVideoViewProps {
    setViewState: (viewState: ViewState) => void;
    user: User | null;
    onBack?: () => void;
}

const CreateVideoView: React.FC<CreateVideoViewProps> = ({
    setViewState,
    user,
    onBack,
}) => {
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

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isSupportedImageFormat(file)) {
            alert('Unsupported file format. Please upload a JPEG, PNG, GIF, WebP, HEIF, or HEIC image.');
            return;
        }

        try {
            const base64 = await fileToBase64WithHEIFSupport(file);

            // Upload to R2 instead of storing base64
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
            if (!response.ok) throw new Error(data.error || 'Upload failed');

            setFormData(prev => ({ ...prev, previewImageUrl: data.imageUrl || data.transformedImage }));
        } catch (error) {
            console.error(error);
            alert('Failed to upload the image file.');
        }
    };

    // AI improve prompt
    const handleGeneratePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            const improved = await improvePrompt(
                formData.prompt.trim()
                    ? formData.prompt
                    : 'Create a creative and detailed video generation prompt. Return only the prompt.'
            );
            setFormData(prev => ({ ...prev, prompt: improved }));
        } catch (e) {
            console.error(e);
            alert('Failed to improve prompt.');
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    // AI generate cover image
    const handleGenerateCover = async () => {
        if (!formData.prompt.trim()) {
            alert('Please enter a video prompt first to generate a cover image.');
            return;
        }
        setIsGeneratingCover(true);
        try {
            const coverPrompt = `Create a cinematic cover image for a video template with this effect: ${formData.prompt}. Make it stunning and eye-catching.`;
            const img = await generateImage(coverPrompt, 'video_templates');
            setFormData(prev => ({ ...prev, previewImageUrl: img }));
        } catch (e) {
            console.error(e);
            alert('Failed to generate cover image.');
        } finally {
            setIsGeneratingCover(false);
        }
    };

    // Save template to Firestore
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.prompt.trim() || !formData.category.trim() || !formData.previewImageUrl) {
            alert('Please provide a name, category, prompt, and cover image.');
            return;
        }

        setIsSaving(true);
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

            await saveVideoTemplate(payload);
            setViewState({ view: 'videos' });
        } catch (e) {
            console.error('Failed to save video template', e);
            alert('Failed to save video template. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button
                onClick={() => (onBack ? onBack() : setViewState({ view: "create" }))}
                className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold transition-colors"
            >
                <BackArrowIcon />
                Back to Menu
            </button>

            <div className={commonClasses.container.card}>
                <h2 className={`text-2xl ${commonClasses.text.heading} mb-6`}>
                    Create Video Template
                </h2>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            placeholder="Enter template name"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
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

                    {/* Description */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            placeholder="Describe your video template"
                            rows={3}
                        />
                    </div>

                    {/* Prompt */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Video Prompt
                        </label>
                        <div className="flex gap-2">
                            <textarea
                                value={formData.prompt}
                                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                                className="flex-1 p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                                placeholder="Enter the prompt for video generation"
                                rows={3}
                                required
                            />
                            <button
                                type="button"
                                onClick={handleGeneratePrompt}
                                className="px-4 py-2 bg-brand-secondary/10 text-brand-primary dark:text-dark-brand-primary hover:bg-brand-secondary/20 rounded-lg transition-colors flex items-center gap-2 font-semibold whitespace-nowrap"
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

                    {/* Cover Image */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Cover Image
                        </label>
                        <div className="space-y-4">
                            {formData.previewImageUrl && (
                                <div className="w-full aspect-video rounded-lg overflow-hidden bg-base-300 dark:bg-dark-base-300 border border-border-color dark:border-dark-border-color">
                                    <img
                                        src={formData.previewImageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleGenerateCover}
                                    disabled={isGeneratingCover || !formData.prompt.trim()}
                                    className="flex-1 px-4 py-3 bg-brand-primary/10 text-brand-primary dark:text-dark-brand-primary hover:bg-brand-primary/20 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                    <div className="px-4 py-3 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 rounded-lg hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors text-center font-semibold">
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

                    {/* Save */}
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
