// js/core/navigation.js - Navigation Logic & Focus Management with Timeout System

import { state, elements, findWidget, setFocus, setSelectedCell, setCurrentMain } from './state.js';

// ---------------------
// TIMEOUT MANAGEMENT
// ---------------------

let highlightTimer = null;
let isHighlightVisible = true;

const TIMEOUT_SELECTION = 20000; // 20 seconds for selection mode
const TIMEOUT_FOCUS = 60000;     // 60 seconds for focus mode

function startHighlightTimer() {
  clearHighlightTimer();
  
  const timeout = state.selectedCell ? TIMEOUT_FOCUS : TIMEOUT_SELECTION;
  
  highlightTimer = setTimeout(() => {
    hideHighlights();
  }, timeout);
}

function clearHighlightTimer() {
  if (highlightTimer) {
    clearTimeout(highlightTimer);
    highlightTimer = null;
  }
}

function hideHighlights() {
  isHighlightVisible = false;
  document.body.classList.add('highlights-hidden');
  console.log(`Navigation highlights hidden after timeout`);
}

function showHighlights() {
  isHighlightVisible = true;
  document.body.classList.remove('highlights-hidden');
  startHighlightTimer();
  console.log(`Navigation highlights shown, timer started`);
}

function resetHighlightTimer() {
  if (!isHighlightVisible) {
    showHighlights();
  } else {
    startHighlightTimer();
  }
}

// ---------------------
// FOCUS MANAGEMENT
// ---------------------

export function updateFocus() {
  if (state.confirmDialog || state.isAsleep) return; // Don't update focus when modal is open or asleep
  
  // clear all highlights
  document.querySelectorAll(".widget, .menu-item")
    .forEach(el => el.classList.remove("selected", "focused"));

  // grid focus
  if (state.focus.type === "grid") {
    const cell = document.querySelector(
      `.widget[data-row="${state.focus.row}"][data-col="${state.focus.col}"]`
    );
    if (cell) cell.classList.add("selected");
  }

  // sidebar focus
  if (state.focus.type === "menu") {
    const items = elements.sidebar.querySelectorAll(".menu-item");
    if (items[state.focus.index]) items[state.focus.index].classList.add("selected");
    
    // expand sidebar when menu is focused
    elements.sidebar.classList.add("expanded");
  } else {
    elements.sidebar.classList.remove("expanded");
  }

  // focused widget - check if selectedCell exists before trying to use it
  if (state.selectedCell && state.selectedCell.classList) {
    state.selectedCell.classList.add("focused");
  }

  // Reset highlight timer when focus changes
  resetHighlightTimer();
}

// ---------------------
// WIDGET COMMUNICATION
// ---------------------

// Send D-pad action to focused widget
export function sendToWidget(action) {
  if (!state.selectedCell) {
    console.log("No widget selected for command:", action);
    return;
  }
  
  const iframe = state.selectedCell.querySelector("iframe");
  if (iframe && iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage({ action }, "*");
      console.log(`✓ Sent command '${action}' to widget iframe`);
    } catch (error) {
      console.warn("Failed to send message to widget:", error);
    }
  } else {
    console.log(`No iframe found in selected cell for action: ${action}`);
  }
  
  // Reset timer when sending commands to widgets
  resetHighlightTimer();
}

// ---------------------
// NAVIGATION LOGIC
// ---------------------

export function moveFocus(dir) {
  if (state.isAsleep || state.confirmDialog) return; // Don't move focus when asleep or in modal
  
  // Reset timer on any navigation input - this should wake up highlights
  resetHighlightTimer();
  
  if (state.selectedCell) {
    // Widget is focused — send input there
    sendToWidget(dir);
    return;
  }

  if (state.focus.type === "grid") {
    let { row, col } = state.focus;
    let newRow = row;
    let newCol = col;

    if (dir === "left") {
      if (col === 1) {
        // Leaving grid → go to sidebar
        const sidebarOptions = [
          { id: "main", label: "Main" },
          { id: "map", label: "Map" },
          { id: "camera", label: "Camera" },
          { id: "calendar", label: "Calendar" },
          "---",
          { id: "reload", label: "Reload Dashie" },
          { id: "exit", label: "Exit Dashie" }
        ];
        const currentMainIndex = sidebarOptions.findIndex(item => item.id === state.currentMain);
        setFocus({ type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 });
        updateFocus(); // Call updateFocus here to apply the changes
        return;
      }
      newCol = Math.max(1, col - 1);
    }

    if (dir === "right") {
      newCol = Math.min(2, col + 1);
      // Don't return if hitting edge - stay on current position
      if (newCol === col) return;
    }

    if (dir === "up") {
      newRow = Math.max(1, row - 1);
      // Don't return if hitting edge - stay on current position
      if (newRow === row) return;
    }

    if (dir === "down") {
      newRow = Math.min(3, row + 1);
      // Don't return if hitting edge - stay on current position
      if (newRow === row) return;
    }

    // Only update focus if we have a valid position that changed
    if (newRow !== row || newCol !== col) {
      setFocus({ type: "grid", row: newRow, col: newCol });
    }
  }

  if (state.focus.type === "menu") {
    const sidebarOptions = [
      { id: "main", label: "Main" },
      { id: "map", label: "Map" },
      { id: "camera", label: "Camera" },
      { id: "calendar", label: "Calendar" },
      "---",
      { id: "reload", label: "Reload Dashie" },
      { id: "exit", label: "Exit Dashie" }
    ];

    let { index } = state.focus;

    if (dir === "up") {
      do {
        index = (index - 1 + sidebarOptions.length) % sidebarOptions.length;
      } while (sidebarOptions[index] === "---");
    }

    if (dir === "down") {
      do {
        index = (index + 1) % sidebarOptions.length;
      } while (sidebarOptions[index] === "---");
    }

    if (dir === "right") {
      // Leave sidebar → go to grid
      setFocus({ type: "grid", row: 2, col: 1 });
      updateFocus(); // Call updateFocus here to apply the changes
      return;
    }

    setFocus({ type: "menu", index });
  }

  updateFocus();
}

// Handle Enter key for selection
export function handleEnter() {
  // Reset timer on Enter
  resetHighlightTimer();
  
  if (state.isAsleep || state.confirmDialog) return;

  if (state.focus.type === "grid") {
    const widget = findWidget(state.focus.row, state.focus.col);
    if (widget) {
      setSelectedCell(widget);
      updateFocus();
    }
  }

  if (state.focus.type === "menu") {
    const sidebarOptions = [
      { id: "main", label: "Main" },
      { id: "map", label: "Map" },
      { id: "camera", label: "Camera" },
      { id: "calendar", label: "Calendar" },
      "---",
      { id: "reload", label: "Reload Dashie" },
      { id: "exit", label: "Exit Dashie" }
    ];

    const selectedOption = sidebarOptions[state.focus.index];
    if (selectedOption && selectedOption.id) {
      handleMenuSelection(selectedOption.id);
    }
  }
}

// Handle Escape/Back key
export function handleBack() {
  if (state.isAsleep || state.confirmDialog) return;

  if (state.selectedCell) {
    // Exit focus mode and hide highlights
    setSelectedCell(null);
    hideHighlights();
    updateFocus();
  } else if (state.focus.type === "grid" || state.focus.type === "menu") {
    // Just hide highlights if we're in selection mode
    hideHighlights();
  }
}

function handleMenuSelection(optionId) {
  switch(optionId) {
    case "main":
    case "map":
    case "camera":
    case "calendar":
      setCurrentMain(optionId);
      setFocus({ type: "grid", row: 2, col: 1 });
      updateFocus();
      break;
    case "reload":
      window.location.reload();
      break;
    case "exit":
      // Handle exit confirmation - you'll need to implement this
      break;
  }
}

// Open menu with current main widget selected
export function openMenuWithCurrentSelection() {
  if (state.isAsleep || state.confirmDialog || state.selectedCell) return; // Don't open menu if widget is focused
  
  const sidebarOptions = [
    { id: "main", label: "Main" },
    { id: "map", label: "Map" },
    { id: "camera", label: "Camera" },
    { id: "calendar", label: "Calendar" },
    "---",
    { id: "reload", label: "Reload Dashie" },
    { id: "exit", label: "Exit Dashie" }
  ];
  
  // Find the index of the currently active main widget
  const currentMainIndex = sidebarOptions.findIndex(item => item.id === state.currentMain);
  setFocus({ type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 });
  elements.sidebar.classList.add("expanded");
  updateFocus();
}

// Initialize highlight system
export function initializeHighlightTimeout() {
  // Start with highlights hidden (clean dashboard on startup)
  isHighlightVisible = false;
  document.body.classList.add('highlights-hidden');
  
  // DON'T call resetHighlightTimer here - let the first navigation input show highlights
  
  console.log("Navigation highlight timeout system initialized - starting with hidden highlights");
}
