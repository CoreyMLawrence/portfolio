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
    delay: 0.0,
  });

  gsap.to('#highlight', {
    duration: 0.8,
    padding: padding,
    opacity: 1,
    ease: 'power3.out',
    delay: 1,
  });
});
