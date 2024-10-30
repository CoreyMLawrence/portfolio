document.addEventListener('DOMContentLoaded', function () {
  // Initial animations
  gsap.from('.headline', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
  });

  gsap.from('.headline-line2', {
    duration: 1,
    y: 30,
    opacity: 0,
    delay: 0.4, // Slightly increased delay to differentiate from line 1
    ease: 'power3.out',
  });

  gsap.from('.subheadline', {
    duration: 1,
    opacity: 0,
    delay: 0.6,
    ease: 'power3.out',
  });

  gsap.from('.hero .cta', {
    duration: 1,
    opacity: 0,
    delay: 0.9,
    ease: 'power3.out',
  });

  // Add animation for the #highlight block
  gsap.from('#highlight', {
    duration: 1,
    padding: '0.5em 0em', // Initial padding
    ease: 'power3.out',
    delay: 0.0, // Adjust the delay as needed to fit your sequence
    onComplete: () => {
      gsap.to('#highlight', {
        padding: '0.5em 2.5em', // Final padding
        duration: 0.5, // Duration for the padding expansion
        ease: 'power3.out',
      });
    },
  });
});
