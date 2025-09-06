// js/ui/settings.js - Settings Modal & Sleep Timer Management

import { state, setConfirmDialog } from '../core/state.js';

// ---------------------
// SETTINGS STATE
// ---------------------

export const settings = {
  sleepTime: { hour: 21, minute: 30 }, // 9:30 PM
  wakeTime: { hour: 6, minute: 30 },   // 6:30 AM
  resleepDelay: 15 // minutes
};

let settingsModal = null;
let settingsFocus = { type: 'close', index: 0 };
let sleepTimer = null;
let resleepTimer = null;
let checkInterval = null;

// ---------------------
// SETTINGS PERSISTENCE
// ---------------------

function loadSettings() {
  const saved = localStorage.getItem('dashie-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(settings, parsed);
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }
}

function saveSettings() {
  try {
    localStorage.setItem('dashie-settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

// ---------------------
// TIME UTILITIES
// ---------------------

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

// ---------------------
// SLEEP TIMER LOGIC
// ---------------------

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

// ---------------------
// SETTINGS MODAL
// ---------------------

export function showSettings() {
  if (settingsModal) return; // Already showing
  
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
        <div class="settings-section">
          <h3>Sleep Schedule</h3>
          
          <div class="settings-row">
            <div class="settings-label">Sleep Time:</div>
            <div class="settings-control">
              <input type="number" class="time-input" id="sleep-hour" min="1" max="12" value="${settings.sleepTime.hour > 12 ? settings.sleepTime.hour - 12 : settings.sleepTime.hour === 0 ? 12 : settings.sleepTime.hour}">
              <span class="time-separator">:</span>
              <input type="number" class="time-input" id="sleep-minute" min="0" max="59" value="${settings.sleepTime.minute.toString().padStart(2, '0')}">
              <button class="time-period" id="sleep-period">${settings.sleepTime.hour >= 12 ? 'PM' : 'AM'}</button>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">Wake Time:</div>
            <div class="settings-control">
              <input type="number" class="time-input" id="wake-hour" min="1" max="12" value="${settings.wakeTime.hour > 12 ? settings.wakeTime.hour - 12 : settings.wakeTime.hour === 0 ? 12 : settings.wakeTime.hour}">
              <span class="time-separator">:</span>
              <input type="number" class="time-input" id="wake-minute" min="0" max="59" value="${settings.wakeTime.minute.toString().padStart(2, '0')}">
              <button class="time-period" id="wake-period">${settings.wakeTime.hour >= 12 ? 'PM' : 'AM'}</button>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">Re-sleep Delay (minutes):</div>
            <div class="settings-control">
              <input type="number" class="number-input" id="resleep-delay" min="1" max="120" value="${settings.resleepDelay}">
            </div>
          </div>
        </div>
      </div>
      <div class="settings-footer">
        <button class="settings-button" id="settings-cancel">Cancel</button>
        <button class="settings-button primary" id="settings-save">Save</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  settingsModal = modal;
  
  // Set initial focus
  settingsFocus = { type: 'close', index: 0 };
  updateSettingsFocus();
  
  // Add event listeners
  addSettingsEventListeners();
  
  // Click backdrop to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettings();
    }
  });
}

function addSettingsEventListeners() {
  const modal = settingsModal;
  
  // Close button
  modal.querySelector('#settings-close').addEventListener('click', closeSettings);
  modal.querySelector('#settings-cancel').addEventListener('click', closeSettings);
  
  // Save button
  modal.querySelector('#settings-save').addEventListener('click', saveSettingsAndClose);
  
  // AM/PM toggles
  modal.querySelector('#sleep-period').addEventListener('click', () => togglePeriod('sleep-period'));
  modal.querySelector('#wake-period').addEventListener('click', () => togglePeriod('wake-period'));
  
  // Input validation
  const inputs = modal.querySelectorAll('.time-input, .number-input');
  inputs.forEach(input => {
    input.addEventListener('blur', validateInput);
    input.addEventListener('input', validateInput);
  });
}

function togglePeriod(periodId) {
  const button = settingsModal.querySelector(`#${periodId}`);
  button.textContent = button.textContent === 'AM' ? 'PM' : 'AM';
}

function validateInput(e) {
  const input = e.target;
  const value = parseInt(input.value);
  const min = parseInt(input.min);
  const max = parseInt(input.max);
  
  if (isNaN(value) || value < min || value > max) {
    input.style.borderColor = '#ff6b6b';
  } else {
    input.style.borderColor = '';
  }
}

function saveSettingsAndClose() {
  const modal = settingsModal;
  
  // Validate all inputs
  const inputs = modal.querySelectorAll('.time-input, .number-input');
  let isValid = true;
  
  inputs.forEach(input => {
    const value = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    if (isNaN(value) || value < min || value > max) {
      isValid = false;
      input.style.borderColor = '#ff6b6b';
    }
  });
  
  if (!isValid) {
    alert('Please fix the invalid values before saving.');
    return;
  }
  
  // Save sleep time
  let sleepHour = parseInt(modal.querySelector('#sleep-hour').value);
  const sleepPeriod = modal.querySelector('#sleep-period').textContent;
  if (sleepPeriod === 'PM' && sleepHour !== 12) sleepHour += 12;
  if (sleepPeriod === 'AM' && sleepHour === 12) sleepHour = 0;
  
  settings.sleepTime = {
    hour: sleepHour,
    minute: parseInt(modal.querySelector('#sleep-minute').value)
  };
  
  // Save wake time
  let wakeHour = parseInt(modal.querySelector('#wake-hour').value);
  const wakePeriod = modal.querySelector('#wake-period').textContent;
  if (wakePeriod === 'PM' && wakeHour !== 12) wakeHour += 12;
  if (wakePeriod === 'AM' && wakeHour === 12) wakeHour = 0;
  
  settings.wakeTime = {
    hour: wakeHour,
    minute: parseInt(modal.querySelector('#wake-minute').value)
  };
  
  // Save resleep delay
  settings.resleepDelay = parseInt(modal.querySelector('#resleep-delay').value);
  
  saveSettings();
  closeSettings();
}

export function closeSettings() {
  if (settingsModal) {
    settingsModal.remove();
    settingsModal = null;
    settingsFocus = { type: 'close', index: 0 };
  }
}

// ---------------------
// SETTINGS NAVIGATION
// ---------------------

export function updateSettingsFocus() {
  if (!settingsModal) return;
  
  // Clear all highlights
  settingsModal.querySelectorAll('.settings-close, .time-input, .number-input, .time-period, .settings-button')
    .forEach(el => el.classList.remove('selected'));
  
  // Apply current focus
  const focusable = Array.from(settingsModal.querySelectorAll('.settings-close, .time-input, .number-input, .time-period, .settings-button'));
  if (focusable[settingsFocus.index]) {
    focusable[settingsFocus.index].classList.add('selected');
  }
}

export function moveSettingsFocus(direction) {
  if (!settingsModal) return;
  
  const focusable = Array.from(settingsModal.querySelectorAll('.settings-close, .time-input, .number-input, .time-period, .settings-button'));
  
  if (direction === 'up' && settingsFocus.index > 0) {
    settingsFocus.index--;
  } else if (direction === 'down' && settingsFocus.index < focusable.length - 1) {
    settingsFocus.index++;
  } else if (direction === 'left' && settingsFocus.index > 0) {
    settingsFocus.index--;
  } else if (direction === 'right' && settingsFocus.index < focusable.length - 1) {
    settingsFocus.index++;
  }
  
  updateSettingsFocus();
}

export function handleSettingsEnter() {
  if (!settingsModal) return;
  
  const focusable = Array.from(settingsModal.querySelectorAll('.settings-close, .time-input, .number-input, .time-period, .settings-button'));
  const focused = focusable[settingsFocus.index];
  
  if (focused) {
    if (focused.classList.contains('time-period')) {
      focused.click();
    } else if (focused.classList.contains('settings-button') || focused.classList.contains('settings-close')) {
      focused.click();
    } else if (focused.classList.contains('time-input') || focused.classList.contains('number-input')) {
      focused.focus();
      focused.select();
    }
  }
}

// ---------------------
// PUBLIC API
// ---------------------

export function isSettingsOpen() {
  return settingsModal !== null;
}
