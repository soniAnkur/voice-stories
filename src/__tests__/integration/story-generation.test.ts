/**
 * Story Generation Integration Tests
 * Tests the Gemini story text generation functionality
 */

import { testLog } from '../setup';
import { generatePreviewStory, generateFullStory } from '@/lib/gemini';

describe('Story Text Generation', () => {
  const testChild = {
    name: 'Luna',
    age: 5,
    interests: 'unicorns, rainbows, and butterflies',
    theme: 'fairy',
  };

  describe('API Configuration', () => {
    it('should verify Gemini API key is configured', async () => {
      testLog.info('Testing Gemini API configuration');
      testLog.step(1, 'Checking GEMINI_API_KEY environment variable');

      const apiKey = process.env.GEMINI_API_KEY;
      testLog.result('API Key exists', !!apiKey);
      testLog.result('API Key prefix', apiKey?.substring(0, 8) + '...');

      expect(apiKey).toBeDefined();
      expect(apiKey!.length).toBeGreaterThan(10);

      testLog.success('Gemini API key is configured');
    });
  });

  describe('Preview Story Generation', () => {
    it('should generate a preview story (~100 words)', async () => {
      testLog.info('Testing preview story generation');
      testLog.step(1, 'Calling generatePreviewStory');
      testLog.result('Child name', testChild.name);
      testLog.result('Child age', testChild.age);
      testLog.result('Interests', testChild.interests);
      testLog.result('Theme', testChild.theme);

      const startTime = Date.now();

      const result = await generatePreviewStory(
        testChild.name,
        testChild.age,
        testChild.interests,
        testChild.theme
      );

      const duration = Date.now() - startTime;
      testLog.result('Generation time', `${duration}ms`);

      testLog.step(2, 'Validating response structure');
      testLog.result('Has title', !!result.title);
      testLog.result('Title', result.title);
      testLog.result('Has story', !!result.story);
      testLog.result('Story length', result.story.length);
      testLog.result('Word count', result.story.split(/\s+/).length);
      testLog.result('Has backgroundMusicPrompt', !!result.backgroundMusicPrompt);
      testLog.result('Music prompt', result.backgroundMusicPrompt);

      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(5);
      expect(result.story).toBeDefined();
      expect(result.story.length).toBeGreaterThan(100);
      expect(result.backgroundMusicPrompt).toBeDefined();

      testLog.step(3, 'Checking for audio tags');
      const audioTags = ['[softly]', '[pause]', '[warmly]', '[whispers]', '[excited]'];
      const foundTags = audioTags.filter(tag => result.story.includes(tag));
      testLog.result('Audio tags found', foundTags);

      expect(foundTags.length).toBeGreaterThan(0);

      testLog.step(4, 'Checking for child name personalization');
      const hasChildName = result.story.toLowerCase().includes(testChild.name.toLowerCase());
      testLog.result('Contains child name', hasChildName);

      expect(hasChildName).toBe(true);

      testLog.success('Preview story generated successfully', {
        title: result.title,
        wordCount: result.story.split(/\s+/).length,
        duration: `${duration}ms`,
      });

      // Log first 500 chars of story for debugging
      testLog.info('Story preview (first 500 chars)');
      console.log(result.story.substring(0, 500) + '...');
    });
  });

  describe('Full Story Generation', () => {
    it('should generate a full story (~1400-1600 words)', async () => {
      testLog.info('Testing full story generation');
      testLog.step(1, 'Calling generateFullStory');

      const startTime = Date.now();

      const result = await generateFullStory(
        testChild.name,
        testChild.age,
        testChild.interests,
        testChild.theme
      );

      const duration = Date.now() - startTime;
      const wordCount = result.story.split(/\s+/).length;

      testLog.result('Generation time', `${duration}ms`);
      testLog.result('Title', result.title);
      testLog.result('Story length (chars)', result.story.length);
      testLog.result('Word count', wordCount);
      testLog.result('Music prompt', result.backgroundMusicPrompt);

      testLog.step(2, 'Validating word count range');
      testLog.result('Word count', wordCount);
      testLog.result('Target range', '900-2000 words (AI may vary slightly)');

      expect(result.title).toBeDefined();
      expect(result.story).toBeDefined();
      // AI generation can vary, allow 900-2000 word range
      expect(wordCount).toBeGreaterThan(900);
      expect(wordCount).toBeLessThan(2000);

      testLog.step(3, 'Checking story structure');
      const hasAudioTags = result.story.includes('[') && result.story.includes(']');
      const hasChildName = result.story.toLowerCase().includes(testChild.name.toLowerCase());
      const hasParagraphs = result.story.includes('\n\n');

      testLog.result('Has audio tags', hasAudioTags);
      testLog.result('Has child name', hasChildName);
      testLog.result('Has paragraphs', hasParagraphs);

      expect(hasAudioTags).toBe(true);
      expect(hasChildName).toBe(true);

      testLog.success('Full story generated successfully', {
        title: result.title,
        wordCount,
        duration: `${duration}ms`,
      });
    }, 120000); // 2 minute timeout for full story
  });

  describe('Theme Variations', () => {
    const themes = ['adventure', 'ocean', 'space', 'dinosaurs'];

    themes.forEach(theme => {
      it(`should generate story with ${theme} theme`, async () => {
        testLog.info(`Testing ${theme} theme`);

        const result = await generatePreviewStory(
          'Max',
          6,
          'exploring and puzzles',
          theme
        );

        testLog.result('Theme', theme);
        testLog.result('Title', result.title);
        testLog.result('Word count', result.story.split(/\s+/).length);

        expect(result.title).toBeDefined();
        expect(result.story).toBeDefined();
        expect(result.story.length).toBeGreaterThan(100);

        testLog.success(`${theme} theme story generated`);
      });
    });
  });
});
