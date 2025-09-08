// js/ui/settings.js - Settings Modal & Sleep Timer Management with Theme Support

import { state, setConfirmDialog } from '../core/state.js';
import { getCurrentTheme, getAvailableThemes, switchTheme } from '../core/theme.js';

// ---------------------
// SETTINGS STATE
// ---------------------

export const settings = {
  sleepTime: { hour: 21, minute: 30 }, // 9:30 PM
  wakeTime: { hour: 6, minute: 30 },   // 6:30 AM
  resleepDelay: 15, // minutes
  photoTransitionTime: 15, // seconds
  redirectUrl: 'https://jwlerch78.github.io/dashie/', // default URL
  theme: 'dark' // default theme
};

let settingsModal = null;
let settingsFocus = { type: 'close', index: 0 };
let sleepTimer = null;
let resleepTimer = null;
let checkInterval = null;
let expandedSections = new Set(); // Track which sections are expanded - start all collapsed

// ---------------------
// SETTINGS PERSISTENCE
// ---------------------

function loadSettings() {
  const saved = localStorage.getItem('dashie-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
      // Sync theme setting with current theme
      settings.theme = getCurrentTheme();
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }
}

function saveSettings() {
  try {
    // Sync current theme to settings
    settings.theme = getCurrentTheme();
    localStorage.setItem('dashie-settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

// [Keep all existing time utility functions unchanged]
function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function parseTimeString(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  return { hour, minute };
}

function getCurrentTime() {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

function timeToMinutes(hour, minute) {
  return hour * 60 + minute;
}

function isTimeInSleepPeriod() {
  const current = getCurrentTime();
  const currentMinutes = timeToMinutes(current.hour, current.minute);
  const sleepMinutes = timeToMinutes(settings.sleepTime.hour, settings.sleepTime.minute);
  const wakeMinutes = timeToMinutes(settings.wakeTime.hour, settings.wakeTime.minute);
  
  // Handle overnight sleep period (e.g., 9:30 PM to 6:30 AM)
  if (sleepMinutes > wakeMinutes) {
    return currentMinutes >= sleepMinutes || currentMinutes < wakeMinutes;
  } else {
    return currentMinutes >= sleepMinutes && currentMinutes < wakeMinutes;
  }
}

// [Keep all existing sleep timer functions unchanged]
export function initializeSleepTimer() {
  loadSettings();
  
  // Check every minute if we should auto-sleep/wake
  checkInterval = setInterval(() => {
    if (isTimeInSleepPeriod() && !state.isAsleep) {
      console.log('Auto-sleep activated');
      import('./modals.js').then(({ enterSleepMode }) => enterSleepMode());
    } else if (!isTimeInSleepPeriod() && state.isAsleep) {
      console.log('Auto-wake activated');
      import('./modals.js').then(({ wakeUp }) => wakeUp());
    }
  }, 60000); // Check every minute
}

export function startResleepTimer() {
  if (resleepTimer) {
    clearTimeout(resleepTimer);
  }
  
  console.log(`Will re-sleep in ${settings.resleepDelay} minutes`);
  resleepTimer = setTimeout(() => {
    if (isTimeInSleepPeriod() && !state.isAsleep) {
      console.log('Re-sleep timer activated');
      import('./modals.js').then(({ enterSleepMode }) => enterSleepMode());
    }
  }, settings.resleepDelay * 60000);
}

export function cancelResleepTimer() {
  if (resleepTimer) {
    clearTimeout(resleepTimer);
    resleepTimer = null;
  }
}

// [Keep all existing section management functions unchanged]
function toggleSection(sectionId) {
  if (expandedSections.has(sectionId)) {
    expandedSections.delete(sectionId);
  } else {
    expandedSections.add(sectionId);
  }
  updateSectionVisibility();
}

function updateSectionVisibility() {
  const sections = ['appearance', 'sleep', 'testing', 'photos'];
  
  sections.forEach(sectionId => {
    const content = settingsModal.querySelector(`#${sectionId}-content`);
    const arrow = settingsModal.querySelector(`#${sectionId}-arrow`);
    
    if (expandedSections.has(sectionId)) {
      content.style.display = 'block';
      arrow.textContent = '▼';
    } else {
      content.style.display = 'none';
      arrow.textContent = '▶';
    }
  });
}

// ---------------------
// SETTINGS MODAL - UPDATED WITH THEME SECTION
// ---------------------

export function showSettings() {
  if (settingsModal) return; // Already showing
  
  // Get available themes
  const availableThemes = getAvailableThemes();
  const currentTheme = getCurrentTheme();
  
  // Create theme options HTML
  const themeOptionsHtml = availableThemes.map(theme => 
    `<option value="${theme.id}" ${theme.id === currentTheme ? 'selected' : ''}>${theme.name}</option>`
  ).join('');
  
  // Create settings modal
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.innerHTML = `
    <div class="settings-container">
      <div class="settings-header">
        <h2 class="settings-title">Settings</h2>
        <button class="settings-close" id="settings-close">Close</button>
      </div>
      <div class="settings-content">
        
        <!-- Appearance Section -->
        <div class="settings-section">
          <h3 class="section-header" data-section="appearance">
            <span id="appearance-arrow">▶</span> Appearance
          </h3>
          <div id="appearance-content" class="section-content" style="display: none;">
            <div class="settings-row compact">
              <div class="settings-label">Theme:</div>
              <div class="settings-control">
                <select class="theme-select" id="theme-select">
                  ${themeOptionsHtml}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sleep Section -->
        <div class="settings-section">
          <h3 class="section-header" data-section="sleep">
            <span id="sleep-arrow">▶</span> Sleep
          </h3>
          <div id="sleep-content" class="section-content" style="display: none;">
            <div class="settings-row compact">
              <div class="settings-label">Sleep Time:</div>
              <div class="settings-control">
                <input type="number" class="time-input" id="sleep-hour" min="1" max="12" value="${settings.sleepTime.hour > 12 ? settings.sleepTime.hour - 12 : settings.sleepTime.hour === 0 ? 12 : settings.sleepTime.hour}">
                <span class="time-separator">:</span>
                <input type="number" class="time-input" id="sleep-minute" min="0" max="59" value="${settings.sleepTime.minute.toString().padStart(2, '0')}">
                <button class="time-period" id="sleep-period">${settings.sleepTime.hour >= 12 ? 'PM' : 'AM'}</button>
              </div>
            </div>
            
            <div class="settings-row compact">
              <div class="settings-label">Wake Time:</div>
              <div class="settings-control">
                <input type="number" class="time-input" id="wake-hour" min="1" max="12" value="${settings.wakeTime.hour > 12 ? settings.wakeTime.hour - 12 : settings.wakeTime.hour === 0 ? 12 : settings.wakeTime.hour}">
                <span class="time-separator">:</span>
                <input type="number" class="time-input" id="wake-minute" min="0" max="59" value="${settings.wakeTime.minute.toString().
