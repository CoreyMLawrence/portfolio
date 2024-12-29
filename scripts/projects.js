// Word 1: Smooth slide in from below
gsap.from('#word1', {
  scrollTrigger: {
    trigger: '#project-title',
    start: 'top 90%',
    toggleActions: 'play none none',
  },
  duration: 1,
  y: 50,
  opacity: 0,
  ease: 'power2.out',
});

// Word 2: Smooth slide in from below with a slight delay
gsap.from('#word2', {
  scrollTrigger: {
    trigger: '#project-title',
    start: 'top 90%',
    toggleActions: 'play none none',
  },
  duration: 1,
  y: 50,
  opacity: 0,
  ease: 'power2.out',
  delay: 0.2,
});

// Make it look like "Impact" drops in from the page rather than the top

// First, enable 3D perspective on the parent element
gsap.set('#project-title', {
  transformStyle: 'preserve-3d',
  perspective: 1000,
});

// Word 3: “Slamming” effect as if falling from inside the page
gsap.from('#word3', {
  scrollTrigger: {
    trigger: '#project-title',
    start: 'top 90%',
    toggleActions: 'play none none',
  },
  duration: 1,
  z: 1500,
  opacity: 0,
  ease: 'bounce.out',
  delay: 0.6,
});

gsap.from('#projects-description', {
  scrollTrigger: {
    trigger: '#projects-title-area',
    start: 'top 80%',
    toggleActions: 'play none none reverse',
  },
  duration: 1.5,
  y: 30,
  opacity: 0,
  ease: 'power2.out',
  delay: 0.3,
});

// Animation for #threeD-title-mobile
gsap.fromTo(
  '#comfort-mockup',
  {
    y: 100,
    opacity: 0,
    rotationX: 50,
    transformStyle: 'preserve-3d',
    perspective: 1000,
  },
  {
    scrollTrigger: {
      trigger: '#comfort-mockup',
      start: 'top 95%',
      toggleActions: 'play none none reverse',
    },
    duration: 2.5,
    y: 0,
    opacity: 1,
    rotationX: 0,
    ease: 'power3.out',
  }
);

document.querySelectorAll('.description').forEach((description) => {
  gsap.from(description, {
    scrollTrigger: {
      trigger: description,
      start: 'top 95%',
      toggleActions: 'play none none reverse',
    },
    duration: 1,
    opacity: 0,
    y: 50,
    ease: 'power.in',
  });
});

// Animation for #music-mockup
gsap.fromTo(
  '#music-mockup',
  {
    opacity: 0,
  },
  {
    scrollTrigger: {
      trigger: '#music-mockup',
      start: 'top 95%',
      toggleActions: 'play none none reverse',
    },
    duration: 2,
    opacity: 1,
    ease: 'power3.out',
  }
);

gsap.from('#music-mockup img', {
  scrollTrigger: {
    trigger: '#music-mockup',
    start: 'top 70%',
    toggleActions: 'play none none reverse',
  },
  duration: (time) => 1.25 + time * 0.01,
  opacity: 0,
  y: (index) => 100 + index * 40, // Increment y by 40 for each image
  ease: 'power.in',
});

gsap.from('#music-features', {
  scrollTrigger: {
    trigger: '#music-features',
    start: 'top 95%',
    toggleActions: 'play none none reverse',
  },
  duration: 1,
  opacity: 0,
  y: 50,
  ease: 'power.in',
});

document.querySelectorAll('.devolve-video').forEach((container, index) => {
  gsap.from(container, {
    scrollTrigger: {
      trigger: container,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
    duration: 1.2,
    rotationY: index % 2 === 0 ? -15 : 15, // Alternate rotation direction
    ease: 'power4.in',
  });
});

// Initial animations for the mockup images with a subtle overlapping slide-in effect
gsap.from('#adventureai-mobile', {
  scrollTrigger: {
    trigger: '#adventureai-mockup',
    start: 'top 95%',
    toggleActions: 'play none none reverse',
  },
  duration: 1.5,
  x: -50,
  ease: 'power3.out',
});

gsap.from('#adventureai-full', {
  scrollTrigger: {
    trigger: '#adventureai-mockup',
    start: 'top 95%',
    toggleActions: 'play none none reverse',
  },
  duration: 1.5,
  x: 50,
  ease: 'power3.out',
});

// Scrub animations for the mockup images
gsap.fromTo(
  '#adventureai-mobile',
  { x: 0 }, // Start from the current position
  {
    scrollTrigger: {
      trigger: '#adventureai-mockup',
      start: 'center top',
      end: 'bottom top',
      scrub: 2,
      toggleActions: 'play none none reverse',
    },
    x: 20, // Move slightly right
    ease: 'power3.out',
  }
);

gsap.fromTo(
  '#adventureai-full',
  { x: 0 }, // Start from the current position
  {
    scrollTrigger: {
      trigger: '#adventureai-mockup',
      start: 'center top',
      end: 'bottom top',
      scrub: 2,
      toggleActions: 'play none none reverse',
    },
    x: -20, // Move slightly left
    ease: 'power3.out',
  }
);

// Animate the features
gsap.from('#adventureai-features .feature-item', {
  scrollTrigger: {
    trigger: '#adventureai-features',
    start: 'top 95%',
    toggleActions: 'play none none reverse',
  },
  duration: 1.5,
  y: 50,
  opacity: 0,
  ease: 'power3.out',
  stagger: 0.1,
});

document.addEventListener('DOMContentLoaded', function () {
  const comfortMockup = document.getElementById('comfort-mockup');
  const video = comfortMockup ? comfortMockup.querySelector('video') : null;

  // If video is not found, exit early
  if (!video) return;

  // Check if the screen width is 979 pixels or less
  const isSmallScreen = window.innerWidth <= 979;

  if (isSmallScreen) {
    comfortMockup.addEventListener('click', function (event) {
      event.preventDefault(); // Prevent the hyperlink from being followed

      // Try to enter fullscreen if on iOS
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // iOS-specific method for fullscreen
      } else {
        // Standard fullscreen for other browsers
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
          video.msRequestFullscreen();
        }
      }

      // Play the video if it's not already playing
      if (video.paused) {
        video.play();
      }
    });
  }

  const devolveMockup = document.getElementById('devolve-mockup');
  const videos = devolveMockup.querySelectorAll('video');

  // Function to request fullscreen for a video
  function requestFullscreen(video) {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen(); // For iOS
    }
  }

  // Add event listeners to each video in devolve-mockup
  videos.forEach((video) => {
    video.addEventListener('click', function (event) {
      // Prevent default action (e.g., hyperlink)
      event.stopPropagation(); // Stop the event from propagating to any parent elements
      requestFullscreen(video); // Request fullscreen on tap

      // Play the video if it's not already playing
      if (video.paused) {
        video.play();
      }
    });
  });
});
