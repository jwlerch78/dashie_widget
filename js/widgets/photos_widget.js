// photo_widget.js - with D-pad navigation support
document.addEventListener("DOMContentLoaded", function() {
  // --- Elements ---
  const photoImg = document.getElementById("photoImg");
  
  // --- Photo State ---
  let currentPhotoIndex = 0;
  let shuffledPhotos = [];
 
  // --- Photo Functions ---
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function showPhoto(index) {
    if (index < 0) {
      currentPhotoIndex = shuffledPhotos.length - 1;
    } else if (index >= shuffledPhotos.length) {
      currentPhotoIndex = 0;
    } else {
      currentPhotoIndex = index;
    }
    photoImg.src = shuffledPhotos[currentPhotoIndex] + "?t=" + Date.now();
    console.log(`📸 Showing photo ${currentPhotoIndex + 1} of ${shuffledPhotos.length}`);
  }

  function nextPhoto() {
    showPhoto(currentPhotoIndex + 1);
  }

  function prevPhoto() {
    showPhoto(currentPhotoIndex - 1);
  }

  // Make functions globally available for navigation
  window.photoNextPhoto = nextPhoto;
  window.photoPrevPhoto = prevPhoto;

  // --- D-pad Navigation ---
  // Listen for commands from parent dashboard
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action) {
      const action = event.data.action;
      console.log('📸 Photos widget received command:', action);
      
      switch(action) {
        case 'right':
          nextPhoto();
          break;
        case 'left':
          prevPhoto();
          break;
        case 'up':
          // Optional: could jump forward by 10 photos
          showPhoto(currentPhotoIndex + 10);
          break;
        case 'down':
          // Optional: could jump backward by 10 photos  
          showPhoto(currentPhotoIndex - 10);
          break;
        case 'enter':
          // Optional: could pause/resume auto-advance
          console.log('📸 Enter pressed on photos widget');
          break;
        default:
          console.log('📸 Photos widget ignoring command:', action);
          break;
      }
    }
  });

  // --- Initialize Photos ---
  function initializePhotos() {
    shuffledPhotos = shuffleArray(photos);
    showPhoto(0);
    
    // Auto-advance every 15 seconds
    setInterval(nextPhoto, 15000);
  }

  // Send ready signal to parent dashboard
  window.addEventListener('load', () => {
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'widget-ready', 
        widget: 'photos' 
      }, '*');
    }
  });

  initializePhotos();
});
