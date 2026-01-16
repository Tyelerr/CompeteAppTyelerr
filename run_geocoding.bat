@echo off
echo Starting venue coordinate population...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Running geocoding script...
echo This may take a few minutes depending on the number of venues...
echo.

REM Run the geocoding script
node -e "
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

async function runGeocoding() {
  try {
    console.log('🚀 Starting venue coordinate population...');
    
    // Import the geocoding functions
    const { testGeocoding, getGeocodingStats } = require('./ApiSupabase/GeocodeVenues.tsx');
    
    // Check current status
    const stats = await getGeocodingStats();
    console.log('📊 Current Status:');
    console.log('Total venues:', stats.total_venues);
    console.log('Venues with coordinates:', stats.venues_with_coordinates);
    console.log('Venues needing coordinates:', stats.venues_needing_coordinates);
    console.log('Completion:', stats.completion_percentage + '%%');
    
    if (stats.venues_needing_coordinates > 0) {
      console.log('');
      console.log('🌍 Running automatic geocoding...');
      const results = await testGeocoding();
      console.log('');
      console.log('✅ Geocoding complete!');
      console.log('Successfully geocoded:', results.successful, 'venues');
      console.log('Failed to geocode:', results.failed, 'venues');
      
      // Show final stats
      const finalStats = await getGeocodingStats();
      console.log('');
      console.log('🎯 Final Status:', finalStats.completion_percentage + '%% complete');
    } else {
      console.log('');
      console.log('✅ All venues already have coordinates!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Make sure your Supabase connection is working.');
  }
}

runGeocoding();
"

echo.
echo Geocoding process completed!
pause
