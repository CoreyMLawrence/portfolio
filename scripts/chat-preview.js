// Chat Preview Functionality
document.addEventListener('DOMContentLoaded', function () {
  const chatPreviewSection = document.querySelector('.chat-preview');
  const chatPreviewContent = document.querySelector('.chat-preview-content');
  const chatIframeContainer = document.querySelector('.chat-iframe-container');
  const chatOverlay = document.querySelector('.chat-overlay');
  const chatNowBtn = document.querySelector('.chat-now-btn');
  const chatIframe = document.getElementById('chat-iframe');

  // GSAP animations for the chat preview section
  gsap.registerPlugin(ScrollTrigger);

  // Entry timeline - separate from expansion
  const entryTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.chat-preview',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  });

  entryTl
    .to('.chat-preview-title', {
      duration: 0.8,
      y: 0,
      opacity: 1,
      ease: 'power3.out',
    })
    .to(
      '.chat-preview-subtitle',
      {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: 'power3.out',
      },
      '-=0.6'
    )
    .to(
      '.chat-iframe-container',
      {
        duration: 0.8,
        y: 0,
        opacity: 1,
        ease: 'power3.out',
      },
      '-=0.6'
    );

  // Expansion timeline - separate timeline for fullscreen expansion
  let expansionTl = null;
  let isExpanded = false;

  // Initially don't load the iframe
  const originalSrc = chatIframe.getAttribute('data-src');
  chatIframe.setAttribute('data-loading', 'true');

  let iframeLoaded = false;

  // Iframe loading state
  chatIframe.addEventListener('load', function () {
    chatIframe.removeAttribute('data-loading');
    iframeLoaded = true;

    // Hide loading overlay if it exists
    const loadingOverlay =
      chatIframeContainer.querySelector('.loading-overlay');
    if (loadingOverlay) {
      gsap.to(loadingOverlay, {
        duration: 0.3,
        opacity: 0,
        onComplete: function () {
          loadingOverlay.remove();
        },
      });
    }
  });

  // Function to create expansion timeline
  function createExpansionTimeline() {
    expansionTl = gsap.timeline({ paused: true });

    // Get the current position and dimensions of the iframe container
    const rect = chatIframeContainer.getBoundingClientRect();
    const currentTop = rect.top;
    const currentLeft = rect.left;
    const currentWidth = rect.width;
    const currentHeight = rect.height;

    // Hide overlay immediately and set up for animation
    expansionTl.call(
      () => {
        if (chatOverlay) chatOverlay.style.display = 'none';
        // Add transitioning class but not fullscreen yet
        chatIframeContainer.classList.add('transitioning');

        // Set container to fixed position at current location
        gsap.set(chatIframeContainer, {
          position: 'fixed',
          top: currentTop,
          left: currentLeft,
          width: currentWidth,
          height: currentHeight,
          zIndex: 999,
        });

        // Don't change iframe positioning at all - let it maintain its current state
        document.body.style.overflow = 'hidden';
      },
      null,
      0
    );

    // Animate ONLY the container - iframe will scale perfectly with it
    expansionTl.to(
      chatIframeContainer,
      {
        duration: 0.4,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        ease: 'power2.inOut',
        onComplete: function () {
          chatIframeContainer.classList.add('fullscreen');
        },
      },
      0
    );

    // Fade out section content
    expansionTl.to(
      ['.chat-preview-title', '.chat-preview-subtitle'],
      {
        duration: 0.5,
        opacity: 0,
        y: -10,
        ease: 'power2.out',
      },
      0
    );

    return expansionTl;
  }

  // Click handler for the overlay and button
  function handleChatStart() {
    if (isExpanded) return; // Prevent multiple expansions

    console.log('Starting chat expansion...');

    // Load iframe if not already loaded
    if (!iframeLoaded && originalSrc) {
      chatIframe.src = originalSrc;
    }

    // Create and play expansion timeline
    if (!expansionTl) {
      createExpansionTimeline();
    }

    expansionTl.play();
    isExpanded = true;

    // Set up history state for back button handling
    history.pushState({ chatExpanded: true }, '', window.location.href);
    console.log('Chat expanded, history state set');
  }

  // Function to close the expanded iframe
  function closeExpansion() {
    if (!isExpanded || !expansionTl) return;

    console.log('Closing chat expansion...');
    isExpanded = false;

    // Reverse the expansion timeline
    expansionTl.reverse().eventCallback('onReverseComplete', function () {
      // Clean up classes and styles
      chatIframeContainer.classList.remove('fullscreen', 'transitioning');
      if (chatOverlay) chatOverlay.style.display = '';
      document.body.style.overflow = '';
      setTimeout(() => {
        // Reset positioning to original state
        gsap.set(chatIframeContainer, {
          position: 'relative',
          top: 'auto',
          left: 'auto',
          width: '80vw',
          height: '70vh',
          zIndex: 'auto',
          borderRadius: '20px',
        });

        // Reset iframe to natural container-filling state
        gsap.set(chatIframe, {
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
          transform: 'none',
        });

        // Reset elements to their original state
        gsap.set(['.chat-preview-title', '.chat-preview-subtitle'], {
          opacity: 1,
          y: 0,
        });
      }, 400);
      // Clear the event callback to prevent memory leaks
      expansionTl.eventCallback('onReverseComplete', null);
    });
  }

  // Event listeners
  chatOverlay.addEventListener('click', handleChatStart);
  chatNowBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    handleChatStart();
  });

  // Handle back button to close expanded iframe
  window.addEventListener('popstate', function (e) {
    console.log('Popstate event:', e.state, 'isExpanded:', isExpanded);
    if (isExpanded) {
      closeExpansion();
    }
  });

  // Handle escape key to exit fullscreen
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isExpanded) {
      closeExpansion();
      // Remove the history state by going back
      history.back();
    }
  });

  // Simplified hover effects
  chatIframeContainer.addEventListener('mouseenter', function () {
    if (!isExpanded) {
      gsap.to(chatIframeContainer, {
        duration: 0.3,
        scale: 1.01,
        ease: 'power2.out',
      });
    }
  });

  chatIframeContainer.addEventListener('mouseleave', function () {
    if (!isExpanded) {
      gsap.to(chatIframeContainer, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out',
      });
    }
  });

  // Button hover animations (simplified)
  chatNowBtn.addEventListener('mouseenter', function () {
    if (!isExpanded) {
      gsap.to(chatNowBtn, {
        duration: 0.3,
        scale: 1.05,
        ease: 'power2.out',
      });
    }
  });

  chatNowBtn.addEventListener('mouseleave', function () {
    if (!isExpanded) {
      gsap.to(chatNowBtn, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out',
      });
    }
  });

  // Handle window resize for fullscreen mode
  window.addEventListener('resize', function () {
    // No JS resizing; let CSS .fullscreen control width/height
  });

  // Intersection observer for lazy loading and animation triggering
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !iframeLoaded) {
          // Create loading overlay
          const loadingOverlay = document.createElement('div');
          loadingOverlay.className = 'loading-overlay';
          loadingOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--light-gray);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
          z-index: 1;
        `;
          loadingOverlay.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid var(--primary);
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
          "></div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        `;

          chatIframeContainer.appendChild(loadingOverlay);

          // Load the iframe when it comes into view
          chatIframe.src = originalSrc;
          iframeLoaded = true;
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px', // Start loading 50px before it comes into view
    }
  );

  observer.observe(chatIframeContainer);
});
