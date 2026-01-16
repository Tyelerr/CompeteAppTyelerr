const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * JWT Authentication for App Store Connect API
 * Generates JWT tokens for use with Transporter and App Store Connect API
 */
class AppStoreConnectJWT {
  constructor(config) {
    this.issuerId = config.issuerId;
    this.keyId = config.keyId;
    this.privateKeyPath = config.privateKeyPath;
    this.privateKey = null;

    this.loadPrivateKey();
  }

  /**
   * Load the private key from the .p8 file
   */
  loadPrivateKey() {
    try {
      if (!fs.existsSync(this.privateKeyPath)) {
        throw new Error(`Private key file not found: ${this.privateKeyPath}`);
      }

      this.privateKey = fs.readFileSync(this.privateKeyPath, 'utf8');
      console.log('✅ Private key loaded successfully');
    } catch (error) {
      console.error('❌ Error loading private key:', error.message);
      throw error;
    }
  }

  /**
   * Create JWT header
   */
  createHeader() {
    const header = {
      alg: 'ES256',
      kid: this.keyId,
      typ: 'JWT',
    };

    return this.base64UrlEncode(JSON.stringify(header));
  }

  /**
   * Create JWT payload
   */
  createPayload() {
    const now = Math.floor(Date.now() / 1000);
    const expiration = now + 20 * 60; // 20 minutes from now (max allowed)

    const payload = {
      iss: this.issuerId,
      iat: now,
      exp: expiration,
      aud: 'appstoreconnect-v1',
    };

    return this.base64UrlEncode(JSON.stringify(payload));
  }

  /**
   * Base64 URL encode
   */
  base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Sign the JWT token
   */
  signToken(header, payload) {
    const message = `${header}.${payload}`;

    try {
      const signature = crypto.sign('sha256', Buffer.from(message), {
        key: this.privateKey,
        format: 'pem',
      });

      return this.base64UrlEncode(signature);
    } catch (error) {
      console.error('❌ Error signing token:', error.message);
      throw error;
    }
  }

  /**
   * Generate complete JWT token
   */
  generateToken() {
    try {
      console.log('🔐 Generating JWT token...');

      const header = this.createHeader();
      const payload = this.createPayload();
      const signature = this.signToken(header, payload);

      const token = `${header}.${payload}.${signature}`;

      console.log('✅ JWT token generated successfully');
      console.log(`📝 Token length: ${token.length} characters`);

      return token;
    } catch (error) {
      console.error('❌ Error generating JWT token:', error.message);
      throw error;
    }
  }

  /**
   * Validate token format (basic validation)
   */
  validateToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: token must have 3 parts');
    }

    try {
      // Decode header and payload to verify they're valid JSON
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token has expired');
      }

      console.log('✅ Token validation passed');
      console.log(
        `📅 Token expires at: ${new Date(payload.exp * 1000).toISOString()}`,
      );

      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error.message);
      return false;
    }
  }
}

/**
 * Load configuration from environment variables or config file
 */
function loadConfig() {
  // Try to load from environment variables first
  if (
    process.env.APP_STORE_CONNECT_ISSUER_ID &&
    process.env.APP_STORE_CONNECT_KEY_ID &&
    process.env.APP_STORE_CONNECT_PRIVATE_KEY_PATH
  ) {
    return {
      issuerId: process.env.APP_STORE_CONNECT_ISSUER_ID,
      keyId: process.env.APP_STORE_CONNECT_KEY_ID,
      privateKeyPath: process.env.APP_STORE_CONNECT_PRIVATE_KEY_PATH,
    };
  }

  // Try to load from config file
  const configPath = path.join(
    __dirname,
    '..',
    'app-store-connect-config.json',
  );
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config;
    } catch (error) {
      console.error('❌ Error reading config file:', error.message);
    }
  }

  throw new Error(`
❌ App Store Connect API credentials not found!

Please set up your credentials using one of these methods:

1. Environment Variables:
   - APP_STORE_CONNECT_ISSUER_ID
   - APP_STORE_CONNECT_KEY_ID  
   - APP_STORE_CONNECT_PRIVATE_KEY_PATH

2. Config File (app-store-connect-config.json):
   {
     "issuerId": "your-issuer-id",
     "keyId": "your-key-id", 
     "privateKeyPath": "path/to/your/AuthKey_KEYID.p8"
   }

Get these credentials from App Store Connect > Users and Access > Keys
  `);
}

/**
 * Main function to generate and return JWT token
 */
function generateJWTToken() {
  try {
    console.log('🚀 Starting JWT token generation...');

    const config = loadConfig();
    const jwtGenerator = new AppStoreConnectJWT(config);
    const token = jwtGenerator.generateToken();

    // Validate the generated token
    jwtGenerator.validateToken(token);

    return token;
  } catch (error) {
    console.error('❌ JWT generation failed:', error.message);
    throw error;
  }
}

// Export for use in other scripts
module.exports = {
  AppStoreConnectJWT,
  generateJWTToken,
  loadConfig,
};

// If run directly, generate and display token
if (require.main === module) {
  try {
    const token = generateJWTToken();
    console.log('\n🎉 JWT Token Generated Successfully!');
    console.log('📋 Copy this token for use with Transporter:');
    console.log('\n' + token + '\n');
  } catch (error) {
    console.error('\n💥 Failed to generate JWT token');
    process.exit(1);
  }
}
