/**
 * Voice Cloning Integration Tests
 * Tests the ElevenLabs voice cloning functionality
 */

import { testLog } from '../setup';
import { cloneVoice, getVoice } from '@/lib/elevenlabs';
import fs from 'fs';
import path from 'path';

describe('Voice Cloning', () => {
  // Test voice ID created during tests (for cleanup)
  let testVoiceId: string | null = null;

  afterAll(async () => {
    // Note: We don't auto-delete test voices as they cost credits to create
    if (testVoiceId) {
      testLog.info(`Test voice created: ${testVoiceId}`);
      testLog.info('To delete manually, use deleteVoice() or ElevenLabs dashboard');
    }
  });

  describe('Voice Creation', () => {
    it('should verify ElevenLabs API key is configured', async () => {
      testLog.info('Testing ElevenLabs API configuration');
      testLog.step(1, 'Checking ELEVENLABS_API_KEY environment variable');

      const apiKey = process.env.ELEVENLABS_API_KEY;
      testLog.result('API Key exists', !!apiKey);
      testLog.result('API Key length', apiKey?.length || 0);

      expect(apiKey).toBeDefined();
      expect(apiKey!.length).toBeGreaterThan(10);

      testLog.success('ElevenLabs API key is configured');
    });

    it('should fetch an existing voice to verify API connectivity', async () => {
      testLog.info('Testing API connectivity by fetching a voice');

      // Use a known voice ID (Adam - default ElevenLabs voice)
      const knownVoiceId = 'pNInz6obpgDQGcFmaJgB';
      testLog.step(1, `Fetching voice info for ID: ${knownVoiceId}`);

      const voice = await getVoice(knownVoiceId);
      testLog.result('Voice found', !!voice);
      testLog.result('Voice name', voice?.name);

      expect(voice).toBeDefined();
      expect(voice?.name).toContain('Adam'); // Name may include description

      testLog.success('API connectivity verified - can fetch voice info');
    });

    // Note: Actual voice cloning test is skipped by default as it:
    // 1. Consumes API credits
    // 2. Requires a valid audio sample
    // 3. Creates permanent voices in your account
    it.skip('should clone voice from audio sample (requires test audio file)', async () => {
      testLog.info('Testing voice cloning from audio sample');

      // Path to test audio file (you need to create this)
      const testAudioPath = path.join(process.cwd(), 'test-data', 'voice-sample.mp3');
      testLog.step(1, `Loading test audio from: ${testAudioPath}`);

      if (!fs.existsSync(testAudioPath)) {
        testLog.error('Test audio file not found', { path: testAudioPath });
        throw new Error(`Test audio file not found: ${testAudioPath}. Create a 30-60 second MP3 recording.`);
      }

      const audioBuffer = fs.readFileSync(testAudioPath);
      testLog.result('Audio buffer size', `${(audioBuffer.length / 1024).toFixed(0)}KB`);

      testLog.step(2, 'Calling cloneVoice API');
      const startTime = Date.now();

      const voiceId = await cloneVoice(audioBuffer, 'Test Voice - Integration');

      const duration = Date.now() - startTime;
      testLog.result('Clone duration', `${duration}ms`);
      testLog.result('Voice ID', voiceId);

      expect(voiceId).toBeDefined();
      expect(voiceId.length).toBeGreaterThan(10);

      testVoiceId = voiceId;

      testLog.step(3, 'Verifying cloned voice exists');
      const voice = await getVoice(voiceId);
      testLog.result('Voice name', voice?.name);

      expect(voice).toBeDefined();

      testLog.success('Voice cloned successfully', { voiceId, duration: `${duration}ms` });
    });
  });

  describe('Error Handling', () => {
    it('should return null for non-existent voice ID', async () => {
      testLog.info('Testing error handling for invalid voice ID');

      const fakeVoiceId = 'invalid_voice_id_12345';
      testLog.step(1, `Attempting to fetch invalid voice: ${fakeVoiceId}`);

      const voice = await getVoice(fakeVoiceId);
      testLog.result('Voice result', voice);

      expect(voice).toBeNull();

      testLog.success('Correctly returned null for invalid voice ID');
    });
  });
});
