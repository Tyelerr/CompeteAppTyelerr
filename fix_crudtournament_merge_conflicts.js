const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ApiSupabase', 'CrudTournament.tsx');

console.log('Reading file with merge conflicts...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Removing ALL merge conflict markers...');

// Remove all possible merge conflict marker variations
content = content.replace(/^<<<<<<< SEARCH$/gm, '');
content = content.replace(/^<<<<<<< SEARCH\n/gm, '');
content = content.replace(/^=======$/gm, '');
content = content.replace(/^=======\n/gm, '');
content = content.replace(/^>>>>>>> REPLACE$/gm, '');
content = content.replace(/^>>>>>>> REPLACE\n/gm, '');

// Remove standalone ======= lines (from failed edits)
content = content
  .split('\n')
  .filter((line) => line.trim() !== '=======')
  .join('\n');

console.log('Writing cleaned file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Merge conflicts removed successfully!');
console.log('File cleaned: ApiSupabase/CrudTournament.tsx');
