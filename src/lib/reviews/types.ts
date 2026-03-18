/**
 * Types for the Google Reviews integration.
 */

export interface GoogleReviewAuthor {
  displayName: string;
  profilePhotoUrl?: string;
}

export interface GoogleReview {
  /** Unique resource name, e.g. accounts/123/locations/456/reviews/789 */
  name: string;
  reviewId: string;
  reviewer: GoogleReviewAuthor;
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
}

export interface GoogleLocation {
  name: string; // accounts/{accountId}/locations/{locationId}
  locationName: string;
  placeId?: string;
}

export interface GoogleAccount {
  name: string; // accounts/{accountId}
  accountName: string;
  type: string;
}

/** Result of a single review pull operation */
export interface PullResult {
  businessId: string;
  totalFound: number;
  saved: number;
  skippedDuplicate: number;
  skippedLowRating: number;
  errors: string[];
}

/** Minimal interface for persisted OAuth token */
export interface StoredOAuthToken {
  businessId: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiresAt: Date;
  scope: string;
}

/** Map from star-rating string to numeric value */
export const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};
