/**
 * String utility functions for text formatting
 */

/**
 * Converts a string to title case (capitalizes the first letter of each word)
 * @param str - The string to convert
 * @returns The string in title case
 * @example
 * toTitleCase("metro chip tournament") // Returns "Metro Chip Tournament"
 * toTitleCase("9-ball") // Returns "9-Ball"
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.replace(
    /\w+/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
};
