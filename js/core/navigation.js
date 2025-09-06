// js/core/navigation.js - Navigation Logic & Focus Management

import { state, elements, findWidget, setFocus, setSelectedCell, setCurrentMain } from './state.js';

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

  // focused widget
  if (state.selectedCell) {
    state.selectedCell.classList.add("focused");
  }
}

// ---------------------
// NAVIGATION LOGIC
// ---------------------

// Send D-pad action to focused widget
export function sendToWidget(action) {
  if (!state.selectedCell) return;
  const iframe = state.selectedCell.querySelector("iframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ action }, "*");
  }
}

export function moveFocus(dir) {
  if (state.isAsleep || state.confirmDialog) return; // Don't move focus when asleep or in modal
  
  if (state.selectedCell) {
    // Widget is focused — send input there
    sendToWidget(dir);
    return;
  }

  if (state.focus.type === "grid") {
    let { row, col } = state.focus;

    if (dir === "left") {
      if (col === 1) {
        // Leaving grid → go to sidebar
        const currentMainIndex = sidebarOptions.findIndex(item => item.id === state.currentMain);
        setFocus({ type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 });
        updateFocus();
        return;
      }
      col--;
    }
    if (dir === "right") {
      if (col < 2) col++;
    }
    if (dir === "up") row--;
    if (dir === "down") row++;

    // Clamp to valid cells
    if (row < 1) row = 1;
    if (row > 3) row = 3;
    if (col < 1) col = 1;
    if (col > 2) col = 2;

    // Snap into main widget if moving in its area
    if (col === 1 && (row === 2 || row === 3)) {
      setFocus({ type: "grid", row: 2, col: 1 }); // main widget cell
    } else if (findWidget(row, col)) {
      setFocus({ type: "grid", row, col });
    }
  } else if (state.focus.type === "menu") {
    const totalItems = sidebarOptions.length;

    if (dir === "up" && state.focus.index > 0) {
      setFocus({ ...state.focus, index: state.focus.index - 1 });
    }
    if (dir === "down" && state.focus.index < totalItems - 1) {
      setFocus({ ...state.focus, index: state.focus.index + 1 });
    }
    if (dir === "right") {
      // Leaving sidebar back into grid, start at top-left (map)
      setFocus({ type: "grid", row: 1, col: 1 });
      elements.sidebar.classList.remove("expanded");
    }
  }

  updateFocus();
}

// ---------------------
// ACTION HANDLERS
// ---------------------

export function handleEnter() {
  if (state.isAsleep) {
    // Import and call wakeUp, then start resleep timer
    import('../ui/modals.js').then(({ wakeUp }) => wakeUp());
    import('../ui/settings.js').then(({ startResleepTimer }) => startResleepTimer());
    return;
  }
  
  if (state.confirmDialog) {
    // Import and call handleExitChoice
    import('../ui/modals.js').then(({ handleExitChoice }) => {
      handleExitChoice(state.confirmDialog.selectedButton);
    });
    return;
  }
  
  if (state.focus.type === "grid") {
    const el = document.querySelector(
      `.widget[data-row="${state.focus.row}"][data-col="${state.focus.col}"]`
    );
    if (state.selectedCell === el) {
      setSelectedCell(null);
    } else {
      setSelectedCell(el);
    }
  } else if (state.focus.type === "menu") {
    const menuItems = elements.sidebar.querySelectorAll(".menu-item");
    const menuItem = menuItems[state.focus.index];
    const menuKey = menuItem?.dataset?.menu;

    if (menuKey === "sleep") {
      import('../ui/modals.js').then(({ enterSleepMode }) => enterSleepMode());
    } else if (menuKey === "settings") {
      import('../ui/settings.js').then(({ showSettings }) => showSettings());
    } else if (menuKey === "reload") {
      location.reload();
    } else if (menuKey === "exit") {
      import('../ui/modals.js').then(({ showExitConfirmation }) => showExitConfirmation());
    } else if (menuKey) {
      // Main content items - import grid functions
      setCurrentMain(menuKey);
      import('../ui/grid.js').then(({ renderGrid, renderSidebar }) => {
        renderGrid();
        renderSidebar();
      });
    }
  }
  updateFocus();
}

export function handleBack() {
  if (state.isAsleep) {
    import('../ui/modals.js').then(({ wakeUp }) => wakeUp());
    return;
  }
  
  if (state.confirmDialog) {
    import('../ui/modals.js').then(({ handleExitChoice }) => {
      handleExitChoice("no"); // Default to "no" when pressing back
    });
    return;
  }
  
  if (state.focus.type === "menu") {
    // If in menu, collapse it and return to grid (map in top-left)
    elements.sidebar.classList.remove("expanded");
    setFocus({ type: "grid", row: 1, col: 1 });
  } else {
    // If widget is focused, unfocus it
    setSelectedCell(null);
  }
  updateFocus();
}

export function openMenuWithCurrentSelection() {
  if (state.isAsleep || state.confirmDialog) return;
  
  // Find the index of the currently active main widget
  const currentMainIndex = sidebarOptions.findIndex(item => item.id === state.currentMain);
  setFocus({ type: "menu", index: currentMainIndex >= 0 ? currentMainIndex : 0 });
  elements.sidebar.classList.add("expanded");
  updateFocus();
}
