/**
 * Voice Presets Integration Tests
 * Tests the voice presets library and selection functionality
 */

import { testLog } from '../setup';
import {
  VOICE_PRESETS,
  getVoicePresets,
  getVoicePresetById,
  getDefaultVoicePreset,
  getVoicePresetsByStyle,
  getVoicePresetsByGender,
  isPresetVoice,
  getEffectiveVoiceId,
} from '@/lib/voices';

describe('Voice Presets', () => {
  describe('Voice Library', () => {
    it('should have a populated voice presets library', async () => {
      testLog.info('Testing voice presets library availability');

      testLog.step(1, 'Getting all voice presets');
      const voices = getVoicePresets();

      testLog.result('Total presets', voices.length);
      testLog.result('Preset names', voices.map(v => v.name).join(', '));

      expect(voices.length).toBeGreaterThan(0);
      expect(voices.length).toBe(VOICE_PRESETS.length);

      testLog.success('Voice presets library is properly configured');
    });

    it('should have a default voice preset', async () => {
      testLog.info('Testing default voice preset');

      testLog.step(1, 'Getting default preset');
      const defaultVoice = getDefaultVoicePreset();

      testLog.result('Default voice name', defaultVoice.name);
      testLog.result('Default voice ID', defaultVoice.id);
      testLog.result('Is marked as default', defaultVoice.isDefault);

      expect(defaultVoice).toBeDefined();
      expect(defaultVoice.isDefault).toBe(true);
      expect(defaultVoice.id).toBeTruthy();

      testLog.success('Default voice preset verified');
    });

    it('should have all required fields for each preset', async () => {
      testLog.info('Verifying voice preset structure');

      testLog.step(1, 'Checking required fields');
      const voices = getVoicePresets();

      for (const voice of voices) {
        expect(voice.id).toBeTruthy();
        expect(voice.name).toBeTruthy();
        expect(voice.description).toBeTruthy();
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
        expect(['storyteller', 'nurturing', 'calming', 'playful']).toContain(voice.style);
        expect(voice.previewUrl).toBeTruthy();
        expect(typeof voice.isDefault).toBe('boolean');

        testLog.result(voice.name, `${voice.gender}, ${voice.style}`);
      }

      testLog.success('All voice presets have valid structure');
    });
  });

  describe('Voice Retrieval', () => {
    it('should get voice preset by valid ID', async () => {
      testLog.info('Testing voice preset retrieval by ID');

      const testId = VOICE_PRESETS[0].id;
      testLog.step(1, `Getting preset: ${testId}`);

      const voice = getVoicePresetById(testId);

      testLog.result('Voice found', !!voice);
      testLog.result('Voice name', voice?.name);

      expect(voice).toBeDefined();
      expect(voice?.id).toBe(testId);

      testLog.success('Voice retrieved by ID');
    });

    it('should return null for invalid ID', async () => {
      testLog.info('Testing invalid ID handling');

      testLog.step(1, 'Getting non-existent preset');
      const voice = getVoicePresetById('invalid-voice-id-12345');

      testLog.result('Voice result', voice);

      expect(voice).toBeNull();

      testLog.success('Correctly returned null for invalid ID');
    });
  });

  describe('Voice Filtering', () => {
    it('should filter voices by style', async () => {
      testLog.info('Testing voice filtering by style');

      const styles = ['storyteller', 'nurturing', 'calming', 'playful'] as const;

      for (const style of styles) {
        testLog.step(styles.indexOf(style) + 1, `Filtering by style: ${style}`);
        const voices = getVoicePresetsByStyle(style);

        testLog.result(`${style} voices`, voices.length);
        testLog.result('Names', voices.map(v => v.name).join(', ') || 'none');

        for (const voice of voices) {
          expect(voice.style).toBe(style);
        }
      }

      testLog.success('Style filtering works correctly');
    });

    it('should filter voices by gender', async () => {
      testLog.info('Testing voice filtering by gender');

      const genders = ['male', 'female'] as const;

      for (const gender of genders) {
        testLog.step(genders.indexOf(gender) + 1, `Filtering by gender: ${gender}`);
        const voices = getVoicePresetsByGender(gender);

        testLog.result(`${gender} voices`, voices.length);
        testLog.result('Names', voices.map(v => v.name).join(', '));

        expect(voices.length).toBeGreaterThan(0);
        for (const voice of voices) {
          expect(voice.gender).toBe(gender);
        }
      }

      testLog.success('Gender filtering works correctly');
    });
  });

  describe('Voice Type Detection', () => {
    it('should correctly identify preset voices', async () => {
      testLog.info('Testing preset voice identification');

      const presetId = VOICE_PRESETS[0].id;
      const customId = 'custom-cloned-voice-id';

      testLog.step(1, 'Checking preset voice ID');
      testLog.result('Preset ID', presetId);
      testLog.result('Is preset', isPresetVoice(presetId));

      testLog.step(2, 'Checking custom voice ID');
      testLog.result('Custom ID', customId);
      testLog.result('Is preset', isPresetVoice(customId));

      expect(isPresetVoice(presetId)).toBe(true);
      expect(isPresetVoice(customId)).toBe(false);

      testLog.success('Preset voice detection works correctly');
    });
  });

  describe('Effective Voice Selection', () => {
    it('should return cloned voice when voice type is cloned', async () => {
      testLog.info('Testing effective voice selection - cloned');

      const clonedId = 'user-cloned-voice-123';
      const presetId = VOICE_PRESETS[0].id;

      testLog.step(1, 'Getting effective voice for cloned type');
      const effectiveId = getEffectiveVoiceId('cloned', clonedId, presetId);

      testLog.result('Effective voice ID', effectiveId);
      testLog.result('Expected (cloned ID)', clonedId);

      expect(effectiveId).toBe(clonedId);

      testLog.success('Cloned voice selection works');
    });

    it('should return preset voice when voice type is preset', async () => {
      testLog.info('Testing effective voice selection - preset');

      const clonedId = 'user-cloned-voice-123';
      const presetId = VOICE_PRESETS[0].id;

      testLog.step(1, 'Getting effective voice for preset type');
      const effectiveId = getEffectiveVoiceId('preset', clonedId, presetId);

      testLog.result('Effective voice ID', effectiveId);
      testLog.result('Expected (preset ID)', presetId);

      expect(effectiveId).toBe(presetId);

      testLog.success('Preset voice selection works');
    });

    it('should return default preset when no voice is configured', async () => {
      testLog.info('Testing effective voice selection - fallback');

      testLog.step(1, 'Getting effective voice with no voices configured');
      const effectiveId = getEffectiveVoiceId('cloned', undefined, undefined);

      const defaultPreset = getDefaultVoicePreset();
      testLog.result('Effective voice ID', effectiveId);
      testLog.result('Default preset ID', defaultPreset.id);

      expect(effectiveId).toBe(defaultPreset.id);

      testLog.success('Fallback to default preset works');
    });
  });
});
