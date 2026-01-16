const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withXcode16Fix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      );

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Check if our fix is already applied
        if (podfileContent.includes('# Xcode 16 compatibility fix')) {
          return config;
        }

        // Find the existing post_install hook and add our fixes inside it
        const postInstallRegex = /post_install do \|installer\|([\s\S]*?)end/;
        const match = podfileContent.match(postInstallRegex);

        if (match) {
          const existingContent = match[1];
          const xcode16Fixes = `
    # Xcode 16 compatibility fix
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Fix for TARGET_IPHONE_SIMULATOR error in Xcode 16
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
        
        # Disable bitcode (deprecated in Xcode 14+)
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        
        # Fix for Swift compilation issues
        config.build_settings['SWIFT_VERSION'] = '5.0'
        
        # Add TARGET_IPHONE_SIMULATOR macro for Swift
        config.build_settings['OTHER_SWIFT_FLAGS'] ||= ['$(inherited)']
        config.build_settings['OTHER_SWIFT_FLAGS'] << '-D' << 'TARGET_IPHONE_SIMULATOR'
      end
    end
`;

          // Insert our fixes at the beginning of the post_install block
          const newPostInstall = `post_install do |installer|${xcode16Fixes}${existingContent}end`;
          podfileContent = podfileContent.replace(
            postInstallRegex,
            newPostInstall,
          );

          fs.writeFileSync(podfilePath, podfileContent);
        }
      }

      return config;
    },
  ]);
};
