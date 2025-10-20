import React, { useState } from 'react';
import { Filter, ViewState, User } from '../types';
import { BackArrowIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';
import { improvePrompt, generateImageFromPrompt } from '../services/geminiService';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '../utils/fileUtils';
import { saveFilter } from '../services/firebaseService';
import { getValidIdToken } from '../services/authService';

interface CreateFilterViewProps {
  setViewState: (viewState: ViewState) => void;
  user: User | null;
  addFilter?: (newFilter: Filter) => void;
  filterToEdit?: Filter; // ✅ for editing
  onUpdateFilter?: (filterToUpdate: Filter) => Promise<void> | void; // ✅ for updates
  onBack?: () => void;
}

const CreateFilterView: React.FC<CreateFilterViewProps> = ({
  setViewState,
  user,
  addFilter,
  filterToEdit,
  onUpdateFilter,
  onBack,
}) => {
  const [formData, setFormData] = useState({
    name: filterToEdit?.name || '',
    description: filterToEdit?.description || '',
    prompt: filterToEdit?.prompt || '',
    previewImageUrl: filterToEdit?.previewImageUrl || '',
    category: filterToEdit?.category || '',
  });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
      setFormData(prev => ({ ...prev, previewImageUrl: base64 }));
    } catch {
      alert('Failed to read the image file.');
    }
  };

  // AI improve / generate prompt
  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const improved = await improvePrompt(
        formData.prompt.trim()
          ? formData.prompt
          : 'Create a creative and detailed image generation prompt suitable for a photo filter. Return only the prompt.'
      );
      setFormData(prev => ({ ...prev, prompt: improved }));
    } catch (e) {
      console.error(e);
      alert('Failed to generate or improve prompt.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // AI generate preview image
  const handleGenerateImage = async () => {
    if (!formData.prompt.trim()) {
      alert('Please enter or generate a prompt first.');
      return;
    }
    setIsGeneratingImage(true);
    try {
      const img = await generateImageFromPrompt(formData.prompt, 'filters');
      setFormData(prev => ({ ...prev, previewImageUrl: img }));
    } catch (e) {
      console.error(e);
      alert('Failed to generate image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Save filter to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!formData.name.trim() || !formData.prompt.trim() || !formData.category.trim()) {
      alert('Please provide a name, category, and prompt.');
      return;
    }
  
    try {
      let finalImageUrl = formData.previewImageUrl;

      if (formData.previewImageUrl && formData.previewImageUrl.startsWith('data:image')) {
        const response = await fetch('/api/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: formData.previewImageUrl, 
              destination: 'filters', 
              directoryName: formData.name 
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to save image');
        finalImageUrl = data.url;
      }

      const idToken = await getValidIdToken();
      const payload: Omit<Filter, 'id'> = {
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        previewImageUrl: finalImageUrl,
        category: formData.category,
        type: 'single',
        userId: user?.uid,
        username: user?.email?.split('@')[0] || user?.email || 'anonymous',
        accessCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: user?.uid || '',
        settings: {},
      };
  
      if (filterToEdit && onUpdateFilter) {
        await onUpdateFilter({ ...filterToEdit, ...payload });
      } else {
        const saved = await saveFilter(payload, idToken || '');
        if (addFilter) addFilter(saved);
      }
  
      setViewState({ view: 'marketplace' });
    } catch (e) {
      console.error('Failed to save filter', e);
      alert('Failed to save filter. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => (onBack ? onBack() : setViewState({ view: "create" }))}
        className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold"
      >
        <BackArrowIcon />
        Back to Menu
      </button>

      <div className="bg-base-200 dark:bg-dark-base-200 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-6">
          Create Filter
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Filter Name */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Filter Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100"
              placeholder="Enter filter name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100"
              required
            >
              <option value="" disabled>Select a category</option>
              <option value="Fun">Fun</option>
              <option value="Useful">Useful</option>
              <option value="Futuristic">Futuristic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100"
              placeholder="Describe your filter"
              rows={3}
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Prompt
            </label>
            <div className="flex gap-2">
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                className="flex-1 p-2 rounded-lg border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100"
                placeholder="Enter or generate a prompt"
                rows={3}
              />
              <button
                type="button"
                onClick={handleGeneratePrompt}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                disabled={isGeneratingPrompt}
              >
                {isGeneratingPrompt ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Improve with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Image */}
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Preview Image
            </label>
            <div className="space-y-4">
              {formData.previewImageUrl && (
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-base-300 dark:bg-dark-base-300">
                  <img
                    src={formData.previewImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 rounded-lg hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors text-center">
                    Upload Image
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold rounded-lg transition-colors"
            >
              Save Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFilterView;
