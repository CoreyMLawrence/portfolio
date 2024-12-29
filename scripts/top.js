document.addEventListener('DOMContentLoaded', function () {
  // Initial animations
  gsap.from('.headline', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });
  gsap.to('.headline', {
    duration: 1,
    y: 0,
    opacity: 1,
    ease: 'power3.out',
  });

  gsap.from('.headline-line2', {
    duration: 1,
    y: 30,
    opacity: 0,
    delay: 0.4,
    ease: 'power3.out',
  });
  gsap.to('.headline-line2', {
    duration: 1,
    y: 0,
    opacity: 1,
    delay: 0.4,
    ease: 'power3.out',
  });

  gsap.from('.subheadline', {
    duration: 1,
    opacity: 0,
    y: 20,
    delay: 0.6,
    ease: 'power3.out',
  });
  gsap.to('.subheadline', {
    duration: 1,
    opacity: 1,
    y: 0,
    delay: 0.6,
    ease: 'power3.out',
  });

  gsap.from('.hero .cta', {
    duration: 0.8,
    opacity: 0,
    y: 20,
    delay: 0.6,
    ease: 'power1.out',
  });
  gsap.to('.hero .cta', {
    duration: 0.8,
    opacity: 1,
    y: 0,
    delay: 0.6,
    ease: 'power1.out',
  });
  let padding;
  let paddingStart;

  if (window.innerWidth > 445) {
    padding = '0.5em 50%';
    paddingStart = '0.5em 0';
  } else {
    padding = '0.5em 55%';
    paddingStart = '0.5em 0';
  }

  // Add animation for the #highlight block
  gsap.from('#highlight', {
    duration: 0.8,
    padding: paddingStart,
    opacity: 0,
    ease: 'power3.out',
    delay: 0,
  });

  gsap.to('#highlight', {
    duration: 0.8,
    padding: padding,
    opacity: 1,
    ease: 'power3.out',
    delay: 1,
  });

  window.addEventListener('load', function () {
    // Handle initial URL hash
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1); // Remove '#' from hash
      let customOffset = 0;

      switch (targetId) {
        case 'projects':
          customOffset = -30; // Offset for Projects
          break;
        case 'about':
          customOffset = 80; // Offset for About
          break;
        case 'expertise':
          customOffset = 10; // Offset for Specialties
          break;
      }

      // Ensure scrollToSection is called after DOM is fully loaded
      setTimeout(() => {
        scrollToSection('#' + targetId, customOffset); // Add '#' back when selecting

        // Clean up the URL after scrolling
        history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }, 0);
    }
  });
});
