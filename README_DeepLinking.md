# Mobile Deep Linking Implementation

This document explains the mobile deep linking system implemented for authentication flows in the Billiards App.

## Overview

The deep linking system allows users to be directed to specific screens in the mobile app through URLs, particularly useful for:

- Email verification links
- Password reset links
- Signup invitation links
- Direct login flows

## Configuration

### App Configuration (app.json)

```json
{
  "expo": {
    "scheme": "billiardsapp",
    "plugins": [["expo-linking", { "scheme": "billiardsapp" }]],
    "ios": {
      "bundleIdentifier": "com.zlatkoflash.billiardsapp2"
    },
    "android": {
      "package": "com.zlatkoflash.billiardsapp2",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "billiardsapp.com"
            },
            {
              "scheme": "billiardsapp"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Deep Link URL Formats

### App Scheme URLs

- `billiardsapp://auth?type=login&email=user@example.com`
- `billiardsapp://auth?type=signup&email=user@example.com`
- `billiardsapp://auth?type=reset-password&token=abc123&email=user@example.com`
- `billiardsapp://auth?type=email-verification&token=xyz789&email=user@example.com`

### Web URLs (Universal Links)

- `https://billiardsapp.com/auth?type=login&email=user@example.com`
- `https://billiardsapp.com/auth?type=signup&email=user@example.com`
- `https://billiardsapp.com/auth?type=reset-password&token=abc123&email=user@example.com`
- `https://billiardsapp.com/auth?type=email-verification&token=xyz789&email=user@example.com`

## Usage Examples

### Generating Deep Links

```typescript
import DeepLinkingService from '../services/DeepLinkingService';

// Create email verification link
const { appLink, webLink } = DeepLinkingService.createEmailVerificationLink(
  'verification-token-123',
  'user@example.com',
);

// Create password reset link
const { appLink, webLink } = DeepLinkingService.createPasswordResetLink(
  'reset-token-456',
  'user@example.com',
);

// Create signup invitation link
const { appLink, webLink } = DeepLinkingService.createSignupInviteLink(
  'user@example.com',
  'dashboard', // optional redirect after signup
);
```

### Handling Deep Links in Email Templates

```html
<!-- Email Verification Template -->
<a
  href="https://billiardsapp.com/auth?type=email-verification&token={{verification_token}}&email={{user_email}}"
>
  Verify Your Email
</a>

<!-- Password Reset Template -->
<a
  href="https://billiardsapp.com/auth?type=reset-password&token={{reset_token}}&email={{user_email}}"
>
  Reset Your Password
</a>

<!-- Signup Invitation Template -->
<a href="https://billiardsapp.com/auth?type=signup&email={{invited_email}}">
  Join Billiards App
</a>
```

## Supported Authentication Flows

### 1. Login Flow

- **URL**: `billiardsapp://auth?type=login&email=user@example.com`
- **Action**: Navigates to login screen with email pre-filled
- **Use Case**: Direct login links from emails or notifications

### 2. Signup Flow

- **URL**: `billiardsapp://auth?type=signup&email=user@example.com&redirect=dashboard`
- **Action**: Navigates to registration screen with email pre-filled
- **Use Case**: Invitation emails, referral links

### 3. Password Reset Flow

- **URL**: `billiardsapp://auth?type=reset-password&token=abc123&email=user@example.com`
- **Action**: Navigates to password reset screen with token validation
- **Use Case**: "Forgot Password" email links

### 4. Email Verification Flow

- **URL**: `billiardsapp://auth?type=email-verification&token=xyz789&email=user@example.com`
- **Action**: Navigates to email verification screen and processes token
- **Use Case**: Account activation emails

## Integration with Supabase Auth

The deep linking system works seamlessly with Supabase authentication:

```typescript
// In your Supabase auth configuration
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Configure redirect URLs for email templates
    redirectTo: 'https://billiardsapp.com/auth',
  },
});

// Email verification
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: 'https://billiardsapp.com/auth?type=email-verification',
  },
});

// Password reset
await supabase.auth.resetPasswordForEmail('user@example.com', {
  redirectTo: 'https://billiardsapp.com/auth?type=reset-password',
});
```

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted "billiardsapp://auth?type=login&email=test@example.com"
```

### Android Emulator

```bash
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "billiardsapp://auth?type=login&email=test@example.com" \
  com.zlatkoflash.billiardsapp2
```

### Web Testing

Open in browser: `https://billiardsapp.com/auth?type=login&email=test@example.com`

## Error Handling

The deep linking service includes comprehensive error handling:

```typescript
// The service will handle:
// - Invalid URL formats
// - Missing required parameters
// - Navigation failures
// - Unknown deep link types

// Check the console for debugging information:
console.log('Deep link received:', url);
console.log('Parsed parameters:', params);
```

## Security Considerations

1. **Token Validation**: Always validate tokens server-side before processing
2. **Email Verification**: Verify email ownership before account activation
3. **Expiration**: Implement token expiration for security
4. **Rate Limiting**: Limit deep link generation to prevent abuse

## Troubleshooting

### Common Issues

1. **Deep links not opening app**

   - Verify app.json configuration
   - Check if app is installed
   - Test with both app scheme and universal links

2. **Navigation not working**

   - Ensure navigation ref is properly set
   - Check screen names match navigation structure
   - Verify deep link handler is initialized

3. **Parameters not being passed**
   - Check URL encoding
   - Verify parameter names match expected format
   - Test with simple parameters first

### Debug Mode

Enable debug logging in the DeepLinkingService:

```typescript
// Add to DeepLinkingService constructor
console.log('Deep linking service initialized');

// Add to handleDeepLink method
console.log('Processing deep link:', url);
console.log('Parsed data:', parsed);
```

## Future Enhancements

Potential improvements to the deep linking system:

1. **Dynamic Links**: Implement Firebase Dynamic Links for better fallback handling
2. **Analytics**: Track deep link usage and conversion rates
3. **A/B Testing**: Test different deep link formats and flows
4. **Social Sharing**: Add deep links for sharing tournaments, venues, etc.
5. **Push Notifications**: Integrate with push notification deep links

## Support

For issues or questions about the deep linking implementation:

1. Check the console logs for error messages
2. Verify URL format matches the expected patterns
3. Test with simple deep links first
4. Ensure all required dependencies are installed
