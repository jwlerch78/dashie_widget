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
// KEY MAPPING HELPER
// ---------------------

function getActionFromKey(key) {
  const keyMap = {
    "ArrowLeft": "left",
    "ArrowRight": "right", 
    "ArrowUp": "up",
    "ArrowDown": "down",
    "Enter": "enter",
    "m": "menu",
    "M": "menu",
    " ": "space"
  };
  
  return keyMap[key] || key; // Return mapped action or the key itself
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
    
    // If widget is focused, send ALL commands to widget except Escape
    if (state.selectedCell) {
      switch (e.key) {
        case "Escape":
        case "Backspace":
          e.preventDefault();
          handleBack(); // This will unfocus the widget
          break;
        default:
          // Send all other keys to the widget
          e.preventDefault();
          const action = getActionFromKey(e.key);
          if (action) {
            import('../core/navigation.js').then(({ sendToWidget }) => {
              sendToWidget(action);
            });
          }
          break;
      }
      return;
    }
    
    // Regular navigation when no widget is focused
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
  // Debug click handler to figure out why sidebar won't close
  document.addEventListener("click", e => {
    // Get all the details we need
    const sidebarElement = elements.sidebar;
    const sidebarExpanded = sidebarElement.classList.contains("expanded");
    const clickedOnSidebar = sidebarElement.contains(e.target);
    
    console.log("🖱️ CLICK DEBUG:", {
      // Basic state
      isAsleep: state.isAsleep,
      confirmDialog: !!state.confirmDialog,
      selectedCell: !!state.selectedCell,
      
      // Sidebar state
      sidebarExpanded: sidebarExpanded,
      sidebarElement: sidebarElement,
      sidebarId: sidebarElement.id,
      
      // Click details
      clickTarget: e.target,
      clickTargetTag: e.target.tagName,
      clickTargetId: e.target.id,
      clickTargetClass: e.target.className,
      clickedOnSidebar: clickedOnSidebar,
      
      // Focus state
      currentFocus: state.focus,
      
      // Should close calculation
      shouldClose: sidebarExpanded && !clickedOnSidebar && !state.confirmDialog && !state.isAsleep
    });
    
    // Early returns that prevent closing
    if (state.confirmDialog) {
      console.log("❌ Not closing sidebar: confirm dialog open");
      return;
    }
    
    if (state.isAsleep) {
      console.log("❌ Not closing sidebar: asleep");
      return;
    }
    
    if (!sidebarExpanded) {
      console.log("❌ Not closing sidebar: not expanded");
      return;
    }
    
    if (clickedOnSidebar) {
      console.log("❌ Not closing sidebar: clicked on sidebar");
      return;
    }
    
    // If we get here, we should close the sidebar
    console.log("✅ CLOSING SIDEBAR: all conditions met");
    
    try {
      elements.sidebar.classList.remove("expanded");
      console.log("✅ Sidebar class 'expanded' removed");
      
      // Return focus to grid if we were in menu
      if (state.focus.type === "menu") {
        console.log("✅ Returning focus to grid");
        setFocus({ type: "grid", row: 1, col: 1 });
        updateFocus();
      }
      
      console.log("✅ Sidebar close complete");
    } catch (error) {
      console.error("❌ Error closing sidebar:", error);
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
