// Chat Preview Functionality
document.addEventListener('DOMContentLoaded', function () {
  const chatPreviewSection = document.querySelector('.chat-preview');
  const chatPreviewContent = document.querySelector('.chat-preview-content');
  const chatIframeContainer = document.querySelector('.chat-iframe-container');
  const chatOverlay = document.querySelector('.chat-overlay');
  const chatNowBtn = document.querySelector('.chat-now-btn');
  const chatIframe = document.getElementById('chat-iframe');

  // Device detection and responsive dimensions
  function getDeviceType() {
    const width = window.innerWidth;
    if (width <= 480) return 'mobile';
    if (width <= 768) return 'tablet';
    if (width <= 1024) return 'tablet-landscape';
    return 'desktop';
  }

  function getContainerDimensions() {
    const deviceType = getDeviceType();
    const vh = window.innerHeight;

    // Get the content container width to align with title
    const contentContainer = document.querySelector('.chat-preview-content');
    const contentWidth = contentContainer
      ? contentContainer.offsetWidth
      : window.innerWidth * 0.8;

    switch (deviceType) {
      case 'mobile':
        return {
          width: contentWidth, // Use full content container width
          height: Math.max(vh * 0.85, 350),
          aspectRatio: 9 / 16,
        };
      case 'tablet':
        return {
          width: contentWidth, // Use full content container width
          height: Math.max(vh * 0.8, 400),
          aspectRatio: 3 / 4,
        };
      case 'tablet-landscape':
        return {
          width: contentWidth, // Use full content container width
          height: Math.max(vh * 0.75, 450),
          aspectRatio: 4 / 3,
        };
      default: // desktop
        return {
          width: contentWidth, // Use full content container width
          height: Math.max(vh * 0.7, 500),
          aspectRatio: 16 / 10,
        };
    }
  }

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

  // Initialize responsive dimensions
  function initializeResponsiveDimensions() {
    const dimensions = getContainerDimensions();
    const deviceType = getDeviceType();

    gsap.set(chatIframeContainer, {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      borderRadius:
        deviceType === 'mobile'
          ? '12px'
          : deviceType === 'tablet'
          ? '15px'
          : '20px',
    });
  }

  // Initialize on load
  initializeResponsiveDimensions();

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

    // Phase 1: Setup and smooth positioning transition
    expansionTl.call(
      () => {
        if (chatOverlay) chatOverlay.style.display = 'none';
        chatIframeContainer.classList.add('transitioning');
        document.body.style.overflow = 'hidden';
      },
      null,
      0
    );

    // Phase 2: Smoothly move to fixed positioning at current location
    expansionTl.to(chatIframeContainer, {
      duration: 0.1,
      ease: 'power2.out',
      onStart: function () {
        // Set to fixed position but maintain current visual position
        gsap.set(chatIframeContainer, {
          position: 'fixed',
          top: currentTop,
          left: currentLeft,
          width: currentWidth,
          height: currentHeight,
          zIndex: 999,
        });
      },
    });

    // Phase 3: Expand to fullscreen with smooth animation
    expansionTl.to(
      chatIframeContainer,
      {
        duration: 0.5,
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
      0.1
    );

    // Phase 4: Fade out section content in parallel
    expansionTl.to(
      ['.chat-preview-title', '.chat-preview-subtitle'],
      {
        duration: 0.4,
        opacity: 0,
        y: -10,
        ease: 'power2.out',
      },
      0.1
    );

    return expansionTl;
  }

  // Click handler for the overlay and button
  function handleChatStart() {
    if (isExpanded) return; // Prevent multiple expansions

    // Center the start chatting button in viewport before expansion
    chatNowBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait for scroll to complete before starting expansion
    setTimeout(() => {
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
    }, 300); // Wait 600ms for smooth scroll to complete
  }

  // Function to close the expanded iframe
  function closeExpansion() {
    if (!isExpanded || !expansionTl) return;

    isExpanded = false;
    chatNowBtn.innerText = 'Continue Chatting';

    // Reverse the expansion timeline
    expansionTl.reverse().eventCallback('onReverseComplete', function () {
      // Clean up classes and styles
      chatIframeContainer.classList.remove('fullscreen', 'transitioning');
      if (chatOverlay) chatOverlay.style.display = '';
      document.body.style.overflow = '';
      setTimeout(() => {
        // Get responsive dimensions for the current device
        const dimensions = getContainerDimensions();

        // Reset positioning to responsive state
        gsap.set(chatIframeContainer, {
          position: 'relative',
          top: 'auto',
          left: 'auto',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          zIndex: 'auto',
          borderRadius:
            getDeviceType() === 'mobile'
              ? '12px'
              : getDeviceType() === 'tablet'
              ? '15px'
              : '20px',
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
      }, 600);
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
    // Update container dimensions for responsive behavior when not in fullscreen
    if (!isExpanded) {
      const dimensions = getContainerDimensions();
      const deviceType = getDeviceType();

      // Update container dimensions based on current device type
      gsap.set(chatIframeContainer, {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        borderRadius:
          deviceType === 'mobile'
            ? '12px'
            : deviceType === 'tablet'
            ? '15px'
            : '20px',
      });

      // Reset expansion timeline since dimensions changed
      if (expansionTl) {
        expansionTl.kill();
        expansionTl = null;
      }
    }
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
