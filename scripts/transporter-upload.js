const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateJWTToken } = require('./jwt-auth');

/**
 * Transporter Upload Manager
 * Handles uploading IPA files to App Store Connect using Transporter with JWT authentication
 */
class TransporterUploadManager {
  constructor(options = {}) {
    this.bundleId = options.bundleId || 'com.tyelerr.app';
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.transporterPath = this.findTransporterPath();
    this.tempDir = path.join(__dirname, '..', 'temp');

    this.ensureTempDirectory();
  }

  /**
   * Find Transporter installation path
   */
  findTransporterPath() {
    const possiblePaths = [
      '/Applications/Transporter.app/Contents/itms/bin/iTMSTransporter',
      '/usr/local/itms/bin/iTMSTransporter',
      'iTMSTransporter', // If in PATH
    ];

    for (const transporterPath of possiblePaths) {
      try {
        if (fs.existsSync(transporterPath)) {
          console.log(`✅ Found Transporter at: ${transporterPath}`);
          return transporterPath;
        }
      } catch (error) {
        // Continue checking other paths
      }
    }

    // Try to find in PATH
    try {
      execSync('which iTMSTransporter', { stdio: 'ignore' });
      console.log('✅ Found Transporter in system PATH');
      return 'iTMSTransporter';
    } catch (error) {
      // Not found in PATH
    }

    throw new Error(`
❌ Transporter not found!

Please install Transporter using one of these methods:

1. Download from App Store Connect:
   https://apps.apple.com/app/transporter/id1450874784

2. Install via Xcode Command Line Tools:
   xcode-select --install

3. Download directly from Apple Developer:
   https://developer.apple.com/transporter/

After installation, Transporter should be available at:
/Applications/Transporter.app/Contents/itms/bin/iTMSTransporter
    `);
  }

  /**
   * Ensure temp directory exists
   */
  ensureTempDirectory() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(`📁 Created temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Validate IPA file
   */
  validateIpaFile(ipaPath) {
    if (!fs.existsSync(ipaPath)) {
      throw new Error(`IPA file not found: ${ipaPath}`);
    }

    const stats = fs.statSync(ipaPath);
    if (stats.size === 0) {
      throw new Error(`IPA file is empty: ${ipaPath}`);
    }

    if (!ipaPath.toLowerCase().endsWith('.ipa')) {
      throw new Error(`File is not an IPA: ${ipaPath}`);
    }

    console.log(`✅ IPA file validated: ${ipaPath}`);
    console.log(`📦 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return true;
  }

  /**
   * Generate JWT token for authentication
   */
  async generateAuthToken() {
    try {
      console.log('🔐 Generating JWT authentication token...');
      const token = generateJWTToken();

      // Save token to temp file for Transporter
      const tokenPath = path.join(this.tempDir, 'jwt-token.txt');
      fs.writeFileSync(tokenPath, token, 'utf8');

      console.log('✅ JWT token generated and saved');
      return tokenPath;
    } catch (error) {
      console.error('❌ Failed to generate JWT token:', error.message);
      throw error;
    }
  }

  /**
   * Build Transporter command
   */
  buildTransporterCommand(ipaPath, tokenPath) {
    const command = [
      this.transporterPath,
      '-m',
      'upload',
      '-f',
      ipaPath,
      '-jwt',
      tokenPath,
      '-t',
      'Signiant',
      '-k',
      '100000',
    ];

    if (this.verbose) {
      command.push('-v', 'eXtreme');
    }

    if (this.dryRun) {
      command.push('-WarnAsError');
    }

    return command;
  }

  /**
   * Execute Transporter upload
   */
  async executeUpload(command) {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting Transporter upload...');
      console.log(`📝 Command: ${command.join(' ')}`);

      const process = spawn(command[0], command.slice(1), {
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;

        if (this.verbose) {
          console.log(output.trim());
        }

        // Show progress indicators
        if (output.includes('Package Summary:')) {
          console.log('📋 Package validation completed');
        }
        if (output.includes('Uploading')) {
          console.log('⬆️ Upload in progress...');
        }
        if (output.includes('Upload Successful')) {
          console.log('✅ Upload completed successfully!');
        }
      });

      process.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;

        if (this.verbose || output.includes('ERROR')) {
          console.error(output.trim());
        }
      });

      process.on('close', (code) => {
        if (code === 0) {
          console.log('🎉 Transporter upload completed successfully!');
          resolve({ stdout, stderr, code });
        } else {
          console.error(`❌ Transporter upload failed with code: ${code}`);
          reject(new Error(`Upload failed with exit code: ${code}\n${stderr}`));
        }
      });

      process.on('error', (error) => {
        console.error('❌ Failed to start Transporter process:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Clean up temporary files
   */
  cleanup() {
    try {
      const tokenPath = path.join(this.tempDir, 'jwt-token.txt');
      if (fs.existsSync(tokenPath)) {
        fs.unlinkSync(tokenPath);
        console.log('🧹 Cleaned up temporary JWT token file');
      }
    } catch (error) {
      console.warn(
        '⚠️ Warning: Could not clean up temporary files:',
        error.message,
      );
    }
  }

  /**
   * Main upload method
   */
  async uploadIpa(ipaPath) {
    let tokenPath = null;

    try {
      console.log('🚀 Starting App Store Connect upload process...');
      console.log(`📱 Bundle ID: ${this.bundleId}`);
      console.log(`📦 IPA Path: ${ipaPath}`);

      // Validate IPA file
      this.validateIpaFile(ipaPath);

      // Generate JWT token
      tokenPath = await this.generateAuthToken();

      // Build command
      const command = this.buildTransporterCommand(ipaPath, tokenPath);

      // Execute upload
      const result = await this.executeUpload(command);

      console.log('\n🎉 Upload completed successfully!');
      console.log(
        '📱 Your app should appear in App Store Connect within a few minutes.',
      );
      console.log('🔗 Check status at: https://appstoreconnect.apple.com');

      return result;
    } catch (error) {
      console.error('\n💥 Upload failed:', error.message);
      throw error;
    } finally {
      // Always clean up
      this.cleanup();
    }
  }

  /**
   * Get latest EAS build IPA path
   */
  async getLatestEasBuild() {
    try {
      console.log('🔍 Looking for latest EAS build...');

      // This would typically involve calling EAS API or checking local build artifacts
      // For now, we'll provide instructions for manual download

      console.log(`
📋 To get your IPA file:

1. Check your latest EAS build:
   eas build:list --platform ios --limit 1

2. Download the IPA:
   eas build:download --latest --platform ios

3. Or visit: https://expo.dev/accounts/tyelerr/projects/compete/builds

The downloaded IPA will typically be in your Downloads folder.
      `);

      return null;
    } catch (error) {
      console.error('❌ Could not retrieve EAS build info:', error.message);
      return null;
    }
  }
}

/**
 * Command line interface
 */
async function main() {
  const args = process.argv.slice(2);
  const ipaPath = args[0];

  if (!ipaPath) {
    console.log(`
🚀 Transporter Upload Tool

Usage: node transporter-upload.js <path-to-ipa-file>

Options:
  --verbose    Show detailed output
  --dry-run    Validate only, don't upload

Example:
  node transporter-upload.js ./Compete.ipa
  node transporter-upload.js ./Compete.ipa --verbose
    `);
    process.exit(1);
  }

  const options = {
    verbose: args.includes('--verbose'),
    dryRun: args.includes('--dry-run'),
  };

  try {
    const uploader = new TransporterUploadManager(options);
    await uploader.uploadIpa(ipaPath);
  } catch (error) {
    console.error('\n💥 Upload process failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = {
  TransporterUploadManager,
};

// If run directly, execute main function
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}
