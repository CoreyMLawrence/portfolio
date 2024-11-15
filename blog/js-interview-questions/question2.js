// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
  // Select the elements for the animation
  const looseEquality = document.getElementById('loose-equality');
  const strictEquality = document.getElementById('strict-equality');
  const looseResult = document.getElementById('loose-result');
  const strictResult = document.getElementById('strict-result');

  // GSAP animation sequence
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

  tl.set([looseResult, strictResult], { opacity: 0, scale: 0.5 });

  tl.to(looseEquality, { opacity: 1, duration: 0.75 })
    .to(looseResult, {
      opacity: 1,
      scale: 1,
      duration: 0.75,
      ease: 'back.out(1.7)',
    })
    .to(looseEquality, { opacity: 0.5, duration: 0.75 }, '+=1.5')
    .to(looseResult, {
      opacity: 0,
      scale: 0.5,
      duration: 0.75,
      ease: 'back.in(1.7)',
    })
    .to(strictEquality, { opacity: 1, duration: 0.75 })
    .to(strictResult, {
      opacity: 1,
      scale: 1,
      duration: 0.75,
      ease: 'back.out(1.7)',
    })
    .to(strictEquality, { opacity: 0.5, duration: 0.75 }, '+=1.5')
    .to(strictResult, {
      opacity: 0,
      scale: 0.5,
      duration: 0.75,
      ease: 'back.in(1.7)',
    });

  // Add hover effects
  [looseEquality, strictEquality].forEach((element) => {
    element.addEventListener('mouseenter', () => {
      gsap.to(element, { scale: 1.1, duration: 0.3, ease: 'back.out(1.7)' });
    });
    element.addEventListener('mouseleave', () => {
      gsap.to(element, { scale: 1, duration: 0.3, ease: 'back.out(1.7)' });
    });
  });
});
