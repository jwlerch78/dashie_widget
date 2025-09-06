// js/core/events.js - Global Event Handlers

import { state, elements, setFocus, setWidgetReady } from './state.js';
import { moveFocus, handleEnter, handleBack, openMenuWithCurrentSelection, updateFocus } from './navigation.js';

// ---------------------
// WIDGET MESSAGE HANDLING
// ---------------------

function initializeWidgetMessages() {
  // Listen for messages from widgets
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'widget-ready') {
      const widgetId = event.data.widget;
      setWidgetReady(widgetId, true);
      console.log(`🚀 Widget ready: ${widgetId}`);
    }
  });
}

// ---------------------
// KEYBOARD EVENTS
// ---------------------

export function initializeKeyboardEvents() {
  document.addEventListener("keydown", async e => {
    // Handle sleep mode - any key wakes up
    if (state.isAsleep) {
      e.preventDefault();
      const { wakeUp } = await import('../ui/modals.js');
      const { startResleepTimer } = await import('../ui/settings.js');
      wakeUp();
      startResleepTimer();
      return;
    }
    
    // Handle settings modal
    try {
      const { isSettingsOpen, moveSettingsFocus, handleSettingsEnter, closeSettings } = await import('../ui/settings.js');
      if (isSettingsOpen()) {
        e.preventDefault();
        switch (e.key) {
          case "ArrowLeft":
          case "ArrowRight":
          case "ArrowUp":
          case "ArrowDown":
            moveSettingsFocus(e.key.replace('Arrow', '').toLowerCase());
            break;
          case "Enter":
            handleSettingsEnter();
            break;
          case "Escape":
          case "Backspace":
            closeSettings();
            break;
        }
        return;
      }
    } catch (err) {
      // Settings module not loaded yet, continue
    }
    
    // Handle exit confirmation dialog
    if (state.confirmDialog) {
      e.preventDefault();
      
      // Import modal functions
      const { moveExitFocus, handleExitChoice } = await import('../ui/modals.js');
      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight":
          moveExitFocus(e.key === "ArrowLeft" ? "left" : "right");
          break;
        case "Enter":
          handleExitChoice(state.confirmDialog.selectedButton);
          break;
        case "Escape":
        case "Backspace":
          handleExitChoice("no");
          break;
      }
      return;
    }
    
    // Normal navigation
    switch (e.key) {
      case "ArrowLeft": 
        e.preventDefault();
        moveFocus("left"); 
        break;
      case "ArrowRight": 
        e.preventDefault();
        moveFocus("right"); 
        break;
      case "ArrowUp": 
        e.preventDefault();
        moveFocus("up"); 
        break;
      case "ArrowDown": 
        e.preventDefault();
        moveFocus("down"); 
        break;
      case "Enter": 
        e.preventDefault();
        handleEnter(); 
        break;
      case "Escape": 
        e.preventDefault();
        handleBack(); 
        break;
      case "Backspace": 
        e.preventDefault();
        handleBack(); 
        break;
      case "m":
      case "M": 
        e.preventDefault();
        openMenuWithCurrentSelection(); 
        break;
    }
  });
}

// ---------------------
// MOUSE EVENTS
// ---------------------

export function initializeMouseEvents() {
  // Click outside menu to close it
  document.addEventListener("click", e => {
    if (state.confirmDialog || state.isAsleep) return;
    
    // Don't close sidebar if widget is focused - let user interact with menu
    if (state.selectedCell) return;
    
    if (!elements.sidebar.contains(e.target) && elements.sidebar.classList.contains("expanded")) {
      elements.sidebar.classList.remove("expanded");
      if (state.focus.type === "menu") {
        setFocus({ type: "grid", row: 1, col: 1 });
        updateFocus();
      }
    }
  });
}

// ---------------------
// INITIALIZATION
// ---------------------

export function initializeEvents() {
  initializeKeyboardEvents();
  initializeMouseEvents();
  initializeWidgetMessages();
  
  console.log("📡 Event handlers initialized with widget communication support");
}
