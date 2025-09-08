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
// CSS INJECTION FOR WIDGETS
// ---------------------

const WIDGET_THEME_CSS = {
  dark: `
    :root {
      --bg-primary: #222 !important;
      --bg-secondary: #333 !important;
      --bg-tertiary: #444 !important;
      --text-primary: #fff !important;
      --text-secondary: #ccc !important;
      --text-muted: #999 !important;
      --accent-orange: #ffaa00 !important;
      --accent-blue: #00aaff !important;
      --bg-button: #666 !important;
      --bg-active: rgba(255, 255, 255, 0.2) !important;
      --grid-gap-color: #333 !important;
    }
  `,
  light: `
    :root {
      --bg-primary: #e3f2fd !important;
      --bg-secondary: #f5f5f5 !important;
      --bg-tertiary: #eeeeee !important;
      --text-primary: #424242 !important;
      --text-secondary: #616161 !important;
      --text-muted: #9e9e9e !important;
      --accent-orange: #ff9800 !important;
      --accent-blue: #2196f3 !important;
      --bg-button: #90a4ae !important;
      --bg-active: rgba(33, 150, 243, 0.2) !important;
      --grid-gap-color: #e0e0e0 !important;
    }
  `
};

function canAccessIframe(iframe) {
  try {
    // Test if we can access the iframe document
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    return doc !== null && doc !== undefined;
  } catch (error) {
    return false; // Cross-origin or restricted
  }
}

function injectCSSIntoWidget(iframe, theme) {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) {
      console.warn('Cannot access iframe document for CSS injection');
      return false;
    }

    // Remove existing theme styles
    const existingStyle = doc.getElementById('injected-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject new theme style
    const style = doc.createElement('style');
    style.id = 'injected-theme-style';
    style.textContent = WIDGET_THEME_CSS[theme] || WIDGET_THEME_CSS.dark;
    
    // Ensure head exists before appending
    if (!doc.head) {
      console.warn('Widget document has no head element');
      return false;
    }
    
    doc.head.appendChild(style);
    console.log(`✅ CSS injection successful for ${theme} theme`);
    return true;

  } catch (error) {
    console.warn('CSS injection failed:', error.message);
    return false;
  }
}

function sendThemeViaPostMessage(iframe, theme) {
  if (!iframe.contentWindow) return;
  
  try {
    iframe.contentWindow.postMessage({
      type: 'theme-change',
      theme: theme,
      themeCSS: WIDGET_THEME_CSS[theme],
      themeConfig: THEME_CONFIG[theme]
    }, '*');
    console.log(`📤 Sent ${theme} theme via postMessage`);
  } catch (error) {
    console.warn('PostMessage failed:', error.message);
  }
}

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
// WIDGET COMMUNICATION
// ---------------------

function notifyWidgetsThemeChange(theme) {
  const iframes = document.querySelectorAll('.widget-iframe');
  let cssInjectionCount = 0;
  let postMessageCount = 0;
  
  iframes.forEach((iframe, index) => {
    console.log(`🎨 Applying ${theme} theme to widget ${index + 1}/${iframes.length}`);
    
    // Method 1: Try direct CSS injection first (faster, no widget code needed)
    if (canAccessIframe(iframe)) {
      const success = injectCSSIntoWidget(iframe, theme);
      if (success) {
        cssInjectionCount++;
        return; // CSS injection worked, no need for postMessage
      }
    }
    
    // Method 2: Fallback to postMessage (requires widget to listen)
    sendThemeViaPostMessage(iframe, theme);
    postMessageCount++;
  });
  
  console.log(`🎨 Theme applied: ${cssInjectionCount} via CSS injection, ${postMessageCount} via postMessage`);
}

function handleWidgetThemeRequest(widgetName) {
  // When widget requests theme, apply current theme immediately
  const iframes = document.querySelectorAll('.widget-iframe');
  
  iframes.forEach(iframe => {
    // Try CSS injection first
    if (canAccessIframe(iframe)) {
      injectCSSIntoWidget(iframe, currentTheme);
    } else {
      // Fallback to postMessage
      sendThemeViaPostMessage(iframe, currentTheme);
    }
  });
  
  console.log(`📡 Sent current theme (${currentTheme}) to requesting widget: ${widgetName}`);
}

// Listen for widget theme requests (optional fallback)
function initializeWidgetCommunication() {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'widget-request-theme') {
      handleWidgetThemeRequest(event.data.widget || 'unknown');
    }
  });
}

// Apply theme to widgets when they load
function applyThemeToNewWidget(iframe) {
  // Wait a moment for widget to fully load
  setTimeout(() => {
    if (canAccessIframe(iframe)) {
      injectCSSIntoWidget(iframe, currentTheme);
      console.log(`🎨 Applied ${currentTheme} theme to newly loaded widget`);
    } else {
      sendThemeViaPostMessage(iframe, currentTheme);
    }
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
  
  // Initialize widget communication (fallback)
  initializeWidgetCommunication();
  
  // Apply theme to any existing widgets
  setTimeout(() => {
    notifyWidgetsThemeChange(currentTheme);
  }, 500); // Give widgets time to load
  
  console.log(`✅ Theme system initialized with ${THEME_CONFIG[currentTheme].name}`);
}

// Export function to apply theme to newly loaded widgets
export function applyThemeToWidget(iframe) {
  applyThemeToNewWidget(iframe);
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
