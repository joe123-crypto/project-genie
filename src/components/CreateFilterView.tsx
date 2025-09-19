import React, { useState } from 'react';
import { Filter, ViewState, User } from '../types';
import { BackArrowIcon, UploadIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

interface StudioViewProps {
  setViewState: (viewState: ViewState) => void;
  user: User | null;
  addFilter?: (newFilter: Filter) => void;
  filterToEdit?: Filter;
  onUpdateFilter?: (filterToUpdate: Filter) => Promise<void> | void;
}

// Type selection screen component
const FilterTypeSelection: React.FC<{ onSelect: (type: 'instant' | 'studio') => void }> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <button
        onClick={() => onSelect('instant')}
        className="flex flex-col items-center justify-center p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all hover:shadow-lg"
      >
        <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <SparklesIcon className="h-8 w-8 text-brand-primary dark:text-dark-brand-primary" />
        </div>
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-2">Instant Filter</h3>
        <p className="text-content-200 dark:text-dark-content-200 text-center">
          Create a filter quickly with AI assistance for prompts and image generation
        </p>
      </button>

      <button
        onClick={() => onSelect('studio')}
        className="flex flex-col items-center justify-center p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all hover:shadow-lg"
      >
        <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg 
            className="h-8 w-8 text-brand-primary dark:text-dark-brand-primary"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-2">Filter Studio</h3>
        <p className="text-content-200 dark:text-dark-content-200 text-center">
          Advanced tools for creating sophisticated filters with complete control
        </p>
      </button>
    </div>
  );
};

// Instant Filter form component
const InstantFilterForm: React.FC<{
  onBack: () => void;
  onSave: (filter: Omit<Filter, 'id'>) => void;
}> = ({ onBack, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    previewImageUrl: '',
    category: '',
  });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, previewImageUrl: previewUrl }));
    }
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    // Simulate AI prompt generation
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        prompt: "An AI-generated prompt will appear here...",
      }));
      setIsGeneratingPrompt(false);
    }, 1500);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    // Simulate AI image generation
    setTimeout(() => {
      setIsGeneratingImage(false);
      alert('Image generation coming soon!');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold"
      >
        <BackArrowIcon />
        Back
      </button>

      <div className="bg-base-200 dark:bg-dark-base-200 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-6">Create Instant Filter</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-6">
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
          <div>
            <label className="block text-sm font-medium text-content-100 dark:text-dark-content-100 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
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
                  <div className="px-4 py-2 bg-base-300 dark:bg-dark-base-300 text-content-100 dark:text-dark-content-100 rounded-lg hover:bg-base-400 dark:hover:bg-dark-base-400 transition-colors text-center">
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

const CreateFilterView: React.FC<StudioViewProps> = (props) => {
  const [filterType, setFilterType] = useState<'selection' | 'instant' | 'studio'>('selection');

  const handleSave = (filterData: Omit<Filter, 'id'>) => {
    // Here you would normally save to backend
    console.log('Saving filter:', filterData);
    // For now, just go back to marketplace
    props.setViewState({ view: 'marketplace' });
  };

  return (
    <div className="animate-fade-in">
      {filterType === 'selection' && (
        <FilterTypeSelection
          onSelect={(type) => setFilterType(type)}
        />
      )}
      {filterType === 'instant' && (
        <InstantFilterForm
          onBack={() => setFilterType('selection')}
          onSave={handleSave}
        />
      )}
      {filterType === 'studio' && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
            Filter Studio - Coming Soon
          </h2>
          <button
            onClick={() => setFilterType('selection')}
            className="mt-4 px-4 py-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateFilterView;