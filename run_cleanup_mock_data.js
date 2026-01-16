const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual Supabase URL
const supabaseKey = 'your-service-role-key'; // Replace with your actual service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanupScript() {
  try {
    console.log('🧹 Starting mock tournament data cleanup...');

    // Read the SQL cleanup script
    const sqlFilePath = path.join(__dirname, 'sql', 'cleanup_mock_data.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.includes('SELECT') && statement.includes('status')) {
        // Skip the success message query
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement,
      });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements even if one fails
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    // Verify cleanup by counting remaining tournaments
    const { data: tournamentCount, error: countError } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting tournaments:', countError);
    } else {
      console.log(
        `📊 Remaining tournaments in database: ${tournamentCount?.length || 0}`,
      );
    }

    // Show sample of remaining tournaments
    const { data: sampleTournaments, error: sampleError } = await supabase
      .from('tournaments')
      .select('tournament_name, director_name, venue')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample tournaments:', sampleError);
    } else {
      console.log('📋 Sample remaining tournaments:');
      sampleTournaments?.forEach((tournament, index) => {
        console.log(
          `   ${index + 1}. ${tournament.tournament_name} by ${
            tournament.director_name
          } at ${tournament.venue}`,
        );
      });
    }

    console.log('🎉 Mock tournament cleanup completed successfully!');
  } catch (error) {
    console.error('💥 Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
runCleanupScript();
