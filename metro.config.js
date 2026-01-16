const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Configure module resolution
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Enable symlinks
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
