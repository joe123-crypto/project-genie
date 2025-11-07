import React, { useState } from "react";
import { Outfit, ViewState, User } from "../types";
import { BackArrowIcon, UploadIcon } from "./icons";
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from "../utils/fileUtils";
import { saveOutfit } from "../services/firebaseService";
import { getValidIdToken } from "../services/authService";

interface CreateOutfitViewProps {
  setViewState: (viewState: ViewState) => void;
  user: User | null;
  addOutfit?: (newOutfit: Outfit) => void;
  filterToEdit?: Outfit; // renamed from outfitToEdit
  onBack?: () => void;
}


const CreateOutfitView: React.FC<CreateOutfitViewProps> = ({
  setViewState,
  user,
  addOutfit,
  filterToEdit,
  onBack,
}) => {
  const [formData, setFormData] = useState({
    name: filterToEdit?.name || "",
    description: filterToEdit?.description || "",
    additionalStyle: filterToEdit?.prompt || "",
    previewImageUrl: filterToEdit?.previewImageUrl || "",
    type: filterToEdit?.type || "",
  });

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

  const handleSave = async () => {
    if (!formData.name.trim()) return alert("Please provide a brand name.");
    if (!formData.previewImageUrl) return alert("Please upload a preview image.");

    try {
      const idToken = await getValidIdToken();
      if (!idToken) {
        throw new Error("No authorization token provided.");
      }
      let finalImageUrl = formData.previewImageUrl;

      if (formData.previewImageUrl && formData.previewImageUrl.startsWith('data:image')) {
        const response = await fetch('/api/save-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ image: formData.previewImageUrl, destination: 'outfits' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save image');
        finalImageUrl = data.url;
      }

      const payload: Omit<Outfit, "id"> = {
        name: formData.name,
        description: formData.description,
        prompt: formData.additionalStyle,
        previewImageUrl: finalImageUrl,
        userId: user?.uid,
        username: user?.email?.split("@")[0] || user?.email || "anonymous",
        type: formData.type === "" ? undefined : (formData.type as "single" | "merge"),
        category: "",
      };
      const saved = await saveOutfit(payload, idToken || "");
      if (addOutfit) addOutfit(saved);
      setViewState({ view: "outfits" });
    } catch (e) {
      console.error("Failed to save outfit", e);
      alert("Failed to save outfit. Please try again.");
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => (onBack ? onBack() : setViewState({ view: "create" }))}
        className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold"
      >
        <BackArrowIcon />
        Back to Menu
      </button>

      {/* Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-base-200 dark:bg-dark-base-200 p-6 rounded-2xl shadow-md">
        {/* Left: Form */}
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
            Create Outfit
          </h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Brand Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="e.g. Golden Hour Glow"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Describe the mood or vibe of your outfit..."
              rows={3}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">None</option>
              <option value="single">Single</option>
              <option value="merge">Merge</option>
            </select>
          </div>

          {/* Additional Style */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Additional Style
            </label>
            <input
              type="text"
              value={formData.additionalStyle}
              onChange={(e) => setFormData({ ...formData, additionalStyle: e.target.value })}
              className="w-full p-3 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="do not remove the person's shoes"
            />
            <p className="text-xs text-content-300 dark:text-dark-content-300 mt-1">
              Add stylistic or creative constraints. (AI generation disabled.)
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-semibold rounded-lg transition-colors"
            >
              Save Outfit
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
                className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-md cursor-pointer hover:bg-black/70"
              >
                Change
              </label>
            </div>
          ) : (
            <label
              htmlFor="upload"
              className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg w-full aspect-square hover:border-brand-primary transition-colors"
            >
              <UploadIcon />
              <span className="mt-2 text-content-200 dark:text-dark-content-200 text-sm">
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

export default CreateOutfitView;
