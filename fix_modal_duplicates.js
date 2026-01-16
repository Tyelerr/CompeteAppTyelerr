const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  'screens',
  'BarOwner',
  'ScreenBarOwnerDashboard.tsx',
);

console.log('Reading file...');
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicate attributes by removing the duplicates
console.log('Removing duplicate activeOpacity and onPress attributes...');

// Replace the duplicate pattern with single occurrence
content = content.replace(
  /activeOpacity={1}\s+onPress={\(e\) => e\.stopPropagation\(\)}\s+activeOpacity={1}\s+onPress={\(e\) => e\.stopPropagation\(\)}/g,
  'activeOpacity={1}\n            onPress={(e) => e.stopPropagation()}',
);

// Write the fixed content back
console.log('Writing fixed content...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Duplicates removed successfully!');
