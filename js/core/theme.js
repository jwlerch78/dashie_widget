// js/core/theme.js - Theme Management System

// ---------------------
// THEME CONSTANTS
// ---------------------

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const THEME_CONFIG = {
  [THEMES.DARK]: {
    name: 'Dark Theme',
    className: 'theme-dark',
    logoSrc: 'icons/Dashie_Full_Logo_White_Transparent.png'
  },
  [THEMES.LIGHT]: {
    name: 'Light Theme', 
    className: 'theme-light',
    logoSrc: 'icons/Dashie_Full_Logo_Orange_Transparent.png'
  }
};

// ---------------------
// THEME STATE
// ---------------------

let currentTheme = THEMES.DARK; // Default theme

// ---------------------
// THEME PERSISTENCE
// ---------------------

function loadSavedTheme() {
  try {
    const saved = localStorage.getItem('dashie-theme');
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load saved theme:', e);
  }
  return THEMES.DARK; // Default fallback
}

function saveTheme(theme) {
  try {
    localStorage.setItem('dashie-theme', theme);
    console.log(`💾 Theme saved: ${theme}`);
  } catch (e) {
    console.warn('Failed to save theme:', e);
  }
}

// ---------------------
// THEME APPLICATION
// ---------------------

function updateLogo(theme) {
  const logo = document.querySelector('.dashie-logo');
  if (logo) {
    logo.src = THEME_CONFIG[theme].logoSrc;
    console.log(`🖼️ Logo updated for ${theme} theme`);
  }
}

function applyThemeToBody(theme) {
  const body = document.body;
  
  // Remove all existing theme classes
  Object.values(THEMES).forEach(t => {
    body.classList.remove(`theme-${t}`);
  });
  
  // Add the new theme class
  body.classList.add(`theme-${theme}`);
  
  console.log(`🎨 Applied theme class: theme-${theme}`);
}

function preventTransitionsOnLoad() {
  // Prevent transitions during initial load
  document.body.classList.add('no-transitions');
  
  // Re-enable transitions after a brief delay
  setTimeout(() => {
    document.body.classList.remove('no-transitions');
  }, 100);
}

// ---------------------
// PUBLIC API
// ---------------------

export function getCurrentTheme() {
  return currentTheme;
}

export function getAvailableThemes() {
  return Object.keys(THEME_CONFIG).map(key => ({
    id: key,
    name: THEME_CONFIG[key].name
  }));
}

export function switchTheme(newTheme) {
  if (!Object.values(THEMES).includes(newTheme)) {
    console.warn(`Invalid theme: ${newTheme}`);
    return false;
  }
  
  console.log(`🎨 Switching theme from ${currentTheme} to ${newTheme}`);
  
  currentTheme = newTheme;
  
  // Apply theme changes
  applyThemeToBody(newTheme);
  updateLogo(newTheme);
  saveTheme(newTheme);
  
  // Notify widgets about theme change
  notifyWidgetsThemeChange(newTheme);
  
  console.log(`✅ Theme switched to: ${THEME_CONFIG[newTheme].name}`);
  return true;
}

export function initializeThemeSystem() {
  console.log('🎨 Initializing theme system...');
  
  // Prevent transitions during initial setup
  preventTransitionsOnLoad();
  
  // Load saved theme
  currentTheme = loadSavedTheme();
  console.log(`📖 Loaded theme: ${currentTheme}`);
  
  // Apply initial theme
  applyThemeToBody(currentTheme);
  updateLogo(currentTheme);
  
  console.log(`✅ Theme system initialized with ${THEME_CONFIG[currentTheme].name}`);
}

// ---------------------
// WIDGET COMMUNICATION
// ---------------------

function notifyWidgetsThemeChange(theme) {
  // Find all widget iframes and notify them of theme change
  const iframes = document.querySelectorAll('.widget-iframe');
  
  iframes.forEach(iframe => {
    if (iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage({
          type: 'theme-change',
          theme: theme,
          themeConfig: THEME_CONFIG[theme]
        }, '*');
      } catch (error) {
        // Silently handle cross-origin errors
      }
    }
  });
  
  console.log(`📡 Notified ${iframes.length} widgets about theme change`);
}

// ---------------------
// THEME UTILITIES
// ---------------------

export function isDarkTheme() {
  return currentTheme === THEMES.DARK;
}

export function isLightTheme() {
  return currentTheme === THEMES.LIGHT;
}

export function getThemeDisplayName(theme = currentTheme) {
  return THEME_CONFIG[theme]?.name || 'Unknown Theme';
}
