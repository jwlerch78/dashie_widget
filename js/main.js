// js/main.js - App Initialization & Orchestration

import { initializeEvents } from './core/events.js';
import { updateFocus } from './core/navigation.js';
import { renderGrid, renderSidebar } from './ui/grid.js';

// ---------------------
// APP INITIALIZATION
// ---------------------

function initializeApp() {
  console.log("Initializing Dashie Dashboard...");
  
  // Set up event listeners
  initializeEvents();
  
  // Render initial UI
  renderSidebar();
  renderGrid();
  
  // Set initial focus
  updateFocus();
  
  console.log("Dashie Dashboard initialized successfully!");
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
