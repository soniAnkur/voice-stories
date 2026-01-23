/**
 * Server-side coupon management
 * Add/remove coupons here - they bypass Stripe payment entirely
 */

interface Coupon {
  code: string;
  description: string;
  maxUses: number | null; // null = unlimited
  usedCount: number;
  expiresAt: Date | null; // null = never expires
  active: boolean;
}

// Coupon database - add your coupons here
const COUPONS: Record<string, Coupon> = {
  BETAUSER2026: {
    code: "BETAUSER2026",
    description: "Beta tester free access",
    maxUses: 100,
    usedCount: 0,
    expiresAt: new Date("2026-12-31"),
    active: true,
  },
  FAMILYFREE: {
    code: "FAMILYFREE",
    description: "Family and friends coupon",
    maxUses: 50,
    usedCount: 0,
    expiresAt: null, // Never expires
    active: true,
  },
};

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon;
}

/**
 * Validate a coupon code
 */
export function validateCoupon(code: string): CouponValidationResult {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = COUPONS[normalizedCode];

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (!coupon.active) {
    return { valid: false, message: "This coupon is no longer active" };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, message: "This coupon has expired" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "This coupon has reached its usage limit" };
  }

  return {
    valid: true,
    message: "Coupon applied! You get this story for free.",
    coupon,
  };
}

/**
 * Mark a coupon as used (increment usage count)
 * Note: In production, you'd want to persist this to a database
 */
export function markCouponUsed(code: string): void {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = COUPONS[normalizedCode];
  if (coupon) {
    coupon.usedCount++;
  }
}

/**
 * Get all active coupons (for admin purposes)
 */
export function getActiveCoupons(): Coupon[] {
  return Object.values(COUPONS).filter((c) => c.active);
}
