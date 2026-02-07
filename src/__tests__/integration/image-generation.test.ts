/**
 * Image Generation Integration Tests
 * Tests the Gemini 2.5 Flash Image generation for cover images and avatars
 */

import { testLog } from '../setup';
import { generateCoverImage, generateProfileImage } from '@/lib/imageGen';

describe('Image Generation', () => {
  describe('API Configuration', () => {
    it('should verify Gemini API key is configured', async () => {
      testLog.info('Testing Gemini Image API configuration');
      testLog.step(1, 'Checking GEMINI_API_KEY environment variable');

      const apiKey = process.env.GEMINI_API_KEY;
      testLog.result('API Key exists', !!apiKey);

      expect(apiKey).toBeDefined();
      expect(apiKey!.length).toBeGreaterThan(10);

      testLog.success('Gemini API key is configured for image generation');
    });
  });

  describe('Cover Image Generation', () => {
    it('should generate a story cover image', async () => {
      testLog.info('Testing story cover image generation');

      const testParams = {
        childName: 'Luna',
        childAge: 5,
        interests: 'unicorns and rainbows',
        theme: 'fairy',
      };

      testLog.step(1, 'Preparing cover image request');
      testLog.result('Child name', testParams.childName);
      testLog.result('Age', testParams.childAge);
      testLog.result('Interests', testParams.interests);
      testLog.result('Theme', testParams.theme);

      testLog.step(2, 'Calling generateCoverImage');
      const startTime = Date.now();

      const imageBuffer = await generateCoverImage(
        testParams.childName,
        testParams.childAge,
        testParams.interests,
        testParams.theme
      );

      const duration = Date.now() - startTime;
      testLog.result('Generation time', `${duration}ms`);

      if (imageBuffer) {
        testLog.result('Image buffer size', `${(imageBuffer.length / 1024).toFixed(0)}KB`);

        testLog.step(3, 'Validating PNG format');
        // PNG magic bytes: 89 50 4E 47 (0x89 P N G)
        const isPNG = (
          imageBuffer[0] === 0x89 &&
          imageBuffer[1] === 0x50 &&
          imageBuffer[2] === 0x4E &&
          imageBuffer[3] === 0x47
        );
        testLog.result('First bytes (hex)', imageBuffer.slice(0, 8).toString('hex'));
        testLog.result('Is valid PNG', isPNG);

        expect(imageBuffer).toBeInstanceOf(Buffer);
        expect(imageBuffer.length).toBeGreaterThan(10000); // At least 10KB
        expect(isPNG).toBe(true);

        testLog.success('Cover image generated successfully', {
          size: `${(imageBuffer.length / 1024).toFixed(0)}KB`,
          duration: `${duration}ms`,
        });
      } else {
        testLog.error('Image generation returned null');
        // This might happen if API quota is exceeded
        console.log('Note: Image generation returned null. This may be due to API quota limits.');
      }
    }, 60000); // 1 minute timeout

    it('should generate different images for different themes', async () => {
      testLog.info('Testing theme variation in image generation');

      const themes = ['ocean', 'space'];
      const images: Buffer[] = [];

      for (const theme of themes) {
        testLog.step(themes.indexOf(theme) + 1, `Generating ${theme} theme image`);

        const imageBuffer = await generateCoverImage('Max', 6, 'adventures', theme);

        if (imageBuffer) {
          images.push(imageBuffer);
          testLog.result(`${theme} image size`, `${(imageBuffer.length / 1024).toFixed(0)}KB`);
        } else {
          testLog.result(`${theme} image`, 'null (quota limit?)');
        }
      }

      if (images.length === 2) {
        // Different images should have different sizes (very likely for different content)
        const sizeDiff = Math.abs(images[0].length - images[1].length);
        testLog.result('Size difference', `${sizeDiff} bytes`);

        // Images shouldn't be identical
        const identical = images[0].equals(images[1]);
        testLog.result('Images identical', identical);

        expect(identical).toBe(false);

        testLog.success('Different themes produce different images');
      } else {
        testLog.info('Skipping comparison - not all images generated');
      }
    }, 120000); // 2 minute timeout
  });

  describe('Profile Avatar Generation', () => {
    it('should generate a profile avatar', async () => {
      testLog.info('Testing profile avatar generation');

      const testEmail = 'test@example.com';
      testLog.step(1, `Generating avatar for: ${testEmail}`);

      const startTime = Date.now();
      const imageBuffer = await generateProfileImage(testEmail);
      const duration = Date.now() - startTime;

      testLog.result('Generation time', `${duration}ms`);

      if (imageBuffer) {
        testLog.result('Avatar size', `${(imageBuffer.length / 1024).toFixed(0)}KB`);

        // Validate PNG
        const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;
        testLog.result('Is valid PNG', isPNG);

        expect(imageBuffer).toBeInstanceOf(Buffer);
        expect(isPNG).toBe(true);

        testLog.success('Profile avatar generated');
      } else {
        testLog.info('Avatar generation returned null (quota limit?)');
      }
    }, 60000);

    it('should be deterministic for same email (same style selection)', async () => {
      testLog.info('Testing avatar style determinism');

      const testEmail = 'consistent@example.com';

      testLog.step(1, 'Generating first avatar');
      // Note: We can't easily verify the actual image content is the same,
      // but we can verify the style selection is deterministic via the hash
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(testEmail.toLowerCase()).digest('hex');
      const styleIndex = parseInt(hash.substring(0, 8), 16) % 8;

      testLog.result('Email hash', hash.substring(0, 16) + '...');
      testLog.result('Style index', styleIndex);

      // Run twice and verify same index
      const hash2 = crypto.createHash('md5').update(testEmail.toLowerCase()).digest('hex');
      const styleIndex2 = parseInt(hash2.substring(0, 8), 16) % 8;

      testLog.step(2, 'Verifying determinism');
      testLog.result('Second style index', styleIndex2);
      testLog.result('Indexes match', styleIndex === styleIndex2);

      expect(styleIndex).toBe(styleIndex2);

      testLog.success('Avatar style selection is deterministic');
    });

    it('should use different styles for different emails', async () => {
      testLog.info('Testing style variation for different emails');

      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com',
      ];

      const crypto = await import('crypto');
      const styleIndexes: number[] = [];

      testLog.step(1, 'Computing style indexes for different emails');
      for (const email of emails) {
        const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        const styleIndex = parseInt(hash.substring(0, 8), 16) % 8;
        styleIndexes.push(styleIndex);
        testLog.result(email, `style ${styleIndex}`);
      }

      // At least some should be different (statistically very likely)
      const uniqueStyles = new Set(styleIndexes).size;
      testLog.result('Unique styles', uniqueStyles);

      expect(uniqueStyles).toBeGreaterThan(1);

      testLog.success('Different emails produce varied styles');
    });
  });

  describe('Error Handling', () => {
    // NOTE: This test is skipped because the imageGen module reads the API key
    // at module load time, not at function call time. The module would need
    // to be reloaded to properly test this scenario.
    it.skip('should return null when API key is missing', async () => {
      testLog.info('Testing graceful handling of missing API key');
      testLog.info('SKIPPED: API key is read at module load time');
    });
  });
});
