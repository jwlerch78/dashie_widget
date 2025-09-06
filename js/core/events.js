// js/core/events.js - Global Event Handlers

import { state, elements, setFocus } from './state.js';
import { moveFocus, handleEnter, handleBack, openMenuWithCurrentSelection, updateFocus } from './navigation.js';

// ---------------------
// KEYBOARD EVENTS
// ---------------------

export function initializeKeyboardEvents() {
  document.addEventListener("keydown", e => {
    // Handle sleep mode - any key wakes up
    if (state.isAsleep) {
      e.preventDefault();
      import('../ui/modals.js').then(({ wakeUp }) => wakeUp());
      import('../ui/settings.js').then(({ startResleepTimer }) => startResleepTimer());
      return;
    }
    
    // Handle settings modal
    import('../ui/settings.js').then(({ isSettingsOpen, moveSettingsFocus, handleSettingsEnter, closeSettings }) => {
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
    });
    
    // Handle exit confirmation dialog
    if (state.confirmDialog) {
      e.preventDefault();
      
      // Import modal functions
      import('../ui/modals.js').then(({ moveExitFocus, handleExitChoice }) => {
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
      });
      return;
    }
    
    // Normal navigation
    switch (e.key) {
      case "ArrowLeft": moveFocus("left"); break;
      case "ArrowRight": moveFocus("right"); break;
      case "ArrowUp": moveFocus("up"); break;
      case "ArrowDown": moveFocus("down"); break;
      case "Enter": handleEnter(); break;
      case "Escape": handleBack(); break;
      case "Backspace": handleBack(); break;
      case "m":
      case "M": openMenuWithCurrentSelection(); break;
    }
  });
}"); break;
      case "ArrowUp": moveFocus("up"); break;
      case "ArrowDown": moveFocus("down"); break;
      case "Enter": handleEnter(); break;
      case "Escape": handleBack(); break;
      case "Backspace": handleBack(); break;
      case "m":
      case "M": openMenuWithCurrentSelection(); break;
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
}
