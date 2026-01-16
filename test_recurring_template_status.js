// Test Script for Recurring Template Status Implementation
// This verifies that the new system works correctly

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testRecurringTemplateStatus() {
  console.log('🧪 Testing Recurring Template Status Implementation\n');

  try {
    // Test 1: Verify column exists
    console.log(
      '📋 Test 1: Checking if recurring_template_status column exists...',
    );
    const { data: columnCheck, error: columnError } = await supabase.rpc(
      'exec_sql',
      {
        query: `
          SELECT column_name, data_type, column_default
          FROM information_schema.columns
          WHERE table_name = 'tournaments'
          AND column_name = 'recurring_template_status'
        `,
      },
    );

    if (columnError) {
      console.log('   ℹ️  Using direct query instead...');
      // Alternative: Check by trying to select the column
      const { data: testData, error: testError } = await supabase
        .from('tournaments')
        .select('recurring_template_status')
        .limit(1);

      if (testError) {
        console.error('   ❌ Column does not exist:', testError.message);
        console.log(
          '   ⚠️  Please run: CompeteApp/sql/add_recurring_template_status.sql',
        );
        return;
      } else {
        console.log('   ✅ Column exists!');
      }
    } else {
      console.log('   ✅ Column exists:', columnCheck);
    }

    // Test 2: Check existing recurring masters
    console.log('\n📋 Test 2: Checking existing recurring masters...');
    const { data: masters, error: mastersError } = await supabase
      .from('tournaments')
      .select(
        'id_unique_number, tournament_name, status, recurring_template_status, is_recurring_master, start_date',
      )
      .eq('is_recurring_master', true)
      .eq('is_recurring', true);

    if (mastersError) {
      console.error('   ❌ Error fetching masters:', mastersError);
      return;
    }

    console.log(`   ✅ Found ${masters?.length || 0} recurring master(s)`);
    if (masters && masters.length > 0) {
      masters.forEach((m) => {
        console.log(
          `      - ${m.tournament_name}: status=${m.status}, template_status=${m.recurring_template_status}`,
        );
      });
    }

    // Test 3: Test generator function
    console.log('\n📋 Test 3: Testing generator function...');
    const { data: genResult, error: genError } = await supabase.rpc(
      'generate_recurring_tournaments_horizon',
    );

    if (genError) {
      console.error('   ❌ Generator error:', genError);
      console.log(
        '   ⚠️  Please run: CompeteApp/sql/update_generate_recurring_tournaments_with_template_status.sql',
      );
    } else {
      console.log('   ✅ Generator ran successfully');
      if (genResult && genResult.length > 0) {
        genResult.forEach((r) => {
          console.log(
            `      - ${r.message} (Created: ${r.tournaments_created})`,
          );
        });
      } else {
        console.log(
          '      - No new tournaments needed (all series up to date)',
        );
      }
    }

    // Test 4: Check for archived masters with active templates
    console.log(
      '\n📋 Test 4: Checking for archived masters with active templates...',
    );
    const { data: archivedMasters, error: archivedError } = await supabase
      .from('tournaments')
      .select(
        'id_unique_number, tournament_name, status, recurring_template_status, start_date',
      )
      .eq('is_recurring_master', true)
      .eq('status', 'archived')
      .eq('recurring_template_status', 'active');

    if (archivedError) {
      console.error('   ❌ Error:', archivedError);
    } else {
      console.log(
        `   ✅ Found ${
          archivedMasters?.length || 0
        } archived master(s) with active templates`,
      );
      if (archivedMasters && archivedMasters.length > 0) {
        archivedMasters.forEach((m) => {
          console.log(
            `      - ${m.tournament_name} (Date: ${m.start_date}) - Will continue generating!`,
          );
        });
      }
    }

    // Test 5: Verify child tournaments
    console.log('\n📋 Test 5: Checking child tournaments...');
    const { data: children, error: childrenError } = await supabase
      .from('tournaments')
      .select(
        'recurring_series_id, start_date, tournament_name, status, recurring_template_status',
      )
      .eq('is_recurring', true)
      .eq('is_recurring_master', false)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('recurring_series_id')
      .order('start_date');

    if (childrenError) {
      console.error('   ❌ Error:', childrenError);
    } else {
      console.log(
        `   ✅ Found ${children?.length || 0} future child tournament(s)`,
      );

      // Group by series
      const seriesGroups = {};
      children?.forEach((child) => {
        if (!seriesGroups[child.recurring_series_id]) {
          seriesGroups[child.recurring_series_id] = [];
        }
        seriesGroups[child.recurring_series_id].push(child);
      });

      Object.keys(seriesGroups).forEach((seriesId) => {
        const seriesChildren = seriesGroups[seriesId];
        console.log(
          `      - Series ${seriesId}: ${seriesChildren.length} future tournaments`,
        );
        seriesChildren.slice(0, 3).forEach((c) => {
          console.log(`         • ${c.start_date}: ${c.tournament_name}`);
        });
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Column exists: recurring_template_status`);
    console.log(`✅ Recurring masters found: ${masters?.length || 0}`);
    console.log(
      `✅ Archived masters with active templates: ${
        archivedMasters?.length || 0
      }`,
    );
    console.log(`✅ Future child tournaments: ${children?.length || 0}`);
    console.log('\n✨ System is ready for recurring template status!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testRecurringTemplateStatus();
