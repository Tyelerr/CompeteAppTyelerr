// utils/ContentFilter.tsx
// Simple inline bad words filter to avoid import issues

// Basic list of inappropriate words for username filtering
const badWordsList = [
  'damn',
  'hell',
  'shit',
  'fuck',
  'bitch',
  'ass',
  'bastard',
  'crap',
  'piss',
  'dick',
  'cock',
  'pussy',
  'tits',
  'boobs',
  'sex',
  'porn',
  'nude',
  'naked',
  'kill',
  'die',
  'death',
  'murder',
  'hate',
  'nazi',
  'hitler',
  'terrorist',
  'bomb',
  'gun',
  'weapon',
  'drug',
  'cocaine',
  'weed',
  'marijuana',
  'alcohol',
  'beer',
  'wine',
  'drunk',
  'stupid',
  'idiot',
  'moron',
  'retard',
  'gay',
  'lesbian',
  'homo',
  'fag',
  'nigger',
  'nigga',
  'chink',
  'spic',
  'wetback',
  'kike',
  'gook',
  'towelhead',
];

// Simple profanity checker - matches whole words only to avoid false positives
const isProfane = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return badWordsList.some((word) => {
    // Use word boundaries to match whole words only
    // This prevents false positives like "Eddie" matching "die"
    const wordRegex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    return wordRegex.test(lowerText);
  });
};

// Simple content cleaner
const cleanContent = (text: string): string => {
  let cleanedText = text;
  badWordsList.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    cleanedText = cleanedText.replace(regex, '***');
  });
  return cleanedText;
};

/**
 * Comprehensive content filtering utility for the entire application
 * Prevents inappropriate content in usernames, venue names, tournament names, messages, etc.
 */

export interface ContentFilterResult {
  isValid: boolean;
  message?: string;
  filteredContent?: string;
}

/**
 * Check if content contains inappropriate words
 * @param content - The content to check
 * @param type - The type of content being checked (for context-specific messages)
 * @returns ContentFilterResult with validation status and message
 */
export const checkForInappropriateContent = (
  content: string,
  type:
    | 'username'
    | 'email'
    | 'venue'
    | 'tournament'
    | 'message'
    | 'general' = 'general',
): ContentFilterResult => {
  if (!content || content.trim().length === 0) {
    return {
      isValid: true,
      filteredContent: content,
    };
  }

  const trimmedContent = content.trim();

  try {
    // Use inline bad-words checker for inappropriate content
    const hasInappropriateContent = isProfane(trimmedContent);

    if (hasInappropriateContent) {
      const contextMessages = {
        username: "Seriously? Couldn't find anything better?",
        email: 'Email contains inappropriate content',
        venue: 'Venue name contains inappropriate content',
        tournament: 'Tournament name contains inappropriate content',
        message: 'Message contains inappropriate content',
        general: 'Content contains inappropriate words',
      };

      return {
        isValid: false,
        message: contextMessages[type],
        filteredContent: trimmedContent,
      };
    }

    return {
      isValid: true,
      message: 'Content is appropriate',
      filteredContent: trimmedContent,
    };
  } catch (error) {
    console.error('Error checking content:', error);
    // If there's an error with the filter, allow the content but log the error
    return {
      isValid: true,
      message: 'Content check completed',
      filteredContent: trimmedContent,
    };
  }
};

/**
 * Normalize username by converting similar-looking characters to standard forms
 * This helps detect potential impersonation attempts while allowing legitimate usernames
 * @param username - The username to normalize
 * @returns Normalized username string
 */
export const normalizeUsername = (username: string): string => {
  if (!username) return '';

  return (
    username
      .toLowerCase()
      // Convert similar-looking characters to standard forms
      // I, l, 1 all become 'i'
      .replace(/[Il1]/g, 'i')
      // O, 0 both become 'o'
      .replace(/[O0]/g, 'o')
      // Remove any remaining ambiguous characters for comparison
      .trim()
  );
};

/**
 * Advanced username security validation that checks for actual impersonation risks
 * This function should be used in conjunction with database checks
 * @param username - The username to validate
 * @param existingUsernames - Array of existing usernames to check against (optional)
 * @returns ContentFilterResult with validation status
 */
export const validateUsernameSecurityAdvanced = (
  username: string,
  existingUsernames?: string[],
): ContentFilterResult => {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      message: 'Username is required',
    };
  }

  const trimmedUsername = username.trim();

  // If we have existing usernames to check against, do similarity comparison
  if (existingUsernames && existingUsernames.length > 0) {
    const normalizedInput = normalizeUsername(trimmedUsername);

    // Check if the normalized version would conflict with any existing username
    const conflictingUsername = existingUsernames.find((existing) => {
      const normalizedExisting = normalizeUsername(existing);
      return (
        normalizedInput === normalizedExisting &&
        trimmedUsername.toLowerCase() !== existing.toLowerCase()
      ); // Different actual username but same normalized
    });

    if (conflictingUsername) {
      return {
        isValid: false,
        message: `Username too similar to existing user "${conflictingUsername}". Please choose a different username.`,
      };
    }
  }

  return {
    isValid: true,
    message: 'Username passes security validation',
    filteredContent: trimmedUsername,
  };
};

/**
 * Validate username with comprehensive checks (UPDATED - More Permissive)
 * @param username - The username to validate
 * @returns ContentFilterResult with validation status
 */
export const validateUsername = (username: string): ContentFilterResult => {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      message: 'Username is required',
    };
  }

  const trimmedUsername = username.trim();

  // Check for spaces
  if (trimmedUsername.includes(' ')) {
    return {
      isValid: false,
      message: 'Username cannot contain spaces',
    };
  }

  // Check length
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters long',
    };
  }

  if (trimmedUsername.length > 20) {
    return {
      isValid: false,
      message: 'Username must be 20 characters or less',
    };
  }

  // Check for valid characters only (alphanumeric and underscore)
  const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, and underscores',
    };
  }

  // REMOVED: Overly restrictive confusing characters check
  // The old check: if (/[Il1O0]/.test(trimmedUsername)) was too broad
  // Now we rely on the advanced security validation with database checks

  // Check for underscore rules
  if (/^_|_$/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: 'Username cannot start or end with an underscore',
    };
  }

  if (/__+/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: 'Username cannot contain multiple consecutive underscores',
    };
  }

  // Check for reserved words
  const reservedPatterns = [
    /^admin/i,
    /^root/i,
    /^test/i,
    /^null/i,
    /^undefined/i,
    /^system/i,
    /^compete/i,
  ];

  for (const pattern of reservedPatterns) {
    if (pattern.test(trimmedUsername)) {
      return {
        isValid: false,
        message: 'Username contains reserved words',
      };
    }
  }

  // Check for inappropriate content
  const inappropriateCheck = checkForInappropriateContent(
    trimmedUsername,
    'username',
  );
  if (!inappropriateCheck.isValid) {
    return inappropriateCheck;
  }

  return {
    isValid: true,
    message: 'Username is valid',
    filteredContent: trimmedUsername,
  };
};

/**
 * Validate venue name
 * @param venueName - The venue name to validate
 * @returns ContentFilterResult with validation status
 */
export const validateVenueName = (venueName: string): ContentFilterResult => {
  if (!venueName || venueName.trim().length === 0) {
    return {
      isValid: false,
      message: 'Venue name is required',
    };
  }

  const trimmedName = venueName.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Venue name must be at least 2 characters long',
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'Venue name must be 100 characters or less',
    };
  }

  // Check for inappropriate content
  return checkForInappropriateContent(trimmedName, 'venue');
};

/**
 * Validate tournament name
 * @param tournamentName - The tournament name to validate
 * @returns ContentFilterResult with validation status
 */
export const validateTournamentName = (
  tournamentName: string,
): ContentFilterResult => {
  if (!tournamentName || tournamentName.trim().length === 0) {
    return {
      isValid: false,
      message: 'Tournament name is required',
    };
  }

  const trimmedName = tournamentName.trim();

  if (trimmedName.length < 3) {
    return {
      isValid: false,
      message: 'Tournament name must be at least 3 characters long',
    };
  }

  if (trimmedName.length > 150) {
    return {
      isValid: false,
      message: 'Tournament name must be 150 characters or less',
    };
  }

  // Check for inappropriate content
  return checkForInappropriateContent(trimmedName, 'tournament');
};

/**
 * Validate message content
 * @param message - The message to validate
 * @returns ContentFilterResult with validation status
 */
export const validateMessage = (message: string): ContentFilterResult => {
  if (!message || message.trim().length === 0) {
    return {
      isValid: false,
      message: 'Message cannot be empty',
    };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length > 1000) {
    return {
      isValid: false,
      message: 'Message must be 1000 characters or less',
    };
  }

  // Check for inappropriate content
  return checkForInappropriateContent(trimmedMessage, 'message');
};

/**
 * Validate user display name
 * @param displayName - The display name to validate
 * @returns ContentFilterResult with validation status
 */
export const validateDisplayName = (
  displayName: string,
): ContentFilterResult => {
  if (!displayName || displayName.trim().length === 0) {
    return {
      isValid: false,
      message: 'Display name is required',
    };
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Display name must be at least 2 characters long',
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message: 'Display name must be 50 characters or less',
    };
  }

  // Allow letters, numbers, spaces, hyphens, and apostrophes for display names
  const validDisplayNameRegex = /^[a-zA-Z0-9\s\-']+$/;
  if (!validDisplayNameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message:
        'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    };
  }

  // Check for inappropriate content
  return checkForInappropriateContent(trimmedName, 'general');
};

/**
 * Generic content validator that can be used for any text input
 * @param content - The content to validate
 * @param options - Validation options
 * @returns ContentFilterResult with validation status
 */
export const validateContent = (
  content: string,
  options: {
    type?:
      | 'username'
      | 'email'
      | 'venue'
      | 'tournament'
      | 'message'
      | 'general';
    minLength?: number;
    maxLength?: number;
    allowSpaces?: boolean;
    allowSpecialChars?: boolean;
    customRegex?: RegExp;
  } = {},
): ContentFilterResult => {
  const {
    type = 'general',
    minLength = 1,
    maxLength = 255,
    allowSpaces = true,
    allowSpecialChars = true,
    customRegex,
  } = options;

  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      message: 'Content is required',
    };
  }

  const trimmedContent = content.trim();

  // Check length
  if (trimmedContent.length < minLength) {
    return {
      isValid: false,
      message: `Content must be at least ${minLength} characters long`,
    };
  }

  if (trimmedContent.length > maxLength) {
    return {
      isValid: false,
      message: `Content must be ${maxLength} characters or less`,
    };
  }

  // Check for spaces if not allowed
  if (!allowSpaces && trimmedContent.includes(' ')) {
    return {
      isValid: false,
      message: 'Content cannot contain spaces',
    };
  }

  // Check for special characters if not allowed
  if (!allowSpecialChars) {
    const alphanumericRegex = /^[a-zA-Z0-9_\s]+$/;
    if (!alphanumericRegex.test(trimmedContent)) {
      return {
        isValid: false,
        message: 'Content can only contain letters, numbers, and underscores',
      };
    }
  }

  // Check custom regex if provided
  if (customRegex && !customRegex.test(trimmedContent)) {
    return {
      isValid: false,
      message: 'Content does not meet the required format',
    };
  }

  // Check for inappropriate content
  return checkForInappropriateContent(trimmedContent, type);
};

/**
 * Sanitize content by removing or replacing inappropriate words
 * @param content - The content to sanitize
 * @param replacement - What to replace inappropriate words with (default: ***)
 * @returns Sanitized content
 */
export const sanitizeContent = (
  content: string,
  replacement: string = '***',
): string => {
  if (!content || content.trim().length === 0) {
    return content;
  }

  try {
    // Use inline bad-words checker and cleaner
    const hasInappropriateContent = isProfane(content);

    if (hasInappropriateContent) {
      // Use inline clean method to replace inappropriate words
      return cleanContent(content);
    }

    return content;
  } catch (error) {
    console.error('Error sanitizing content:', error);
    return content; // Return original content if sanitization fails
  }
};

export default {
  checkForInappropriateContent,
  validateUsername,
  validateUsernameSecurityAdvanced,
  normalizeUsername,
  validateVenueName,
  validateTournamentName,
  validateMessage,
  validateDisplayName,
  validateContent,
  sanitizeContent,
};
