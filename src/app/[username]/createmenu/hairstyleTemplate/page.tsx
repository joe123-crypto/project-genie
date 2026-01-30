'use client';

import React, { useState } from "react";
import { Template, ViewState, User, Hairstyle } from '../../../../types';
import { BackArrowIcon, SparklesIcon, UploadIcon } from '../../../../components/icons';
import { Spinner } from '../../../../components/Spinner';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../../../../utils/fileUtils';
import { saveHairstyle } from '../../../../services/firebaseService';
import { generateText, generateNameFromImage, mergeHairstyle } from '../../../../services/geminiService';
import { commonClasses } from '../../../../utils/theme';

interface CreateHairstyleViewProps {
    setViewState: (viewState: ViewState) => void;
    user: User | null;
    addHairstyle?: (newHairstyle: Hairstyle) => void;
    onBack?: () => void;
    hairstyleToEdit?: Hairstyle;
    onUpdateHairstyle?: (hairstyle: Hairstyle) => Promise<void>;
}

const CreateHairstyleView: React.FC<CreateHairstyleViewProps> = ({
    setViewState,
    user,
    addHairstyle,
    onBack,
    hairstyleToEdit,
    onUpdateHairstyle
}) => {
    const [formData, setFormData] = useState({
        name: hairstyleToEdit?.name || "",
        description: hairstyleToEdit?.description || "",
        gender: (hairstyleToEdit?.gender || "unisex") as "male" | "female" | "unisex",
        previewImageUrl: hairstyleToEdit?.previewImageUrl || "",
    });

    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isGeneratingName, setIsGeneratingName] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isSupportedImageFormat(file)) {
            alert("Unsupported file format. Please upload JPEG, PNG, GIF, WebP, HEIF, or HEIC.");
            return;
        }

        try {
            const base64 = await fileToBase64WithHEIFSupport(file);
            setFormData((prev) => ({ ...prev, previewImageUrl: base64 }));
        } catch {
            alert("Failed to load image.");
        }
    };

    const handleGenerateName = async () => {
        if (!formData.previewImageUrl) {
            alert("Please upload an image first to generate a name.");
            return;
        }

        setIsGeneratingName(true);
        try {
            const name = await generateNameFromImage(formData.previewImageUrl);
            setFormData(prev => ({ ...prev, name: name }));
        } catch (e) {
            console.error("Failed to generate name", e);
            alert("Failed to generate name.");
        } finally {
            setIsGeneratingName(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!formData.name) {
            alert("Please enter a hairstyle name first.");
            return;
        }

        setIsGeneratingDescription(true);
        try {
            const prompt = `Write a short, attractive description (max 2 sentences) for a hairstyle named "${formData.name}" designed for ${formData.gender}.`;
            const description = await generateText(prompt);
            setFormData(prev => ({ ...prev, description: description.trim() }));
        } catch (e) {
            console.error("Failed to generate description", e);
            alert("Failed to generate description.");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return alert("Please provide a name.");
        if (!formData.previewImageUrl) return alert("Please upload a preview image.");

        try {
            const finalImageUrl = formData.previewImageUrl;

            if (formData.previewImageUrl && formData.previewImageUrl.startsWith('data:image')) {
                console.warn("Image saving via API is disabled. Using placeholder or existing URL.");
            }

            const payload: Omit<Hairstyle, "id"> = {
                name: formData.name,
                description: formData.description,
                gender: formData.gender,
                previewImageUrl: finalImageUrl,
                userId: user?.uid,
                username: user?.email?.split("@")[0] || user?.email || "anonymous",
            };

            if (hairstyleToEdit && onUpdateHairstyle) {
                await onUpdateHairstyle({ ...hairstyleToEdit, ...payload });
            } else {
                const saved = await saveHairstyle(payload);
                if (addHairstyle) addHairstyle(saved);
            }

            setViewState({ view: "hairstyles" });
        } catch (e) {
            console.error("Failed to save hairstyle", e);
            alert("Failed to save hairstyle. Please try again.");
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => (onBack ? onBack() : setViewState({ view: "create" }))}
                className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold transition-colors"
            >
                <BackArrowIcon />
                Back to Menu
            </button>

            {/* Split Layout */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${commonClasses.container.card}`}>
                {/* Left: Form */}
                <div className="flex flex-col space-y-6">
                    <h2 className={`text-2xl ${commonClasses.text.heading}`}>
                        Create Hairstyle
                    </h2>

                    {/* Name */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`block text-sm font-medium ${commonClasses.text.heading}`}>
                                Hairstyle Name
                            </label>
                            <button
                                type="button"
                                onClick={handleGenerateName}
                                disabled={isGeneratingName || !formData.previewImageUrl}
                                className="text-xs flex items-center gap-1.5 text-brand-primary dark:text-dark-brand-primary hover:bg-brand-secondary/10 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingName ? (
                                    <>
                                        <Spinner className="w-3 h-3" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-3 h-3" />
                                        <span>Auto-Name</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            placeholder="e.g. Modern Bob"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={`block text-sm font-medium ${commonClasses.text.heading}`}>
                                Description (optional)
                            </label>
                            <button
                                type="button"
                                onClick={handleGenerateDescription}
                                disabled={isGeneratingDescription || !formData.name}
                                className="text-xs flex items-center gap-1.5 text-brand-primary dark:text-dark-brand-primary hover:bg-brand-secondary/10 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGeneratingDescription ? (
                                    <>
                                        <Spinner className="w-3 h-3" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="w-3 h-3" />
                                        <span>Auto-Generate</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                            placeholder="Describe the hairstyle..."
                            rows={3}
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
                            Gender
                        </label>
                        <div className="flex gap-4">
                            {(["male", "female", "unisex"] as const).map((g) => (
                                <label key={g} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={g}
                                        checked={formData.gender === g}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                                        className="text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className="capitalize text-content-100 dark:text-dark-content-100">{g}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            className={commonClasses.button.primary}
                        >
                            Save Hairstyle
                        </button>
                    </div>
                </div>

                {/* Right: Image Upload Area */}
                <div className="flex flex-col items-center justify-center bg-base-100 dark:bg-dark-base-100 rounded-xl border border-border-color dark:border-dark-border-color p-6 relative overflow-hidden">
                    {formData.previewImageUrl ? (
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-inner">
                            <img
                                src={formData.previewImageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <label
                                htmlFor="upload"
                                className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-md cursor-pointer hover:bg-black/70 backdrop-blur-sm transition-colors"
                            >
                                Change
                            </label>
                        </div>
                    ) : (
                        <label
                            htmlFor="upload"
                            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg w-full aspect-square hover:border-brand-primary hover:bg-base-200 dark:hover:bg-dark-base-200 transition-all"
                        >
                            <UploadIcon />
                            <span className="mt-2 text-content-200 dark:text-dark-content-200 text-sm font-medium">
                                Click or drag image to upload
                            </span>
                        </label>
                    )}

                    <input
                        id="upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
};

export default CreateHairstyleView;
