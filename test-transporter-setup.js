const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Test script to validate Transporter + JWT setup
 * Checks all prerequisites and configurations
 */
class TransporterSetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Run all validation tests
   */
  async runAllTests() {
    console.log('🧪 Transporter Setup Validation');
    console.log('================================\n');

    // Test Node.js version
    this.testNodeVersion();

    // Test file structure
    this.testFileStructure();

    // Test credentials configuration
    this.testCredentialsConfig();

    // Test JWT generation
    await this.testJWTGeneration();

    // Test Transporter installation (if on macOS)
    this.testTransporterInstallation();

    // Test EAS configuration
    this.testEASConfiguration();

    // Display results
    this.displayResults();

    return this.errors.length === 0;
  }

  /**
   * Test Node.js version compatibility
   */
  testNodeVersion() {
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (majorVersion >= 18) {
        this.passed.push(`✅ Node.js version: ${nodeVersion} (compatible)`);
      } else {
        this.errors.push(
          `❌ Node.js version: ${nodeVersion} (requires >= 18.0.0)`,
        );
      }
    } catch (error) {
      this.errors.push(
        `❌ Could not determine Node.js version: ${error.message}`,
      );
    }
  }

  /**
   * Test required file structure
   */
  testFileStructure() {
    const requiredFiles = [
      'scripts/jwt-auth.js',
      'scripts/transporter-upload.js',
      'deploy-with-transporter.bat',
      'TRANSPORTER_SETUP_GUIDE.md',
      '.env.example',
      'app-store-connect-config.json.example',
    ];

    requiredFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        this.passed.push(`✅ Required file exists: ${file}`);
      } else {
        this.errors.push(`❌ Missing required file: ${file}`);
      }
    });

    // Check if keys directory exists or can be created
    const keysDir = 'keys';
    if (fs.existsSync(keysDir)) {
      this.passed.push(`✅ Keys directory exists: ${keysDir}/`);
    } else {
      this.warnings.push(
        `⚠️ Keys directory not found: ${keysDir}/ (will be created when needed)`,
      );
    }
  }

  /**
   * Test credentials configuration
   */
  testCredentialsConfig() {
    let hasConfig = false;

    // Check for .env file
    if (fs.existsSync('.env')) {
      try {
        const envContent = fs.readFileSync('.env', 'utf8');
        const hasIssuerId = envContent.includes('APP_STORE_CONNECT_ISSUER_ID=');
        const hasKeyId = envContent.includes('APP_STORE_CONNECT_KEY_ID=');
        const hasKeyPath = envContent.includes(
          'APP_STORE_CONNECT_PRIVATE_KEY_PATH=',
        );

        if (hasIssuerId && hasKeyId && hasKeyPath) {
          this.passed.push('✅ Environment variables configured in .env');
          hasConfig = true;
        } else {
          this.warnings.push(
            '⚠️ .env file exists but missing some required variables',
          );
        }
      } catch (error) {
        this.warnings.push(`⚠️ Could not read .env file: ${error.message}`);
      }
    }

    // Check for config JSON file
    if (fs.existsSync('app-store-connect-config.json')) {
      try {
        const config = JSON.parse(
          fs.readFileSync('app-store-connect-config.json', 'utf8'),
        );
        if (config.issuerId && config.keyId && config.privateKeyPath) {
          this.passed.push(
            '✅ Configuration file app-store-connect-config.json is valid',
          );
          hasConfig = true;
        } else {
          this.warnings.push(
            '⚠️ app-store-connect-config.json exists but missing required fields',
          );
        }
      } catch (error) {
        this.warnings.push(
          `⚠️ Could not parse app-store-connect-config.json: ${error.message}`,
        );
      }
    }

    if (!hasConfig) {
      this.errors.push(
        '❌ No valid App Store Connect credentials found. Please set up .env or config file.',
      );
    }
  }

  /**
   * Test JWT generation (if credentials are available)
   */
  async testJWTGeneration() {
    try {
      // Try to load the JWT auth module
      const jwtAuth = require('./scripts/jwt-auth.js');

      // Try to load configuration
      const config = jwtAuth.loadConfig();

      if (config.issuerId && config.keyId && config.privateKeyPath) {
        // Check if private key file exists
        if (fs.existsSync(config.privateKeyPath)) {
          this.passed.push('✅ Private key file found');

          // Try to generate a test token (only if we have all credentials)
          try {
            const token = jwtAuth.generateJWTToken();
            if (token && token.length > 100) {
              this.passed.push('✅ JWT token generation successful');
            } else {
              this.errors.push(
                '❌ JWT token generation failed - invalid token',
              );
            }
          } catch (error) {
            this.errors.push(
              `❌ JWT token generation failed: ${error.message}`,
            );
          }
        } else {
          this.warnings.push(
            `⚠️ Private key file not found: ${config.privateKeyPath}`,
          );
          this.warnings.push(
            '   Download your .p8 file from App Store Connect and place it in the keys/ directory',
          );
        }
      } else {
        this.warnings.push('⚠️ Skipping JWT test - credentials not configured');
      }
    } catch (error) {
      this.errors.push(`❌ Could not test JWT generation: ${error.message}`);
    }
  }

  /**
   * Test Transporter installation (macOS only)
   */
  testTransporterInstallation() {
    const platform = process.platform;

    if (platform !== 'darwin') {
      this.warnings.push(
        `⚠️ Platform: ${platform} - Transporter works best on macOS`,
      );
      return;
    }

    const transporterPaths = [
      '/Applications/Transporter.app/Contents/itms/bin/iTMSTransporter',
      '/usr/local/itms/bin/iTMSTransporter',
    ];

    let found = false;
    for (const transporterPath of transporterPaths) {
      if (fs.existsSync(transporterPath)) {
        this.passed.push(`✅ Transporter found: ${transporterPath}`);
        found = true;
        break;
      }
    }

    if (!found) {
      // Try to find in PATH
      try {
        execSync('which iTMSTransporter', { stdio: 'ignore' });
        this.passed.push('✅ Transporter found in system PATH');
        found = true;
      } catch (error) {
        // Not found in PATH
      }
    }

    if (!found) {
      this.warnings.push(
        '⚠️ Transporter not found - install from Mac App Store or Apple Developer',
      );
    }
  }

  /**
   * Test EAS configuration
   */
  testEASConfiguration() {
    if (fs.existsSync('eas.json')) {
      try {
        const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));

        if (easConfig.build && easConfig.build.production) {
          this.passed.push('✅ EAS production build configuration found');

          // Check Node.js version in EAS config
          const nodeVersion = easConfig.build.production.node;
          if (nodeVersion) {
            const majorVersion = parseInt(nodeVersion.split('.')[0]);
            if (majorVersion >= 20) {
              this.passed.push(
                `✅ EAS Node.js version: ${nodeVersion} (compatible)`,
              );
            } else {
              this.warnings.push(
                `⚠️ EAS Node.js version: ${nodeVersion} (consider upgrading to >= 20)`,
              );
            }
          }

          // Check for iOS configuration
          if (easConfig.build.production.ios) {
            this.passed.push('✅ EAS iOS build configuration found');
          }
        } else {
          this.warnings.push('⚠️ EAS production build configuration not found');
        }
      } catch (error) {
        this.errors.push(`❌ Could not parse eas.json: ${error.message}`);
      }
    } else {
      this.warnings.push(
        '⚠️ eas.json not found - run "eas build:configure" to set up',
      );
    }

    // Check if EAS CLI is installed
    try {
      execSync('eas --version', { stdio: 'ignore' });
      this.passed.push('✅ EAS CLI is installed');
    } catch (error) {
      this.warnings.push(
        '⚠️ EAS CLI not found - install with "npm install -g @expo/eas-cli"',
      );
    }
  }

  /**
   * Display validation results
   */
  displayResults() {
    console.log('\n📊 Validation Results');
    console.log('====================\n');

    if (this.passed.length > 0) {
      console.log('✅ PASSED TESTS:');
      this.passed.forEach((test) => console.log(`   ${test}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach((warning) => console.log(`   ${warning}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach((error) => console.log(`   ${error}`));
      console.log('');
    }

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   ✅ Passed: ${this.passed.length}`);
    console.log(`   ⚠️ Warnings: ${this.warnings.length}`);
    console.log(`   ❌ Errors: ${this.errors.length}`);
    console.log('');

    if (this.errors.length === 0) {
      console.log('🎉 Setup validation completed successfully!');
      console.log('   You can proceed with Transporter deployment.');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Set up your App Store Connect API credentials');
      console.log('   2. Download your .p8 private key file');
      console.log('   3. Run: ./deploy-with-transporter.bat');
    } else {
      console.log('💥 Setup validation failed!');
      console.log('   Please fix the errors above before proceeding.');
      console.log('');
      console.log('📚 For help, see: TRANSPORTER_SETUP_GUIDE.md');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TransporterSetupValidator();
  validator
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Validation failed with error:', error);
      process.exit(1);
    });
}

module.exports = TransporterSetupValidator;
