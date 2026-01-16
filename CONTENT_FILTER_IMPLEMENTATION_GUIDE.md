# Content Filter Implementation Guide

## Overview

This guide shows how to implement the comprehensive content filtering system throughout the CompeteApp to prevent inappropriate content in usernames, venue names, tournament names, messages, and other user-generated content.

## ✅ Already Implemented

- **Username validation** in user registration with inappropriate content filtering
- **naughty-words package** installed for profanity detection
- **ContentFilter utility** created with comprehensive validation functions

## 🔧 How to Use Content Filter

### Import the Content Filter

```tsx
import {
  validateUsername,
  validateVenueName,
  validateTournamentName,
  validateMessage,
  validateDisplayName,
  checkForInappropriateContent,
} from '../utils/ContentFilter';
```

### Usage Examples

#### 1. Username Validation (Already Implemented)

```tsx
// In user registration
const usernameValidation = validateUsername(username);
if (!usernameValidation.isValid) {
  setError(usernameValidation.message);
  return;
}
```

#### 2. Venue Name Validation

```tsx
// In venue creation/editing
const venueValidation = validateVenueName(venueName);
if (!venueValidation.isValid) {
  setError(venueValidation.message);
  return;
}
```

#### 3. Tournament Name Validation

```tsx
// In tournament creation/editing
const tournamentValidation = validateTournamentName(tournamentName);
if (!tournamentValidation.isValid) {
  setError(tournamentValidation.message);
  return;
}
```

#### 4. Message Validation

```tsx
// In messaging/chat features
const messageValidation = validateMessage(messageText);
if (!messageValidation.isValid) {
  setError(messageValidation.message);
  return;
}
```

#### 5. Generic Content Validation

```tsx
// For any other content
const contentValidation = checkForInappropriateContent(content, 'general');
if (!contentValidation.isValid) {
  setError(contentValidation.message);
  return;
}
```

## 📋 Files That Should Be Updated

### High Priority (User-Generated Content)

1. **`screens/Shop/ModalCreateVenue.tsx`** - Venue name validation
2. **`screens/Admin/ModalAdminTournamentEditor.tsx`** - Tournament name validation
3. **`screens/ProfileLogged/FormUserEditor.tsx`** - Display name validation
4. **`screens/Admin/ScreenAdminMessages.tsx`** - Message content validation
5. **`screens/FAQs/SupportMessagesTab_Clean.tsx`** - Support message validation

### Medium Priority (Admin Content)

6. **`ApiSupabase/CrudVenues.tsx`** - Backend venue validation
7. **`ApiSupabase/CrudTournament.tsx`** - Backend tournament validation
8. **`ApiSupabase/CrudMessages.tsx`** - Backend message validation

### Low Priority (System Content)

9. **Any other forms** with text inputs that users can submit

## 🛠️ Implementation Steps

### Step 1: Update Venue Creation

```tsx
// In ModalCreateVenue.tsx
import { validateVenueName } from '../../utils/ContentFilter';

const handleVenueSubmit = () => {
  const validation = validateVenueName(venueName);
  if (!validation.isValid) {
    setError(validation.message);
    return;
  }
  // Continue with venue creation...
};
```

### Step 2: Update Tournament Creation

```tsx
// In ModalAdminTournamentEditor.tsx
import { validateTournamentName } from '../../utils/ContentFilter';

const handleTournamentSubmit = () => {
  const validation = validateTournamentName(tournamentName);
  if (!validation.isValid) {
    setError(validation.message);
    return;
  }
  // Continue with tournament creation...
};
```

### Step 3: Update Profile Editing

```tsx
// In FormUserEditor.tsx
import { validateDisplayName } from '../../utils/ContentFilter';

const handleProfileUpdate = () => {
  const validation = validateDisplayName(displayName);
  if (!validation.isValid) {
    setError(validation.message);
    return;
  }
  // Continue with profile update...
};
```

### Step 4: Update Messaging

```tsx
// In messaging components
import { validateMessage } from '../../utils/ContentFilter';

const handleSendMessage = () => {
  const validation = validateMessage(messageText);
  if (!validation.isValid) {
    setError(validation.message);
    return;
  }
  // Continue with sending message...
};
```

## 🔒 Security Features

### What Gets Blocked:

- **Profanity and inappropriate language** (via naughty-words package)
- **Confusing characters** (I, l, 1, O, 0) in usernames
- **Special characters** in usernames (only letters, numbers, underscore allowed)
- **Reserved words** (admin, root, test, system, compete, etc.)
- **Inappropriate length** (too short or too long)
- **Invalid formats** (spaces where not allowed, etc.)

### Error Messages:

- **Security-conscious**: Don't reveal too much information
- **Context-specific**: Different messages for usernames vs venue names
- **User-friendly**: Clear guidance on what's allowed

## 🧪 Testing

### Test Cases to Verify:

1. **Profanity blocking**: Try entering inappropriate words
2. **Character restrictions**: Test confusing characters (I, l, 1, O, 0)
3. **Length limits**: Test very short and very long inputs
4. **Special characters**: Test symbols and special characters
5. **Reserved words**: Test admin, root, test, etc.

### Example Test Inputs:

- ❌ `admin123` (reserved word)
- ❌ `test_user` (reserved word)
- ❌ `user@#$` (special characters)
- ❌ `Il1O0` (confusing characters)
- ❌ `_username_` (starts/ends with underscore)
- ❌ `ab` (too short)
- ✅ `john_doe` (valid)
- ✅ `player2023` (valid)

## 📝 Next Steps

1. **Update venue creation forms** with content filtering
2. **Update tournament creation forms** with content filtering
3. **Update messaging systems** with content filtering
4. **Update profile editing** with content filtering
5. **Test all implementations** thoroughly
6. **Add backend validation** in API functions

This comprehensive system ensures all user-generated content is appropriate and follows consistent validation rules across the entire application.
