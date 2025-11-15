// Test the responsive column span function
const getResponsiveColSpan = (columnSpan) => {
  if (typeof columnSpan === 'number' || !columnSpan) {
    const span = columnSpan || 12;
    return `col-span-${span}`;
  }

  const mobile = columnSpan.mobile || 12;
  const tablet = columnSpan.tablet || 6;
  const desktop = columnSpan.desktop || 4;

  return `col-span-${mobile} sm:col-span-${tablet} lg:col-span-${desktop}`;
};

// Test cases
console.log('Test 1 - Old format (numeric):');
console.log('Input:', 6);
console.log('Output:', getResponsiveColSpan(6));
console.log('');

console.log('Test 2 - New format (responsive):');
const responsive = { mobile: 12, tablet: 6, desktop: 4 };
console.log('Input:', responsive);
console.log('Output:', getResponsiveColSpan(responsive));
console.log('');

console.log('Test 3 - Partial responsive (missing tablet):');
const partial = { mobile: 12, desktop: 3 };
console.log('Input:', partial);
console.log('Output:', getResponsiveColSpan(partial));
console.log('');

console.log('Test 4 - Null/undefined (default):');
console.log('Input:', null);
console.log('Output:', getResponsiveColSpan(null));
console.log('');

console.log('Test 5 - Empty object (defaults):');
console.log('Input:', {});
console.log('Output:', getResponsiveColSpan({}));
