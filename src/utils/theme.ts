// Theme color constants
export const themeColors = {
    // Base colors
    base: {
      light: {
        100: 'bg-base-100',
        200: 'bg-base-200',
        300: 'bg-base-300',
        400: 'bg-base-400',
      },
      dark: {
        100: 'dark:bg-dark-base-100',
        200: 'dark:bg-dark-base-200',
        300: 'dark:bg-dark-base-300',
        400: 'dark:bg-dark-base-400',
      }
    },
  
    // Content/Text colors
    content: {
      light: {
        100: 'text-content-100',
        200: 'text-content-200',
        300: 'text-content-300',
      },
      dark: {
        100: 'dark:text-dark-content-100',
        200: 'dark:text-dark-content-200',
        300: 'dark:text-dark-content-300',
      }
    },
  
    // Brand colors
    brand: {
      light: {
        primary: 'bg-brand-primary',
        secondary: 'bg-brand-secondary',
        hover: 'hover:bg-brand-secondary',
        soft: 'bg-brand-soft',
      },
      dark: {
        primary: 'dark:bg-dark-brand-primary',
        secondary: 'dark:bg-dark-brand-secondary',
        hover: 'dark:hover:bg-dark-brand-secondary',
        soft: 'dark:bg-dark-brand-soft',
      }
    },

    // Success colors
    success: {
      light: {
        100: 'bg-green-200',
        200: 'hover:bg-green-300',
        text: 'text-green-900',
      },
      dark: {
        100: 'dark:bg-green-800',
        200: 'dark:hover:bg-green-700',
        text: 'dark:text-green-100',
      }
    },
  
    // Neutral colors
    neutral: {
      light: {
        200: 'bg-neutral-200',
        300: 'bg-neutral-300',
        hover: 'hover:bg-neutral-300',
      },
      dark: {
        200: 'dark:bg-dark-neutral-200',
        300: 'dark:bg-dark-neutral-300',
        hover: 'dark:hover:bg-dark-neutral-300',
      }
    },
  
    // Border colors
    border: {
      light: 'border-border-color',
      dark: 'dark:border-dark-border-color',
    }
  };
  
  // Common component classes
export const commonClasses = {
    // Button variants
    button: {
      primary: 'studio-primary-button',
      
      secondary: 'studio-secondary-button',

      success: 'studio-success-button',
      
      icon: 'studio-icon-button',
    },
  
    // Container variants
    container: {
      base: `${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-sans`,
      
      card: 'studio-panel rounded-[2rem] p-6 sm:p-8',
    },
  
    // Text variants
    text: {
      heading: `${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-semibold tracking-tight`,
      body: `${themeColors.content.light[200]} ${themeColors.content.dark[200]} font-sans`,
    },
  
    // Transition effects
    transitions: {
      default: 'transition-all duration-300 ease-out',
      transform: 'transition-transform duration-300 ease-out',
    }
  };

export const studioClasses = {
  surface: 'studio-panel',
  surfaceSoft: 'studio-panel-soft',
  input: 'studio-input',
  tab: 'studio-tab',
  tabActive: 'studio-tab studio-tab-active',
  tabInactive: 'studio-tab studio-tab-inactive',
  badge: 'studio-badge',
  emptyState: 'studio-empty-state rounded-[2rem]',
  softButton: 'studio-soft-button',
  dangerButton: 'studio-danger-button',
  cardHover: 'studio-card-hover',
};

