/**
 * Kie.ai Image Integration Tests
 * Tests the Kie.ai 4o Image API functionality
 */

import { testLog } from '../setup';
import { isKieImageConfigured, kieGenerateImage, kieGenerateCoverImage, kieGenerateProfileImage } from '@/lib/kie-image';

describe('Kie.ai Image Integration', () => {
  describe('Configuration', () => {
    it('should check if Kie.ai Image is configured', async () => {
      testLog.info('Checking Kie.ai Image configuration');

      testLog.step(1, 'Checking KIE_API_KEY environment variable');
      const isConfigured = isKieImageConfigured();
      testLog.result('Kie.ai Image configured', isConfigured);

      if (!isConfigured) {
        testLog.info('SKIPPED: KIE_API_KEY not set - Kie.ai Image tests will be skipped');
        console.log('To enable Kie.ai Image tests, set KIE_API_KEY in .env.local');
      }

      expect(typeof isConfigured).toBe('boolean');
      testLog.success('Configuration check complete');
    });
  });

  describe('Image Generation via Kie.ai', () => {
    it('should generate an image via Kie.ai 4o Image API', async () => {
      testLog.info('Testing Kie.ai Image generation');

      if (!isKieImageConfigured()) {
        testLog.info('SKIPPED: KIE_API_KEY not configured');
        console.log('SKIPPED: KIE_API_KEY not configured - set it in .env.local to test');
        return;
      }

      const testPrompt = 'A magical nighttime forest with glowing mushrooms and fireflies, children\'s book illustration style';

      testLog.step(1, 'Preparing Kie.ai Image request');
      testLog.result('Prompt', testPrompt.substring(0, 50) + '...');

      testLog.step(2, 'Calling Kie.ai 4o Image API');
      const startTime = Date.now();

      try {
        const imageBuffer = await kieGenerateImage(testPrompt, {
          size: '1:1',
          nVariants: 1,
        });

        const duration = Date.now() - startTime;
        testLog.result('Generation time', `${duration}ms`);

        if (imageBuffer) {
          testLog.result('Image buffer size', `${(imageBuffer.length / 1024).toFixed(0)}KB`);

          testLog.step(3, 'Validating image format');
          // Check for PNG or JPEG magic bytes
          const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
          const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
          const isValidImage = isPNG || isJPEG;

          testLog.result('First bytes (hex)', imageBuffer.slice(0, 4).toString('hex'));
          testLog.result('Is valid image', isValidImage);

          expect(imageBuffer).toBeInstanceOf(Buffer);
          expect(imageBuffer.length).toBeGreaterThan(10000);
          expect(isValidImage).toBe(true);

          testLog.success('Kie.ai Image generated successfully', {
            size: `${(imageBuffer.length / 1024).toFixed(0)}KB`,
            duration: `${duration}ms`,
          });
        } else {
          testLog.info('Image generation returned null');
        }
      } catch (error) {
        if (error instanceof Error) {
          testLog.error('Kie.ai Image failed', error.message);
          if (error.message.includes('quota') || error.message.includes('rate') || error.message.includes('credit')) {
            console.log('SKIPPED: Kie.ai quota/rate/credit limit exceeded');
            return;
          }
        }
        throw error;
      }
    }, 120000); // 2 minute timeout for async task

    it('should generate a story cover image', async () => {
      testLog.info('Testing Kie.ai cover image generation');

      if (!isKieImageConfigured()) {
        testLog.info('SKIPPED: KIE_API_KEY not configured');
        return;
      }

      testLog.step(1, 'Generating cover image');
      const startTime = Date.now();

      try {
        const imageBuffer = await kieGenerateCoverImage('Luna', 5, 'unicorns and rainbows', 'fairy');
        const duration = Date.now() - startTime;

        testLog.result('Generation time', `${duration}ms`);

        if (imageBuffer) {
          testLog.result('Image size', `${(imageBuffer.length / 1024).toFixed(0)}KB`);
          expect(imageBuffer.length).toBeGreaterThan(10000);
          testLog.success('Cover image generated via Kie.ai');
        } else {
          testLog.info('Cover image generation returned null');
        }
      } catch (error) {
        if (error instanceof Error && (error.message.includes('quota') || error.message.includes('credit'))) {
          console.log('SKIPPED: Kie.ai quota/credit limit exceeded');
          return;
        }
        throw error;
      }
    }, 120000);

    it('should generate a profile avatar', async () => {
      testLog.info('Testing Kie.ai profile avatar generation');

      if (!isKieImageConfigured()) {
        testLog.info('SKIPPED: KIE_API_KEY not configured');
        return;
      }

      testLog.step(1, 'Generating profile avatar');
      const startTime = Date.now();

      try {
        const imageBuffer = await kieGenerateProfileImage('test@example.com');
        const duration = Date.now() - startTime;

        testLog.result('Generation time', `${duration}ms`);

        if (imageBuffer) {
          testLog.result('Image size', `${(imageBuffer.length / 1024).toFixed(0)}KB`);
          expect(imageBuffer.length).toBeGreaterThan(5000);
          testLog.success('Profile avatar generated via Kie.ai');
        } else {
          testLog.info('Profile avatar generation returned null');
        }
      } catch (error) {
        if (error instanceof Error && (error.message.includes('quota') || error.message.includes('credit'))) {
          console.log('SKIPPED: Kie.ai quota/credit limit exceeded');
          return;
        }
        throw error;
      }
    }, 120000);
  });

  describe('Provider Fallback', () => {
    it('should verify Gemini fallback is available', async () => {
      testLog.info('Verifying Gemini fallback configuration');

      testLog.step(1, 'Checking GEMINI_API_KEY');
      const hasGemini = !!process.env.GEMINI_API_KEY;
      testLog.result('Gemini configured', hasGemini);

      expect(hasGemini).toBe(true);

      testLog.step(2, 'Checking IMAGE_PROVIDER setting');
      const provider = process.env.IMAGE_PROVIDER || (isKieImageConfigured() ? 'kie' : 'gemini');
      testLog.result('Current Image provider', provider);

      testLog.success('Fallback configuration verified');
    });
  });
});
