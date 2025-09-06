// js/core/state.js - Global State Management

// ---------------------
// APP STATE
// ---------------------

// DOM element references
export const elements = {
  grid: document.getElementById("grid"),
  sidebar: document.getElementById("sidebar")
};

// Widget layout configuration
export const widgets = [
  { id: "map", row: 1, col: 1, rowSpan: 1, colSpan: 1, label: "🗺️ Locations" },
  { id: "clock", row: 1, col: 2, rowSpan: 1, colSpan: 1, label: "⏰ Clock" },
  { id: "main", row: 2, col: 1, rowSpan: 2, colSpan: 1, label: "📅 Calendar" }, 
  { id: "agenda", row: 2, col: 2, rowSpan: 1, colSpan: 1, label: "📝 Agenda" },
  { id: "photos", row: 3, col: 2, rowSpan: 1, colSpan: 1, label: "🖼️ Photos" }
];

// Map sidebar keys to main widget content
export const sidebarMapping = {
  calendar: "📅 Calendar",
  map: "🗺️ Map",
  camera: "📷 Camera"
};

// Mutable application state
export const state = {
  currentMain: "calendar", // default main widget
  focus: { type: "grid", row: 1, col: 1 }, // current focus for D-pad navigation
  selectedCell: null, // focused widget
  isAsleep: false, // sleep mode state
  confirmDialog: null // exit confirmation dialog state
};

// ---------------------
// STATE HELPERS
// ---------------------

export function setFocus(newFocus) {
  state.focus = newFocus;
}

export function setSelectedCell(cell) {
  state.selectedCell = cell;
}

export function setCurrentMain(mainType) {
  state.currentMain = mainType;
}

export function setSleepMode(sleeping) {
  state.isAsleep = sleeping;
}

export function setConfirmDialog(dialog) {
  state.confirmDialog = dialog;
}

export function findWidget(row, col) {
  return widgets.find(w => w.row === row && w.col === col);
}
