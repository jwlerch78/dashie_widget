// js/auth/simple-auth.js - Phase 1: Basic Google SSO Only

class SimpleAuth {
  constructor() {
    this.gapi = null;
    this.isSignedIn = false;
    this.currentUser = null;
    
    // Your actual Client ID - no more copy/pasting needed!
    this.config = {
      client_id: '221142210647-58t8hr48rk7nlgl56j969himso1qjjoo.apps.googleusercontent.com',
      scope: 'profile email'  // Just basic profile info for now
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('🔐 Initializing Google Auth...');
      await this.loadGoogleAPI();
      await this.initializeGIS();
    } catch (error) {
      console.error('🔐 Auth initialization failed:', error);
      this.showError('Authentication setup failed');
    }
  }

  async loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async initializeGIS() {
    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: this.config.client_id,
      callback: (response) => this.handleCredentialResponse(response)
    });

    // Set up OAuth for additional permissions
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.config.client_id,
      scope: this.config.scope,
      callback: (response) => this.handleTokenResponse(response)
    });

    console.log('🔐 Google Identity Services initialized');
    this.checkExistingAuth();
  }

  checkExistingAuth() {
    // Check if user is already signed in
    const savedUser = this.getSavedUser();
    if (savedUser) {
      this.currentUser = savedUser;
      this.isSignedIn = true;
      this.showSignedInState();
    } else {
      this.showSignInPrompt();
    }
  }

  handleCredentialResponse(response) {
    // Decode the JWT token to get user info
    const userInfo = this.parseJWT(response.credential);
    
    this.currentUser = {
      id: userInfo.sub,
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      signedInAt: Date.now()
    };
    
    this.isSignedIn = true;
    this.saveUser(this.currentUser);
    this.showSignedInState();
    
    console.log('🔐 User signed in:', this.currentUser.name);
  }

  handleTokenResponse(response) {
    if (response.access_token) {
      // Store access token for future API calls
      this.currentUser.accessToken = response.access_token;
      this.saveUser(this.currentUser);
      console.log('🔐 Access token received');
    }
  }

  parseJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  signIn() {
    console.log('🔐 Starting sign-in process...');
    
    // Show One Tap if available, otherwise show button
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to OAuth popup
        this.tokenClient.requestAccessToken();
      }
    });
  }

  signOut() {
    if (this.currentUser && this.currentUser.accessToken) {
      google.accounts.oauth2.revoke(this.currentUser.accessToken);
    }
    
    this.currentUser = null;
    this.isSignedIn = false;
    this.clearSavedUser();
    
    // Show sign-in prompt
    this.showSignInPrompt();
    
    console.log('🔐 User signed out');
  }

  exitApp() {
    // Exit the application completely
    console.log('🚪 Exiting Dashie...');
    if (window.close) {
      window.close();
    } else {
      // Fallback - redirect to a blank page or show exit message
      window.location.href = 'about:blank';
    }
  }

  showExitSignOutModal() {
    // Create modal with logout and exit options
    const modal = document.createElement('div');
    modal.className = 'exit-modal-backdrop';
    modal.innerHTML = `
      <div class="exit-modal">
        <div class="exit-option" onclick="dashieAuth.signOut()">
          <img src="${this.currentUser.picture}" alt="${this.currentUser.name}" class="user-photo-modal">
          <span>Logout ${this.currentUser.name}</span>
        </div>
        
        <div class="exit-option" onclick="dashieAuth.exitApp()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span>Exit Dashie</span>
        </div>
        
        <div class="exit-option cancel" onclick="document.querySelector('.exit-modal-backdrop').remove()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
          <span>Cancel</span>
        </div>
      </div>
    `;
    
    // Style the modal
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // UI Management
  showSignInPrompt() {
    this.hideSignInPrompt(); // Remove any existing prompt
    
    // Hide the main dashboard when showing sign-in
    const app = document.getElementById('app');
    if (app) {
      app.style.display = 'none';
      app.classList.remove('authenticated');
    }
    
    // Force light theme by temporarily adding light theme class to body
    document.body.classList.add('temp-light-theme');
    
    const signInOverlay = document.createElement('div');
    signInOverlay.id = 'sign-in-overlay';
    signInOverlay.className = 'light-theme-signin';
    signInOverlay.innerHTML = `
      <div class="sign-in-modal">
        <img src="icons/Dashie_Full_Logo_Orange_Transparent.png" alt="Dashie" class="dashie-logo-signin">
        
        <div class="sign-in-header">
          <h2>Welcome to Dashie!</h2>
          <p>Helping active families manage the chaos</p>
        </div>
        
        <div class="sign-in-content">
          <div id="google-signin-button"></div>
          <button id="manual-signin-btn" class="manual-signin-button">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <button id="exit-app-btn" class="exit-app-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Exit App
          </button>
        </div>
        
        <div class="sign-in-footer">
          <p>Your data stays private and secure</p>
        </div>
      </div>
    `;
    
    // Add styles - ensure light theme override works
    signInOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    document.body.appendChild(signInOverlay);
    
    // Render Google Sign-In button
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular'
      }
    );
    
    // Manual sign-in button
    document.getElementById('manual-signin-btn').addEventListener('click', () => {
      this.signIn();
    });
    
    // Exit app button
    document.getElementById('exit-app-btn').addEventListener('click', () => {
      this.exitApp();
    });
  }

  hideSignInPrompt() {
    const overlay = document.getElementById('sign-in-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Remove temporary light theme class
    document.body.classList.remove('temp-light-theme');
  }

  showSignedInState() {
    this.hideSignInPrompt();
    this.showDashboard();
    this.setupExitHandler();
  }

  showDashboard() {
    // Show the main dashboard
    const app = document.getElementById('app');
    if (app) {
      app.style.display = 'flex';
      app.classList.add('authenticated');
    }
  }

  setupExitHandler() {
    // Set up the exit/sign out handler - modify existing exit functionality
    window.dashieAuthUser = this.currentUser;
    window.dashieAuthShowExitModal = () => this.showExitSignOutModal();
    
    // Modify the existing exit handler to show our modal instead
    this.overrideExitHandler();
  }

  overrideExitHandler() {
    // Find and modify the exit menu item to show our modal
    const exitItem = document.querySelector('[data-menu="exit"]');
    if (exitItem) {
      // Change the label to "Exit / Sign Out"
      const label = exitItem.querySelector('.menu-label');
      if (label) {
        label.textContent = 'Exit / Sign Out';
      }
      
      // Override click handler
      const newExitItem = exitItem.cloneNode(true);
      newExitItem.addEventListener('click', () => {
        this.showExitSignOutModal();
      });
      exitItem.parentNode.replaceChild(newExitItem, exitItem);
    }
  }

  addSignInStyles() {
    // Add comprehensive styles for sign-in and exit modal
    const style = document.createElement('style');
    style.textContent = `
      /* Force light theme for sign-in - stronger override */
      .temp-light-theme .sign-in-modal,
      .light-theme-signin .sign-in-modal,
      .sign-in-modal {
        background: #FCFCFF !important;
        border-radius: 12px;
        padding: 40px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        color: #424242 !important;
      }
      
      .dashie-logo-signin {
        width: 150px !important;
        height: auto;
        margin: 0 auto 20px auto;
        display: block;
      }
      
      .temp-light-theme .sign-in-header h2,
      .light-theme-signin .sign-in-header h2,
      .sign-in-header h2 {
        color: #424242 !important;
        margin: 0 0 10px 0;
        font-size: 28px;
        font-weight: bold;
      }
      
      .temp-light-theme .sign-in-header p,
      .light-theme-signin .sign-in-header p,
      .sign-in-header p {
        color: #616161 !important;
        margin: 0 0 30px 0;
        font-size: 16px;
        font-style: italic;
      }
      
      .sign-in-content {
        margin: 30px 0;
      }
      
      .manual-signin-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 12px 20px;
        background: white;
        color: #333;
        border: 1px solid #dadce0;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 20px;
      }
      
      .manual-signin-button:hover {
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        background: #f8f9fa;
      }
      
      .exit-app-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
        padding: 12px 20px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 15px;
      }
      
      .exit-app-button:hover {
        background: #d32f2f;
        transform: scale(1.02);
      }
      
      .temp-light-theme .sign-in-footer p,
      .light-theme-signin .sign-in-footer p,
      .sign-in-footer p {
        color: #9e9e9e !important;
        font-size: 14px;
        margin: 0;
      }

      /* Exit/Sign Out Modal Styles */
      .exit-modal {
        background: var(--bg-primary);
        border-radius: 12px;
        padding: 20px;
        min-width: 300px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .exit-option {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px 20px;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: all var(--transition-fast);
        color: var(--text-primary);
        font-size: 16px;
      }
      
      .exit-option:hover {
        background: var(--bg-active);
        transform: scale(1.02);
      }
      
      .exit-option.cancel {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
      }
      
      .user-photo-modal {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .exit-option svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
    `;
    
    if (!document.querySelector('#auth-styles')) {
      style.id = 'auth-styles';
      document.head.appendChild(style);
    }
  }

  showError(message) {
    console.error('🔐 Auth Error:', message);
  }

  // Data persistence
  saveUser(userData) {
    try {
      localStorage.setItem('dashie-user', JSON.stringify(userData));
    } catch (error) {
      console.error('💾 Failed to save user data:', error);
    }
  }

  getSavedUser() {
    try {
      const saved = localStorage.getItem('dashie-user');
      if (saved) {
        const userData = JSON.parse(saved);
        // Check if sign-in is recent (less than 30 days)
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - userData.signedInAt < thirtyDays) {
          return userData;
        }
      }
    } catch (error) {
      console.error('💾 Failed to load user data:', error);
    }
    return null;
  }

  clearSavedUser() {
    try {
      localStorage.removeItem('dashie-user');
    } catch (error) {
      console.error('💾 Failed to clear user data:', error);
    }
  }

  // Public API
  getUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.isSignedIn && this.currentUser !== null;
  }
}

// Initialize and make globally available
let dashieAuth = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashieAuth = new SimpleAuth();
    dashieAuth.addSignInStyles();
  });
} else {
  dashieAuth = new SimpleAuth();
  dashieAuth.addSignInStyles();
}

// Make available globally
window.dashieAuth = dashieAuth;

export { SimpleAuth };
