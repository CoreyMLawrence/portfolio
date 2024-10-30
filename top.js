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
    delay: 0.6,
    ease: 'power3.out',
  });
  gsap.to('.subheadline', {
    duration: 1,
    opacity: 1,
    delay: 0.6,
    ease: 'power3.out',
  });

  gsap.from('.hero .cta', {
    duration: 1,
    opacity: 0,
    delay: 0.6,
    ease: 'power3.out',
  });
  gsap.to('.hero .cta', {
    duration: 1,
    opacity: 1,
    delay: 0.6,
    ease: 'power3.out',
  });

  // Add animation for the #highlight block
  gsap.from('#highlight', {
    duration: 0.8,
    padding: '0.5em 0em',
    opacity: 0,
    ease: 'power3.out',
    delay: 0.0,
  });
  gsap.to('#highlight', {
    duration: 0.8,
    padding: '0.5em 2.5em',
    opacity: 1,
    ease: 'power3.out',
    delay: 1,
  });
});
