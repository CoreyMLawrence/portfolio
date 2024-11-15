document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Animate h3 elements
  document.querySelectorAll('h3').forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 60%',
        toggleActions: 'play none none none',
        scrub: false,
      },
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
  });

  // Animate ul elements within the body only
  document.querySelectorAll('.blog-post ul').forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 60%',
        toggleActions: 'play none none none',
        scrub: false,
      },
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
  });

  // Animate ul elements within the body only
  document.querySelectorAll('.answer').forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 60%',
        toggleActions: 'play none none none',
        scrub: false,
      },
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
  });

  // Animate code blocks
  document.querySelectorAll('pre code').forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 60%',
        toggleActions: 'play none none none',
        scrub: false,
      },
      opacity: 0,
      y: 20,
      duration: 0.5,
    });
  });

  // Add pop animation to .importance elements
  document.querySelectorAll('.importance').forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 60%',
        toggleActions: 'play none none none',
        scrub: false,
      },
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: 'back.out(1.7)',
    });
  });
});
