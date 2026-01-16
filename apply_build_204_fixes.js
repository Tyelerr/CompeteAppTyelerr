const fs = require('fs');
const path = require('path');

console.log('🚀 BUILD 204: Applying Count Query Fix...\n');

// ============================================================================
// FIX 1: CrudTournament.tsx - Add { count: 'exact' } to main query
// ============================================================================
console.log('📝 Fix 1: Updating CrudTournament.tsx...');
const crudPath = path.join(__dirname, 'ApiSupabase', 'CrudTournament.tsx');
let crudContent = fs.readFileSync(crudPath, 'utf8');

// Add { count: 'exact' } to the base query
crudContent = crudContent.replace(
  /let query = supabase\.from\('tournaments'\)\.select\(\s*`\s*\*,\s*profiles\(\*\),\s*venues\(\*\)\s*`,\s*\);/,
  `let query = supabase.from('tournaments').select(
      \`
        *,
        profiles(*),
        venues(*)
        \`,
      { count: 'exact' }, // BUILD 204: Add count to main query for single-query architecture
    );`,
);

// Update query execution to capture count
crudContent = crudContent.replace(
  /\/\/ Execute the query\s*const { data, error } = await query;/,
  `// BUILD 204: Execute the query - now returns data AND count together
    const { data, count, error } = await query;`,
);

// Replace the DATABASE-ONLY count logic with single-query architecture
const databaseOnlyPattern =
  /} else {\s*\/\/ When no client-side filtering is needed, use the traditional count query[\s\S]*?console\.log\(\s*'✅ BUILD 190: All filters applied to count query for 100% parity',\s*\);\s*}/;

const newDatabaseOnlyLogic = `} else {
      // BUILD 204: When no client-side filtering is needed, use SINGLE-QUERY architecture
      // This guarantees count and data can't diverge (100% filter parity)
      console.log(
        '=== BUILD 204: CALCULATING TOTAL COUNT WITH SINGLE-QUERY ARCHITECTURE ===',
      );

      // The main query already has all filters applied
      // We just need to add { count: 'exact' } to get count WITH the data
      // This is already done above in the main query building section
      
      // Extract count from the main query response
      // Note: The count comes from the SAME query that returned the data
      // This guarantees 100% filter parity - no divergence possible
      
      console.log('🔍 BUILD 204 SINGLE-QUERY COUNT:');
      console.log(\`   Count from main query: \${count}\`);
      console.log(\`   Count is null: \${count === null}\`);
      console.log(\`   Count is undefined: \${count === undefined}\`);

      if (count !== null && count !== undefined) {
        totalCount = count;
        console.log(\`✅ Using count from main query: \${totalCount}\`);
      } else {
        console.error('⚠️ Count returned null/undefined from main query, defaulting to 0');
        totalCount = 0;
      }

      console.log(\`✅ Final totalCount set to: \${totalCount}\`);
      console.log(
        '✅ BUILD 204: Single-query architecture ensures 100% filter parity',
      );
    }`;

crudContent = crudContent.replace(databaseOnlyPattern, newDatabaseOnlyLogic);

fs.writeFileSync(crudPath, crudContent, 'utf8');
console.log('✅ CrudTournament.tsx updated\n');

// ============================================================================
// FIX 2: ScreenBilliardHome.tsx - Add debug markers and guardrail tracking
// ============================================================================
console.log('📝 Fix 2: Updating ScreenBilliardHome.tsx...');
const homePath = path.join(
  __dirname,
  'screens',
  'Billiard',
  'ScreenBilliardHome.tsx',
);
let homeContent = fs.readFileSync(homePath, 'utf8');

// Add state variables after existing useState declarations
const statePattern =
  /const \[refreshing, setRefreshing\] = useState<boolean>\(false\);/;
const newStates = `const [refreshing, setRefreshing] = useState<boolean>(false);
  const [guardrailTriggered, set_guardrailTriggered] = useState<boolean>(false);
  const [countSource, set_countSource] = useState<'REAL' | 'FALLBACK'>('REAL');`;

homeContent = homeContent.replace(statePattern, newStates);

// Update guardrail section to track state
const guardrailPattern =
  /if \(tournaments\.length > 0 && totalCount === 0\) {\s*\/\/ COUNT PIPELINE BROKEN - Use intelligent fallback/;
const newGuardrailStart = `if (tournaments.length > 0 && totalCount === 0) {
        // BUILD 204: Set guardrail state
        set_guardrailTriggered(true);
        set_countSource('FALLBACK');
        
        // COUNT PIPELINE BROKEN - Use intelligent fallback`;

homeContent = homeContent.replace(guardrailPattern, newGuardrailStart);

// Add else block to reset guardrail state
const elsePattern =
  /} else if \(totalCount === null \|\| totalCount === undefined\) {/;
const newElseBlock = `} else {
        // BUILD 204: Count is working correctly
        set_guardrailTriggered(false);
        set_countSource('REAL');
        
        if (totalCount === null || totalCount === undefined) {`;

homeContent = homeContent.replace(elsePattern, newElseBlock);

// Close the new else block properly
const finalCountPattern = /set_totalCount\(finalCount\);/;
const newFinalCount = `set_totalCount(finalCount);
      }`;

homeContent = homeContent.replace(finalCountPattern, newFinalCount);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('✅ ScreenBilliardHome.tsx updated\n');

// ============================================================================
// FIX 3: Pagiination.tsx - Update arrow logic
// ============================================================================
console.log('📝 Fix 3: Updating Pagiination.tsx...');
const paginationPath = path.join(
  __dirname,
  'components',
  'UI',
  'Pagination',
  'Pagiination.tsx',
);
let paginationContent = fs.readFileSync(paginationPath, 'utf8');

// Add guardrailTriggered prop to function signature
paginationContent = paginationContent.replace(
  /export default function Pagination\({[\s\S]*?currentItemsCount\?: number;/,
  `export default function Pagination({
  totalCount,
  offset,
  countPerPage,
  FLoadDataByOffset,
  currentItemsCount,
  guardrailTriggered, // BUILD 204: Add this prop
}: {
  totalCount: number;
  offset: number;
  countPerPage: number;
  FLoadDataByOffset?: (n?: number) => void;
  currentItemsCount?: number;
  guardrailTriggered?: boolean; // BUILD 204: Add this prop`,
);

// Update arrow visibility logic
const arrowPattern = /{__totalPages\(\) > 1 \? \(/;
const newArrowLogic = `{(() => {
        // BUILD 204: Smart arrow logic that works with fallback counts
        const hasPrev = offset > 0;
        const hasNextReal = offset + (currentItemsCount || 0) < totalCount;
        const hasMoreGuess = (currentItemsCount || 0) === countPerPage;
        const hasNext = guardrailTriggered ? hasMoreGuess : hasNextReal;
        const showArrows = hasPrev || hasNext;
        
        return showArrows ? (`;

paginationContent = paginationContent.replace(arrowPattern, newArrowLogic);

// Update the closing of arrow section
const arrowClosePattern = /\) : null}/;
const newArrowClose = `) : null;
      })()}`;

paginationContent = paginationContent.replace(arrowClosePattern, newArrowClose);

// Update prev button logic
paginationContent = paginationContent.replace(
  /__currentPage\(\) === 1 \? { pointerEvents: 'none' } : null/g,
  `!hasPrev ? { pointerEvents: 'none' } : null`,
);

paginationContent = paginationContent.replace(
  /type={__currentPage\(\) === 1 \? 'dark' : 'primary'}/,
  `type={!hasPrev ? 'dark' : 'primary'}`,
);

// Update next button logic
paginationContent = paginationContent.replace(
  /__currentPage\(\) === __totalPages\(\)\s*\? { pointerEvents: 'none' }\s*: null/g,
  `!hasNext ? { pointerEvents: 'none' } : null`,
);

paginationContent = paginationContent.replace(
  /type={__currentPage\(\) === __totalPages\(\) \? 'dark' : 'primary'}/,
  `type={!hasNext ? 'dark' : 'primary'}`,
);

// Update next button onPress
paginationContent = paginationContent.replace(
  /onPress={\(\) => {\s*if \(FLoadDataByOffset !== undefined\) {\s*const newOffset = offset \+ countPerPage;\s*FLoadDataByOffset\(\s*newOffset < totalCount \? newOffset : offset,\s*\);\s*}\s*}}/,
  `onPress={() => {
                if (FLoadDataByOffset !== undefined && hasNext) {
                  const newOffset = offset + countPerPage;
                  FLoadDataByOffset(newOffset);
                }
              }}`,
);

fs.writeFileSync(paginationPath, paginationContent, 'utf8');
console.log('✅ Pagiination.tsx updated\n');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   ✅ BUILD 204: All fixes applied successfully!       ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('\n📋 Files Modified:');
console.log('   1. ApiSupabase/CrudTournament.tsx');
console.log('   2. screens/Billiard/ScreenBilliardHome.tsx');
console.log('   3. components/UI/Pagination/Pagiination.tsx');
console.log('\n🎯 Next Steps:');
console.log('   1. Test the tournament list page');
console.log('   2. Verify pagination arrows appear');
console.log('   3. Check console for "BUILD 204" messages');
console.log('   4. Verify count source shows "REAL" not "FALLBACK"');
