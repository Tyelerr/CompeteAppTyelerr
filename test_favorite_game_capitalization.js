// Test file for favorite game capitalization functionality
// Run this with: node CompeteApp/test_favorite_game_capitalization.js

// Import the function (simulated since we can't directly import from React Native)
function CapitalizeGameName(text) {
  // Check if the input is a valid string
  if (typeof text !== 'string' || text === null || text === undefined) {
    console.warn('Input must be a string. Returning empty string.');
    return '';
  }

  // Handle empty string case
  if (text.trim() === '') {
    return '';
  }

  // Split the string into an array of words based on spaces
  // Using a regular expression /\s+/ to handle multiple spaces between words
  const words = text.split(/\s+/);

  // Map over each word to capitalize appropriately for game names
  const capitalizedWords = words.map((word) => {
    // If the word is empty (e.g., from multiple spaces), return it as is
    if (word.length === 0) {
      return '';
    }

    // Check if the word is purely numeric (like "9", "8", "10")
    if (/^\d+$/.test(word)) {
      return word; // Keep numbers as they are
    }

    // For non-numeric words, capitalize the first letter and lowercase the rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  // Join the capitalized words back into a single string with single spaces
  return capitalizedWords.join(' ');
}

// Test cases
const testCases = [
  { input: '9 ball', expected: '9 Ball' },
  { input: 'one pocket', expected: 'One Pocket' },
  { input: 'straight pool', expected: 'Straight Pool' },
  { input: '8 ball', expected: '8 Ball' },
  { input: '10 ball', expected: '10 Ball' },
  { input: 'ONE POCKET', expected: 'One Pocket' },
  { input: 'STRAIGHT POOL', expected: 'Straight Pool' },
  { input: '9-ball', expected: '9-ball' }, // Note: hyphenated words are treated as one word
  { input: 'three cushion billiards', expected: 'Three Cushion Billiards' },
  { input: '14.1 continuous', expected: '14.1 Continuous' },
  { input: '', expected: '' },
  { input: '   ', expected: '' },
  { input: 'snooker', expected: 'Snooker' },
  { input: 'SNOOKER', expected: 'Snooker' },
  { input: '15 ball', expected: '15 Ball' },
];

console.log('🎱 Testing Favorite Game Capitalization Function\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = CapitalizeGameName(testCase.input);
  const passed = result === testCase.expected;

  console.log(`Test ${index + 1}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Input: "${testCase.input}"`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got: "${result}"`);

  if (passed) {
    passedTests++;
  }

  console.log('');
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log(
    '🎉 All tests passed! The CapitalizeGameName function is working correctly.',
  );
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
}
