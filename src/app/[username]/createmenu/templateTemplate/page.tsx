'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Template } from '@/types';
import { BackArrowIcon, SparklesIcon } from '@/components/icons';
import { Spinner } from '@/components/Spinner';
import { improvePrompt, generateImage } from '@/services/geminiService';
import { fileToBase64WithHEIFSupport, isSupportedImageFormat } from '@/utils/fileUtils';
import { saveTemplate, updateTemplate } from '@/services/firebaseService';
import { commonClasses } from '@/utils/theme';
import { useAuth } from '@/context/AuthContext';
import { useTemplates } from '@/context/TemplateContext';
import StatusBanner from '@/components/StatusBanner';
import { buildDashboardHref } from '@/utils/dashboard';

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { fetchTemplateById, setTemplates } = useTemplates();
  const username = (Array.isArray(params.username) ? params.username[0] : params.username) || '';
  const templateId = searchParams.get('templateId');
  const isEditing = !!templateId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    previewImageUrl: '',
    category: '',
  });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!templateId) {
      return;
    }

    let cancelled = false;

    const loadTemplate = async () => {
      setIsLoadingTemplate(true);
      setFeedback(null);

      try {
        const template = await fetchTemplateById(templateId);

        if (!template) {
          throw new Error('Template not found.');
        }

        if (cancelled) {
          return;
        }

        setFormData({
          name: template.name || '',
          description: template.description || '',
          prompt: template.prompt || '',
          previewImageUrl: template.previewImageUrl || '',
          category: template.category || '',
        });
      } catch (error) {
        console.error('Failed to load template for editing', error);
        if (!cancelled) {
          setFeedback({
            kind: 'error',
            message: 'Failed to load that template for editing.',
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTemplate(false);
        }
      }
    };

    void loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [fetchTemplateById, templateId]);

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
      setFormData((prev) => ({ ...prev, previewImageUrl: base64 }));
      setFeedback({
        kind: 'success',
        message: 'Preview image added. You can keep it or generate a new one from the prompt.',
      });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Failed to read the image file.',
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
          : 'Create a creative and detailed image generation prompt suitable for a photo template. Return only the prompt.'
      );
      setFormData((prev) => ({ ...prev, prompt: improved }));
      setFeedback({
        kind: 'success',
        message: 'Prompt improved. Review it before saving your template.',
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        kind: 'error',
        message: 'Failed to generate or improve the prompt.',
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.prompt.trim()) {
      setFeedback({
        kind: 'info',
        message: 'Enter or generate a prompt first, then create the preview image from it.',
      });
      return;
    }

    setIsGeneratingImage(true);
    setFeedback(null);

    try {
      const image = await generateImage(formData.prompt, 'templates');
      setFormData((prev) => ({ ...prev, previewImageUrl: image }));
      setFeedback({
        kind: 'success',
        message: 'Preview image generated. Save the template when you are ready.',
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        kind: 'error',
        message: 'Failed to generate the preview image.',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.prompt.trim() || !formData.category.trim()) {
      setFeedback({
        kind: 'error',
        message: 'Please provide a name, category, and prompt before saving.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload: Omit<Template, 'id'> = {
        name: formData.name,
        description: formData.description,
        prompt: formData.prompt,
        previewImageUrl: formData.previewImageUrl,
        category: formData.category,
        type: 'single',
        accessCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorId: user?.uid || '',
        settings: {},
      };

      const savedTemplate = templateId
        ? await updateTemplate(templateId, payload)
        : await saveTemplate(payload);

      setTemplates((prev) => {
        if (templateId) {
          return prev.map((template) =>
            template.id === savedTemplate.id ? savedTemplate : template
          );
        }
        return [savedTemplate, ...prev];
      });

      router.push(buildDashboardHref(username));
    } catch (error) {
      console.error('Failed to save template', error);
      setFeedback({
        kind: 'error',
        message: 'Failed to save the template. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner className="h-10 w-10 text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => router.push(`/${username}/createmenu`)}
        className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold transition-colors"
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
          {isEditing ? 'Edit Template' : 'Create Template'}
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
              <option value="Fun">Fun</option>
              <option value="Useful">Useful</option>
              <option value="Futuristic">Futuristic</option>
              <option value="Hair Styles">Hair Styles</option>
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
              placeholder="Describe your template"
              rows={3}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${commonClasses.text.heading} mb-2`}>
              Prompt
            </label>
            <div className="flex gap-2">
              <textarea
                value={formData.prompt}
                onChange={(event) => setFormData((prev) => ({ ...prev, prompt: event.target.value }))}
                className="flex-1 rounded-lg border border-border-color bg-base-100 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-dark-border-color dark:bg-dark-base-100"
                placeholder="Enter or generate a prompt"
                rows={3}
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
              Preview Image
            </label>
            <div className="space-y-4">
              {formData.previewImageUrl ? (
                <div className="w-full aspect-square overflow-hidden rounded-lg border border-border-color bg-base-300 dark:border-dark-border-color dark:bg-dark-base-300">
                  <img
                    src={formData.previewImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="rounded-lg bg-neutral-200 px-4 py-3 text-center font-semibold text-content-100 transition-colors hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:text-dark-content-100 dark:hover:bg-dark-neutral-300">
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
                  className="flex items-center gap-2 rounded-lg bg-brand-secondary/10 px-4 py-3 font-semibold text-brand-primary transition-colors hover:bg-brand-secondary/20 dark:text-dark-brand-primary"
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className={commonClasses.button.primary}
              disabled={isSaving}
            >
              {isSaving ? <Spinner className="h-5 w-5" /> : isEditing ? 'Save Changes' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
