// Test that responsive classes work correctly
const testField = {
  name: 'test_field',
  type: 'text',
  label: 'Test Field',
  columnSpan: { mobile: 12, tablet: 6, desktop: 4 }
};

// Simulate the getResponsiveColSpan function
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

// Simulate the getGridColumnStyle function
const getGridColumnStyle = (columnSpan, gridColumn = 1) => {
  if (typeof columnSpan === 'object') {
    return undefined; // Let responsive classes handle it
  }

  const span = columnSpan || 12;
  return `${gridColumn} / span ${span}`;
};

console.log('=== Testing Responsive Field Classes ===');
console.log('Field:', testField.name);
console.log('Column Span Config:', testField.columnSpan);
console.log('');

console.log('Generated Classes:', getResponsiveColSpan(testField.columnSpan));
console.log('Grid Column Style:', getGridColumnStyle(testField.columnSpan, 1));
console.log('');

console.log('Expected Behavior:');
console.log('- Mobile (< 640px): col-span-12 (full width)');
console.log('- Tablet (640px-1024px): sm:col-span-6 (half width)');
console.log('- Desktop (≥ 1024px): lg:col-span-4 (one-third width)');
console.log('');

console.log('=== Testing Old Format (Backward Compatibility) ===');
const oldField = { ...testField, columnSpan: 6 };
console.log('Old Field:', oldField.name);
console.log('Column Span Config:', oldField.columnSpan);
console.log('Generated Classes:', getResponsiveColSpan(oldField.columnSpan));
console.log('Grid Column Style:', getGridColumnStyle(oldField.columnSpan, 1));
console.log('Expected: col-span-6 on all devices (backward compatible)');
