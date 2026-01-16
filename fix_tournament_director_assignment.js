const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'screens/Admin/ScreenAdminUsers.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic function calls
content = content.replace(
  /await assignTournamentDirectorToVenue\(parseInt\(tdId\), userVenues\[0\]\.id\);/g,
  `// Find the selected user to get their id_auto (numeric ID)
        const selectedTD = users.find(u => u.id === tdId);
        if (!selectedTD || !selectedTD.id_auto) {
          showInfoModal('Error', 'Selected tournament director not found or missing ID');
          return;
        }
        await assignTournamentDirectorToVenue(selectedTD.id_auto, userVenues[0].id);`,
);

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed tournament director assignment foreign key issue');
