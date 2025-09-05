// ****************
// config.js
//*****************

// Theme + configuration
const theme = {
  sidebarBg: "#222",
  iconColor: "white",
  selectedOutline: "yellow",
  focusedOutline: "cyan"
};

const sidebarOptions = [
  // Main content selection items (larger, always visible)
  { id: "calendar", type: "main", iconSrc: "icons/icon-calendar.svg", label: "Calendar" },
  { id: "map", type: "main", iconSrc: "icons/icon-map.svg", label: "Location Map" },
  { id: "camera", type: "main", iconSrc: "icons/icon-video-camera.svg", label: "Camera Feed" },
  
  // System function items (smaller, in mini-grid)
  { id: "reload", type: "system", iconSrc: "icons/icon-reload.svg", label: "Reload" },
  { id: "sleep", type: "system", iconSrc: "icons/icon-sleep.svg", label: "Sleep" },
  { id: "settings", type: "system", iconSrc: "icons/icon-settings.svg", label: "Settings" },
  { id: "exit", type: "system", iconSrc: "icons/icon-exit.svg", label: "Exit" }
];
