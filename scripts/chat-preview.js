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

  // Animate chat preview section elements on scroll
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.chat-preview',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  });

  tl.to('.chat-preview-title', {
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

  // Click handler for the overlay and button
  function handleChatStart() {
    // Set a flag in sessionStorage to disable animations on the chat page
    sessionStorage.setItem('skipIntroAnimations', 'true');

    // Add transition class for smooth animation
    chatIframeContainer.classList.add('transitioning');

  // Remove overlay immediately
  if (chatOverlay) chatOverlay.style.display = 'none';
  chatIframeContainer.classList.add('fullscreen', 'transitioning');
  document.body.style.overflow = 'hidden';

    // Create GSAP timeline for the expansion animation
    const expandTl = gsap.timeline({
      onComplete: function () {
        window.location.href = './chat/';
      },
    });

    // Expand the container to fullscreen
    expandTl.to(chatIframeContainer, {
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0);

    // Subtle scale animation for smoothness
    expandTl.to(chatIframe, {
      duration: 0.6,
      scale: 1.01,
      ease: 'power2.inOut',
      onComplete: function () {
        gsap.set(chatIframe, { scale: 1 });
      },
    }, 0);

    // Fade out section content for cleaner transition
    expandTl.to(['.chat-preview-title', '.chat-preview-subtitle'], {
      duration: 0.3,
      opacity: 0,
      y: -10,
      ease: 'power2.out',
    }, 0);
  }

  // Event listeners
  chatOverlay.addEventListener('click', handleChatStart);
  chatNowBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    handleChatStart();
  });

  // Handle escape key to exit fullscreen if needed
  document.addEventListener('keydown', function (e) {
    if (
      e.key === 'Escape' &&
      chatIframeContainer.classList.contains('fullscreen')
    ) {
      exitFullscreen();
    }
  });

  function exitFullscreen() {
    chatIframeContainer.classList.remove('fullscreen', 'transitioning');
    chatOverlay.classList.remove('hidden');
    document.body.style.overflow = '';

    gsap.set(['.chat-preview-title', '.chat-preview-subtitle'], {
      opacity: 1,
      y: 0,
    });

    gsap.set(chatIframe, {
      scale: 1,
    });
  }

  // Simplified hover effects
  chatIframeContainer.addEventListener('mouseenter', function () {
    if (!chatIframeContainer.classList.contains('fullscreen')) {
      gsap.to(chatIframeContainer, {
        duration: 0.3,
        scale: 1.01,
        ease: 'power2.out',
      });
    }
  });

  chatIframeContainer.addEventListener('mouseleave', function () {
    if (!chatIframeContainer.classList.contains('fullscreen')) {
      gsap.to(chatIframeContainer, {
        duration: 0.3,
        scale: 1,
        ease: 'power2.out',
      });
    }
  });

  // Button hover animations (simplified)
  chatNowBtn.addEventListener('mouseenter', function () {
    if (!chatIframeContainer.classList.contains('fullscreen')) {
      gsap.to(chatNowBtn, {
        duration: 0.3,
        scale: 1.05,
        ease: 'power2.out',
      });
    }
  });

  chatNowBtn.addEventListener('mouseleave', function () {
    if (!chatIframeContainer.classList.contains('fullscreen')) {
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

  // Preload the chat page for faster transition
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'prefetch';
  preloadLink.href = './chat/';
  document.head.appendChild(preloadLink);

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
