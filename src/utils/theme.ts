// Theme color constants
export const themeColors = {
    // Base colors
    base: {
      light: {
        100: 'bg-base-100',
        200: 'bg-base-200',
        300: 'bg-base-300',
      },
      dark: {
        100: 'dark:bg-dark-base-100',
        200: 'dark:bg-dark-base-200',
        300: 'dark:bg-dark-base-300',
      }
    },
  
    // Content/Text colors
    content: {
      light: {
        100: 'text-content-100',
        200: 'text-content-200',
      },
      dark: {
        100: 'dark:text-dark-content-100',
        200: 'dark:text-dark-content-200',
      }
    },
  
    // Brand colors
    brand: {
      light: {
        primary: 'bg-brand-primary',
        secondary: 'bg-brand-secondary',
        hover: 'hover:bg-brand-secondary',
      },
      dark: {
        primary: 'dark:bg-dark-brand-primary',
        secondary: 'dark:bg-dark-brand-secondary',
        hover: 'dark:hover:bg-dark-brand-secondary',
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
      primary: `px-4 py-2 ${themeColors.brand.light.primary} ${themeColors.brand.light.hover} ${themeColors.brand.dark.primary} ${themeColors.brand.dark.hover} ${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-bold rounded-lg transition-colors`,
      
      secondary: `px-4 py-2 ${themeColors.neutral.light[200]} ${themeColors.neutral.light.hover} ${themeColors.neutral.dark[200]} ${themeColors.neutral.dark.hover} ${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-bold rounded-lg transition-colors`,
      
      icon: `p-2 rounded-lg ${themeColors.neutral.light[200]} ${themeColors.neutral.dark[200]} ${themeColors.neutral.light.hover} ${themeColors.neutral.dark.hover} transition-colors`,
    },
  
    // Container variants
    container: {
      base: `${themeColors.base.light[100]} ${themeColors.base.dark[100]} ${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-sans`,
      
      card: `${themeColors.base.light[200]} ${themeColors.base.dark[200]} p-6 rounded-lg shadow-md`,
    },
  
    // Text variants
    text: {
      heading: `${themeColors.content.light[100]} ${themeColors.content.dark[100]} font-bold`,
      body: `${themeColors.content.light[200]} ${themeColors.content.dark[200]}`,
    },
  
    // Transition effects
    transitions: {
      default: 'transition-colors duration-300',
      transform: 'transition-transform duration-300',
    }
  };