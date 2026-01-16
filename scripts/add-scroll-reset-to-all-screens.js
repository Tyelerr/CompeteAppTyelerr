const fs = require('fs');
const path = require('path');

// List of screens that already have scroll reset implemented
const alreadyImplemented = [
  'ScreenBilliardHome.tsx',
  'ScrenHome.tsx',
  'ScreenHomePlayerSpotlight.tsx',
  'ScreenHomeFeaturedPlayer.tsx',
];

// List of backup/test/fixed files to skip
const skipFiles = [
  '_Fixed.tsx',
  '_Final.tsx',
  '_MobileFix.tsx',
  '_ProxyFix.tsx',
  '_backup.tsx',
  '_Original.tsx',
  '_Test.tsx',
  '_Updated.tsx',
  '_clean.tsx',
  '_complete.tsx',
  '_updated.tsx',
];

function shouldSkipFile(filename) {
  return (
    skipFiles.some((suffix) => filename.includes(suffix)) ||
    alreadyImplemented.includes(filename)
  );
}

function addScrollResetToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file already has scroll reset functionality
    if (
      content.includes("navigation.addListener('blur'") ||
      content.includes('scrollViewRef') ||
      content.includes('ScreenScrollViewRef')
    ) {
      console.log(`⏭️  Skipping ${filePath} - already has scroll reset`);
      return;
    }

    // Check if file uses ScreenScrollView
    if (!content.includes('ScreenScrollView')) {
      console.log(`⏭️  Skipping ${filePath} - doesn't use ScreenScrollView`);
      return;
    }

    console.log(`🔄 Processing ${filePath}...`);

    // Add imports
    content = content.replace(
      /import ScreenScrollView from ['"]\.\.\/ScreenScrollView['"];?/,
      "import ScreenScrollView, { ScreenScrollViewRef } from '../ScreenScrollView';",
    );

    // Add React Navigation import if not present
    if (!content.includes('useNavigation')) {
      content = content.replace(
        /import.*from 'react';?/,
        (match) =>
          match + "\nimport { useNavigation } from '@react-navigation/native';",
      );
    }

    // Add useRef to React imports if not present
    if (!content.includes('useRef')) {
      content = content.replace(
        /import.*{([^}]*)}.*from ['"]react['"];?/,
        (match, imports) => {
          if (!imports.includes('useRef')) {
            const newImports = imports.trim() + ', useRef';
            return match.replace(imports, newImports);
          }
          return match;
        },
      );
    }

    // Add useEffect to React imports if not present
    if (!content.includes('useEffect')) {
      content = content.replace(
        /import.*{([^}]*)}.*from ['"]react['"];?/,
        (match, imports) => {
          if (!imports.includes('useEffect')) {
            const newImports = imports.trim() + ', useEffect';
            return match.replace(imports, newImports);
          }
          return match;
        },
      );
    }

    // Find the function declaration and add scroll reset logic
    const functionMatch = content.match(
      /export default function (\w+)\([^)]*\)\s*{/,
    );
    if (functionMatch) {
      const insertPoint = functionMatch.index + functionMatch[0].length;

      const scrollResetCode = `
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScreenScrollViewRef>(null);

  // Reset scroll position when user navigates away from this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Immediately scroll to top when leaving the screen
      scrollViewRef.current?.scrollToTop(false);
    });

    return unsubscribe;
  }, [navigation]);
`;

      content =
        content.slice(0, insertPoint) +
        scrollResetCode +
        content.slice(insertPoint);
    }

    // Add ref to ScreenScrollView
    content = content.replace(
      /<ScreenScrollView([^>]*)>/g,
      '<ScreenScrollView ref={scrollViewRef}$1>',
    );

    // Write the updated content back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.tsx') && !shouldSkipFile(item)) {
      addScrollResetToFile(fullPath);
    }
  }
}

console.log('🚀 Starting universal scroll reset implementation...');
console.log('📁 Processing screens directory...');

// Process all screens
processDirectory('./CompeteApp/screens');

console.log('✨ Universal scroll reset implementation complete!');
