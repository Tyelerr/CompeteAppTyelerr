import { ITournamentFilters } from '../hooks/InterfacesGlobal';

/**
 * List of filter fields that are not valid for direct tournament table queries
 * These fields don't exist as columns in the tournaments table
 * Note: lat, lng are preserved for location resolution but not used in direct queries
 * state, city, and zip_code are valid tournament table columns and should be allowed
 */
const INVALID_TOURNAMENT_FILTERS = [] as const;

/**
 * Sanitizes tournament filters by removing fields that don't exist in the tournaments table
 * This prevents database errors when trying to filter on non-existent columns
 *
 * @param filters - The original tournament filters from the UI
 * @returns Sanitized filters with invalid fields removed
 */
export function sanitizeTournamentFilters(
  filters: ITournamentFilters,
): ITournamentFilters {
  console.log('=== SANITIZING TOURNAMENT FILTERS ===');
  console.log('Original filters:', JSON.stringify(filters, null, 2));

  // Create a copy of the filters to avoid mutating the original
  const sanitizedFilters = { ...filters };

  // Track which filters were removed for logging
  const removedFilters: string[] = [];

  // Remove invalid filters
  INVALID_TOURNAMENT_FILTERS.forEach((invalidField) => {
    if (sanitizedFilters[invalidField] !== undefined) {
      removedFilters.push(invalidField);
      delete sanitizedFilters[invalidField];
    }
  });

  // Log what was sanitized
  if (removedFilters.length > 0) {
    console.log('🧹 Removed invalid tournament filters:', removedFilters);
    console.log(
      'These filters are not supported for direct tournament table queries',
    );
    console.log(
      'Consider implementing venue-based filtering for location searches',
    );
  } else {
    console.log('✅ No invalid filters found - all filters are valid');
  }

  console.log('Sanitized filters:', JSON.stringify(sanitizedFilters, null, 2));
  console.log('=== FILTER SANITIZATION COMPLETE ===');

  return sanitizedFilters;
}

/**
 * Checks if the given filters contain any invalid tournament table fields
 *
 * @param filters - The tournament filters to check
 * @returns true if invalid filters are present, false otherwise
 */
export function hasInvalidTournamentFilters(
  filters: ITournamentFilters,
): boolean {
  return INVALID_TOURNAMENT_FILTERS.some(
    (invalidField) =>
      filters[invalidField] !== undefined &&
      filters[invalidField] !== null &&
      filters[invalidField] !== '',
  );
}

/**
 * Gets a list of invalid filter fields present in the given filters
 *
 * @param filters - The tournament filters to check
 * @returns Array of invalid filter field names
 */
export function getInvalidTournamentFilters(
  filters: ITournamentFilters,
): string[] {
  return INVALID_TOURNAMENT_FILTERS.filter(
    (invalidField) =>
      filters[invalidField] !== undefined &&
      filters[invalidField] !== null &&
      filters[invalidField] !== '',
  );
}
