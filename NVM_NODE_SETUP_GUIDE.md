# Node Version Management with NVM for TestFlight Deployment

## 🚀 Why Use NVM?

NVM allows you to:

- Install and switch between multiple Node.js versions instantly
- Test your app with different Node versions
- Avoid conflicts between projects requiring different Node versions
- Easily rollback if a Node update breaks something

## 📦 Installing NVM on Windows

### Option 1: NVM for Windows (Recommended)

```bash
# Download and install from:
# https://github.com/coreybutler/nvm-windows/releases

# Or use Chocolatey:
choco install nvm

# Or use Scoop:
scoop install nvm
```

### Option 2: Using PowerShell (Alternative)

```powershell
# Install via PowerShell script
iwr -useb https://raw.githubusercontent.com/coreybutler/nvm-windows/master/installps1/install.ps1 | iex
```

## 🔧 NVM Commands for Your Project

### 1. Install Node 20 (Latest LTS)

```bash
# Install Node 20 (latest LTS)
nvm install 20.18.0

# Install Node 18 (backup compatibility)
nvm install 18.19.0

# List installed versions
nvm list
```

### 2. Switch to Node 20 for Your Project

```bash
# Use Node 20 for current session
nvm use 20.18.0

# Set Node 20 as default
nvm alias default 20.18.0

# Verify current version
node --version
npm --version
```

### 3. Project-Specific Node Version

Create a `.nvmrc` file in your CompeteApp directory:

```bash
# Create .nvmrc file
echo "20.18.0" > .nvmrc

# Then use it
nvm use
```

## 🛠️ Updated Upgrade Script with NVM

Here's your upgrade process using NVM:

```bash
# Step 1: Switch to Node 20
nvm use 20.18.0

# Step 2: Verify Node version
node --version  # Should show v20.18.0

# Step 3: Clean install
cd CompeteApp
rmdir /s /q node_modules
del package-lock.json

# Step 4: Install dependencies
npm install

# Step 5: Update Expo CLI
npm install -g @expo/cli@latest

# Step 6: Fix Expo dependencies
npx expo install --fix

# Step 7: Test locally
npm start

# Step 8: Build for TestFlight
eas build --platform ios --profile production
```

## 🔄 Version Switching Examples

### For Different Projects

```bash
# Switch to Node 18 for older projects
nvm use 18.19.0

# Switch back to Node 20 for CompeteApp
nvm use 20.18.0

# Check which version is active
nvm current
```

### Quick Version Testing

```bash
# Test with Node 20
nvm use 20.18.0
npm start

# If issues, try Node 18
nvm use 18.19.0
npm start
```

## 📋 Troubleshooting with NVM

### If Build Fails with Node 20:

```bash
# Try Node 18 as fallback
nvm use 18.19.0
npm install
eas build --platform ios --profile production
```

### If Dependencies Conflict:

```bash
# Clear everything and reinstall
nvm use 20.18.0
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

## 🎯 Benefits for Your TestFlight Deployment

1. **Consistency**: Ensure same Node version locally and on EAS Build
2. **Flexibility**: Switch versions if build issues occur
3. **Testing**: Test app with different Node versions before deployment
4. **Rollback**: Quickly revert to working Node version if needed

## 📝 .nvmrc File for Your Project

Add this to `CompeteApp/.nvmrc`:

```
20.18.0
```

Then team members can simply run:

```bash
cd CompeteApp
nvm use  # Automatically uses version from .nvmrc
```

## 🚀 Complete Workflow

```bash
# 1. Install and setup NVM
nvm install 20.18.0
nvm use 20.18.0

# 2. Navigate to project
cd CompeteApp

# 3. Clean install with Node 20
rmdir /s /q node_modules
del package-lock.json
npm install

# 4. Test locally
npm start

# 5. Build for TestFlight
eas build --platform ios --profile production

# 6. Submit to TestFlight (after successful build)
eas submit --platform ios
```

This approach gives you maximum flexibility and control over your Node.js environment!
