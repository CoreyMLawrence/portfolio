// Wait for DOM content to load
document.addEventListener('DOMContentLoaded', () => {
  // Select all data type icons
  const icons = document.querySelectorAll('.data-type-icon');

  //disable hover completely here
  icons.forEach((icon) => (icon.style.pointerEvents = 'none'));

  // Initial animation sequence
  gsap.set(icons, { opacity: 0, scale: 0.5 });

  // Create scroll-triggered animation
  icons.forEach((icon, index) => {
    gsap.to(icon, {
      scrollTrigger: {
        trigger: icon,
        start: 'top bottom',
        toggleActions: 'play none none reverse',
      },
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'power2.inout',
      delay: index * 0.05,
      onComplete: () => {
        icon.classList.add('hover-enabled');
        icon.style.pointerEvents = 'auto';
      },
    });
  });

  function createHoverEffect(icon, type) {
    const iconContent = icon.querySelector('.icon-text');

    switch (type) {
      case 'String':
        // Implement string unraveling effect
        const originalStringContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalStringContent); // Save original content
        iconContent.innerHTML = ''; // Clear existing content

        const stringToReveal = '"Hello World"';
        let stringIndex = 0;
        const stringInterval = setInterval(() => {
          if (stringIndex < stringToReveal.length) {
            iconContent.textContent += stringToReveal.charAt(stringIndex);
            stringIndex++;
          } else {
            clearInterval(stringInterval);
          }
        }, 100); // 100ms per character

        icon.setAttribute('data-interval', stringInterval);
        break;

      case 'Number':
        // Implement dynamic number animation
        const originalNumberContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalNumberContent); // Save original content
        iconContent.innerHTML = '45.67'; // Clear existing content

        const numbersToShow = ['890', '3.14', '42', '123'];
        let numberIndex = 0;
        const numberInterval = setInterval(() => {
          if (numberIndex < numbersToShow.length) {
            iconContent.textContent = numbersToShow[numberIndex];
            numberIndex++;
          } else {
            numberIndex = 0; // Loop back to the start
          }
        }, 500); // 500ms per number

        icon.setAttribute('data-interval', numberInterval);
        break;

      case 'Boolean':
        // Flip between true and false
        gsap.to(iconContent, {
          rotateY: 180,
          duration: 0.5,
          onComplete: () => {
            iconContent.textContent =
              iconContent.textContent === 'true' ? 'false' : 'true';
            gsap.set(iconContent, { rotateY: 0 });
          },
        });
        break;

      case 'Null':
        // Implement null animation
        gsap.to(iconContent, {
          opacity: 0.3,
          duration: 0.5,
          ease: 'sine.inOut',
        });
        break;

      case 'Undefined':
        // Implement undefined animation
        const originalUndefinedContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalUndefinedContent); // Save original content
        iconContent.innerHTML = ''; // Clear existing content

        const undefinedToShow = '?';
        gsap.to(iconContent, {
          text: {
            value: undefinedToShow,
            delimiter: '',
          },
          duration: 0.3,
          ease: 'none',
        });
        break;

      case 'Symbol':
        // Implement symbol uniqueness animation
        const originalSymbolContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalSymbolContent); // Save original content
        iconContent.innerHTML = '🔑'; // Clear existing content

        const symbolText = '';
        let symbolIndex = 0;
        const symbolInterval = setInterval(() => {
          if (symbolIndex < symbolText.length) {
            iconContent.textContent += symbolText.charAt(symbolIndex);
            symbolIndex++;
          } else {
            clearInterval(symbolInterval);
            // Add a unique identifier to emphasize uniqueness
            iconContent.textContent += `_${Math.random()
              .toString(36)
              .substr(2, 4)}`;
          }
        }, 200); // 100ms per character

        icon.setAttribute('data-interval', symbolInterval);
        break;

      case 'Object': {
        // Implement typewriter effect
        const originalContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalContent); // Save original content
        iconContent.innerHTML = ''; // Clear existing content

        const textToType = '{key: value,\n  id: 1}';
        iconContent.style.fontSize = '1em';
        let charIndex = 0;
        const typingInterval = setInterval(() => {
          if (charIndex < textToType.length) {
            iconContent.textContent += textToType.charAt(charIndex);
            charIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, 70); // 70ms per character

        icon.setAttribute('data-interval', typingInterval);
        break;
      }

      case 'BigInt':
        // Implement BigInt example
        const originalBigIntContent = 'BigInt';
        icon.setAttribute('data-original', originalBigIntContent); // Save original content
        iconContent.innerHTML = ''; // Clear existing content

        const bigIntText = '1234567890123456789012345678901234567890';
        let bigIntIndex = 0;
        const bigIntInterval = setInterval(() => {
          if (bigIntIndex < bigIntText.length) {
            iconContent.textContent += bigIntText.charAt(bigIntIndex);
            bigIntIndex++;
          } else {
            clearInterval(bigIntInterval);
          }
        }, 100); // 100ms per character

        icon.setAttribute('data-interval', bigIntInterval);
        break;

      case 'Array': {
        const originalArrayContent = '[   ]';
        icon.setAttribute('data-original', originalArrayContent);
        iconContent.innerHTML = '';
        iconContent.classList.add('array-content');

        const arrayToShow = '1, 2, 3';
        let arrayIndex = 0;
        const arrayInterval = setInterval(() => {
          if (arrayIndex < arrayToShow.length) {
            iconContent.textContent += arrayToShow.charAt(arrayIndex);
            arrayIndex++;
          } else {
            clearInterval(arrayInterval);
          }
        }, 60);

        icon.setAttribute('data-interval', arrayInterval);

        const bracketContainer = document.createElement('div');
        bracketContainer.className = 'array-bracket-container';
        icon.appendChild(bracketContainer);

        ['[', ']'].forEach((bracket) => {
          const bracketEl = document.createElement('div');
          bracketEl.className = 'array-bracket';
          bracketEl.textContent = bracket;
          bracketContainer.appendChild(bracketEl);
        });

        gsap.to(bracketContainer, {
          gap: '80px',
          duration: 0.5,
          ease: 'power1.inOut',
        });
        break;
      }

      case 'Function': {
        // Implement function syntax with parameter and return value animation
        const originalFunctionContent = iconContent.innerHTML;
        icon.setAttribute('data-original', originalFunctionContent);
        iconContent.innerHTML = '';

        const funcText = 'fn(x) { return x + 1; }';
        let charIndex = 0;
        const typingInterval = setInterval(() => {
          if (charIndex < funcText.length) {
            iconContent.textContent += funcText.charAt(charIndex);
            charIndex++;
          } else {
            clearInterval(typingInterval);
            const timeoutId = setTimeout(() => {
              iconContent.innerHTML = 'fn(2) -> 3';
            }, 1000);
            icon.setAttribute('data-timeout', timeoutId);
          }
        }, 70);

        icon.setAttribute('data-interval', typingInterval);
        break;
      }
    }
  }

  function removeHoverEffect(icon, type) {
    const iconContent = icon.querySelector('.icon-text');

    switch (type) {
      case 'String':
        // Restore original content and clear unraveling effect
        const originalString = icon.getAttribute('data-original');
        iconContent.textContent = originalString;
        clearInterval(icon.getAttribute('data-interval'));
        break;

      case 'Number':
        // Restore original content and clear number animation
        const originalNumber = icon.getAttribute('data-original');
        iconContent.textContent = originalNumber;
        clearInterval(icon.getAttribute('data-interval'));
        break;

      case 'Boolean':
        iconContent.textContent = 'true';
        break;

      case 'Null':
        // Restore original opacity
        gsap.to(iconContent, {
          opacity: 1,
          duration: 0.3,
          ease: 'sine.inOut',
        });
        break;

      case 'Undefined':
        // Restore original content and clear undefined animation
        const originalUndefined = icon.getAttribute('data-original');
        iconContent.textContent = originalUndefined;
        break;

      case 'Symbol':
        // Restore original content and clear symbol animation
        const originalSymbol = icon.getAttribute('data-original');
        iconContent.textContent = originalSymbol;
        clearInterval(icon.getAttribute('data-interval'));
        break;

      case 'Object':
        // Restore original content and clear typing effect
        const original = icon.getAttribute('data-original');
        iconContent.textContent = original;
        clearInterval(icon.getAttribute('data-interval'));
        break;

      case 'BigInt':
        // Restore original content and clear BigInt animation
        const originalBigInt = icon.getAttribute('data-original');
        iconContent.textContent = originalBigInt;
        clearInterval(icon.getAttribute('data-interval'));
        break;

      case 'Array':
        // Reverse the array animation
        const originalArray = icon.getAttribute('data-original');
        clearInterval(icon.getAttribute('data-interval'));

        // Animate brackets back to the center
        const bracketContainer = icon.querySelector('div');

        gsap.to(bracketContainer, {
          gap: '0',
          duration: 0.2,
          ease: 'power1.inOut',
          onComplete: () => {
            iconContent.textContent = originalArray;
            icon
              .querySelectorAll('.array-bracket')
              .forEach((el) => el.remove());
            gsap.to(iconContent, { opacity: 1, duration: 0.5 });
          },
        });
        break;

      case 'Function': {
        // Clear any pending timeouts stored on the icon
        const pendingTimeout = icon.getAttribute('data-timeout');
        if (pendingTimeout) {
          clearTimeout(parseInt(pendingTimeout));
          icon.removeAttribute('data-timeout');
        }

        // Clear any running intervals
        clearInterval(icon.getAttribute('data-interval'));
        icon.removeAttribute('data-interval');

        // Immediately restore original content
        const originalFunctionContent = icon.getAttribute('data-original');
        iconContent.textContent = originalFunctionContent;

        // Reset any added styles
        iconContent.style.removeProperty('font-size');

        break;
      }
    }
  }

  // Enhanced hover effects
  icons.forEach((icon) => {
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.innerHTML = getTooltipContent(icon.getAttribute('data-type'));
    icon.appendChild(tooltip);

    const type = icon.getAttribute('data-type');
    let isFullExplanation = false;

    icon.addEventListener('mouseenter', () => {
      if (!icon.classList.contains('hover-enabled')) return;

      // Stop the floating animation
      gsap.killTweensOf(icon);

      // Pop-up effect on hover
      gsap.to(icon, {
        scale: 1.15,
        duration: 0.3,
        ease: 'back.out(1.5)',
      });

      // Show tooltip
      gsap.to(tooltip, {
        opacity: 1,
        y: -10,
        duration: 0.3,
        ease: 'power2.out',
      });

      createHoverEffect(icon, type);
    });

    icon.addEventListener('mouseleave', () => {
      if (!icon.classList.contains('hover-enabled')) return;

      // Reset scale
      gsap.to(icon, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });

      // Hide tooltip
      gsap.to(tooltip, {
        opacity: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.in',
      });

      removeHoverEffect(icon, type);
    });

    let touchStarted = false;
    // Detect touchstart to mark touch behavior
    icon.addEventListener('touchstart', function handler(event) {
      touchStarted = true;
      tooltip.innerHTML = getTooltipContent(type);
      icon.removeEventListener('touchstart', handler);
    });

    // Handle click event (mouse or keyboard)
    icon.addEventListener('click', (event) => {
      // If it's a touch event, prevent further click processing
      if (touchStarted) {
        touchStarted = false; // Reset the flag after handling touch
        return; // Don't handle the click if it's a touch event
      }

      if (!icon.classList.contains('hover-enabled')) return;

      // Perform action on click
      if (isFullExplanation) {
        tooltip.innerHTML = getTooltipContent(type);
      } else {
        tooltip.innerHTML = getFullExplanation(type);
      }
      isFullExplanation = !isFullExplanation;
    });
  });

  // Function to get tooltip content based on data type
  function getTooltipContent(type) {
    switch (type) {
      case 'String':
        return 'String: Text data, e.g., "Hello World"';
      case 'Number':
        return 'Number: Numeric data, e.g., 42, 3.14';
      case 'Boolean':
        return 'Boolean: true or false values';
      case 'Null':
        return 'Null: Intentionally empty value';
      case 'Undefined':
        return 'Undefined: Variable declared but not assigned a value';
      case 'Symbol':
        return 'Symbol: Unique identifier, e.g., Symbol("id")';
      case 'Object':
        return 'Object: Collection of key-value pairs, e.g., {name: "John"}';
      case 'BigInt':
        return 'BigInt: Integer values larger than 2<sup>53</sup> - 1, e.g., 10<sup>21</sup>';
      case 'Array':
        return 'Array: Ordered list of values, e.g., [1, 2, 3]';
      case 'Function':
        return 'Function: Reusable block of code, e.g., fn(x) { return x + 1; }';
      default:
        return '';
    }
  }

  // Function to get full explanation based on data type
  function getFullExplanation(type) {
    switch (type) {
      case 'String':
        return 'String: A sequence of characters used to represent text. Strings are immutable, meaning their values cannot be changed once created. Common methods include .length, .toUpperCase(), and .substring().';
      case 'Number':
        return 'Number: Represents numeric data, including integers and floating-point numbers. JavaScript uses a 64-bit floating-point format for all numbers. Examples include arithmetic operations and methods like .toFixed() and .toPrecision().';
      case 'Boolean':
        return 'Boolean: Represents a logical entity and can have two values: true or false. Used in conditional statements and logical operations. Example: if (isTrue) { ... }';
      case 'Null':
        return "Null: Represents the intentional absence of any object value. It is one of JavaScript's primitive values and is treated as falsy in boolean contexts. Example: let value = null;";
      case 'Undefined':
        return 'Undefined: Indicates that a variable has been declared but has not yet been assigned a value. It is the default value for uninitialized variables. Example: let value; console.log(value); // undefined';
      case 'Symbol':
        return 'Symbol: A unique and immutable data type used as a key for object properties. Each symbol is unique, even if they have the same description. Useful for creating private properties in objects. Example: const sym = Symbol("description");';
      case 'Object':
        return 'Object: A collection of key-value pairs used to store various data and more complex entities. Objects can contain properties and methods. Example: let person = { name: "John", age: 30, greet: function() { console.log("Hello"); } };';
      case 'BigInt':
        return 'BigInt: Represents integer values larger than 2<sup>53</sup> - 1. BigInt is used for arbitrarily large integers, such as those needed in cryptography or precise scientific calculations.';
      case 'Array':
        return 'Array: A data structure that stores multiple values in a single variable. Arrays are zero-indexed and can contain elements of any type. Common methods include .push(), .pop(), and .length.';
      case 'Function':
        return 'Function: A reusable block of code that performs a specific task. Functions can take parameters and return values. Example: function add(a, b) { return a + b; }';
      default:
        return '';
    }
  }
});
