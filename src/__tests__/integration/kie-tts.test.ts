/**
 * Kie.ai TTS Integration Tests
 * Tests the Kie.ai ElevenLabs proxy functionality
 */

import { testLog } from '../setup';
import { isKieConfigured, kieTextToSpeech } from '@/lib/kie';

describe('Kie.ai TTS Integration', () => {
  const testVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice (ElevenLabs preset)

  describe('Configuration', () => {
    it('should check if Kie.ai is configured', async () => {
      testLog.info('Checking Kie.ai configuration');

      testLog.step(1, 'Checking KIE_API_KEY environment variable');
      const isConfigured = isKieConfigured();
      testLog.result('Kie.ai configured', isConfigured);

      if (!isConfigured) {
        testLog.info('SKIPPED: KIE_API_KEY not set - Kie.ai tests will be skipped');
        console.log('To enable Kie.ai tests, set KIE_API_KEY in .env.local');
      }

      // This test passes regardless - it just reports the configuration state
      expect(typeof isConfigured).toBe('boolean');

      testLog.success('Configuration check complete');
    });
  });

  describe('Text-to-Speech via Kie.ai', () => {
    it('should generate audio via Kie.ai ElevenLabs proxy', async () => {
      testLog.info('Testing Kie.ai TTS');

      if (!isKieConfigured()) {
        testLog.info('SKIPPED: KIE_API_KEY not configured');
        console.log('SKIPPED: KIE_API_KEY not configured - set it in .env.local to test');
        return;
      }

      const testText = 'Once upon a time, in a magical kingdom, a brave little hero began their adventure.';

      testLog.step(1, 'Preparing Kie.ai TTS request');
      testLog.result('Voice ID', testVoiceId);
      testLog.result('Text length', testText.length);

      testLog.step(2, 'Calling Kie.ai TTS API');
      const startTime = Date.now();

      try {
        const audioBuffer = await kieTextToSpeech(testText, testVoiceId, {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 0.7,
        });

        const duration = Date.now() - startTime;
        testLog.result('TTS duration', `${duration}ms`);
        testLog.result('Audio buffer size', `${(audioBuffer.length / 1024).toFixed(2)}KB`);

        testLog.step(3, 'Validating MP3 buffer');
        const isMP3 = (
          (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0) ||
          (audioBuffer[0] === 0x49 && audioBuffer[1] === 0x44 && audioBuffer[2] === 0x33)
        );
        testLog.result('First bytes (hex)', audioBuffer.slice(0, 4).toString('hex'));
        testLog.result('Is valid MP3', isMP3);

        expect(audioBuffer).toBeInstanceOf(Buffer);
        expect(audioBuffer.length).toBeGreaterThan(1000);
        expect(isMP3).toBe(true);

        testLog.success('Kie.ai TTS generated successfully', {
          bufferSize: `${(audioBuffer.length / 1024).toFixed(2)}KB`,
          duration: `${duration}ms`,
        });
      } catch (error) {
        if (error instanceof Error) {
          testLog.error('Kie.ai TTS failed', error.message);
          // If quota exceeded or rate limited, pass the test gracefully
          if (error.message.includes('quota') || error.message.includes('rate')) {
            console.log('SKIPPED: Kie.ai quota/rate limit exceeded');
            return;
          }
        }
        throw error;
      }
    }, 90000); // 90 second timeout for async task

    it('should use preset voice names', async () => {
      testLog.info('Testing Kie.ai with preset voice name');

      if (!isKieConfigured()) {
        testLog.info('SKIPPED: KIE_API_KEY not configured');
        return;
      }

      const presetVoice = 'Rachel'; // Common ElevenLabs preset
      const testText = 'Hello, this is a test of the preset voice.';

      testLog.step(1, 'Testing with preset voice: ' + presetVoice);

      try {
        const startTime = Date.now();
        const audioBuffer = await kieTextToSpeech(testText, presetVoice, {
          stability: 0.5,
          similarity_boost: 0.75,
        });
        const duration = Date.now() - startTime;

        testLog.result('Audio size', `${(audioBuffer.length / 1024).toFixed(2)}KB`);
        testLog.result('Duration', `${duration}ms`);

        expect(audioBuffer.length).toBeGreaterThan(500);

        testLog.success('Preset voice works via Kie.ai');
      } catch (error) {
        if (error instanceof Error && (error.message.includes('quota') || error.message.includes('rate'))) {
          console.log('SKIPPED: Kie.ai quota/rate limit exceeded');
          return;
        }
        throw error;
      }
    }, 90000);
  });

  describe('Provider Fallback', () => {
    it('should verify ElevenLabs fallback is available', async () => {
      testLog.info('Verifying ElevenLabs fallback configuration');

      testLog.step(1, 'Checking ELEVENLABS_API_KEY');
      const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;
      testLog.result('ElevenLabs configured', hasElevenLabs);

      expect(hasElevenLabs).toBe(true);

      testLog.step(2, 'Checking TTS_PROVIDER setting');
      const provider = process.env.TTS_PROVIDER || (isKieConfigured() ? 'kie' : 'elevenlabs');
      testLog.result('Current TTS provider', provider);

      testLog.success('Fallback configuration verified');
    });
  });
});
