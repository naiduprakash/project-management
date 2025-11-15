// Debug script to check FormBuilder responsiveness
const debugFormBuilder = () => {
  console.log('=== FormBuilder Responsiveness Debug ===');

  // Check if Tailwind responsive classes are working
  const testElement = document.createElement('div');
  testElement.className = 'flex flex-col lg:flex-row';
  document.body.appendChild(testElement);

  const computedStyle = window.getComputedStyle(testElement);
  const flexDirection = computedStyle.flexDirection;

  console.log('Tailwind flex-direction:', flexDirection);
  console.log('Expected on desktop (lg:): row');
  console.log('Expected on mobile: column');

  // Check screen size
  console.log('Screen width:', window.innerWidth);
  console.log('Screen height:', window.innerHeight);

  // Check if responsive breakpoints are working
  const isMobile = window.innerWidth < 1024; // lg breakpoint
  console.log('Is mobile (< 1024px):', isMobile);

  document.body.removeChild(testElement);

  // Check FormBuilder container
  const formBuilder = document.querySelector('[data-form-builder]');
  if (formBuilder) {
    const formBuilderStyle = window.getComputedStyle(formBuilder);
    console.log('FormBuilder flex-direction:', formBuilderStyle.flexDirection);
    console.log('FormBuilder width:', formBuilderStyle.width);
    console.log('FormBuilder height:', formBuilderStyle.height);
  } else {
    console.log('FormBuilder container not found');
  }

  console.log('=== End Debug ===');
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  window.debugFormBuilder = debugFormBuilder;
}

console.log('Debug function available: window.debugFormBuilder()');
