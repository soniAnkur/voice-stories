/**
 * Feature flags for the application
 * Set these to control application behavior
 */

export const Features = {
  /**
   * When true, bypasses Stripe payment and gives free access to full stories
   * Set to false in production to enable payments
   */
  BYPASS_PAYMENT: true,

  /**
   * When true, skips actual ElevenLabs API calls (for testing UI)
   */
  MOCK_VOICE_CLONE: false,

  /**
   * When true, skips actual Gemini API calls (for testing UI)
   */
  MOCK_STORY_GENERATION: false,
} as const;
