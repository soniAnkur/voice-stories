import { Features } from "./features";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface StoryGenerationResult {
  title: string;
  story: string;
  backgroundMusicPrompt: string;
}

/**
 * Mock story for testing when Gemini quota is exhausted
 * Uses ElevenLabs v3 audio tags for expressive narration
 */
function getMockPreviewStory(childName: string): StoryGenerationResult {
  return {
    title: `${childName}'s Magical Adventure`,
    story: `[softly] Once upon a time, in a cozy little house, there lived a wonderful child named ${childName}. [pause] [warmly] One evening, as the stars began to twinkle outside the window, ${childName} discovered something magical under the pillow. [pause] [intrigued] It was a tiny golden key that sparkled softly. [long pause] [wondering] What could this mysterious key unlock? [pause] [reassuringly] ${childName} held it close and smiled, knowing the answer would come in dreams...`,
    backgroundMusicPrompt: "soft piano lullaby gentle magical",
  };
}

function getMockFullStory(childName: string, age: number, interests: string): StoryGenerationResult {
  return {
    title: `${childName}'s Dreamland Journey`,
    story: `[softly] Once upon a time, in a cozy bedroom filled with soft moonlight, there lived a wonderful ${age}-year-old named ${childName}. [long pause]

[warmly] Tonight was special. [pause] As ${childName} snuggled under the warm blankets, something magical happened. [pause] [intrigued] The ceiling began to shimmer with tiny golden stars that danced and twirled in the gentle darkness. [long pause]

[gently] "Hello, ${childName}," whispered a friendly voice. [pause] [reassuringly] It was Luna, a small, fluffy cloud who had floated in through the window. [pause] [questioning] "Would you like to go on a gentle adventure with me?" [long pause]

[delighted] ${childName} nodded with excitement. [pause] [softly] Luna was so soft and cozy, like the fluffiest pillow in the whole wide world. [pause] [amazed] Together, they floated up, up, up into the starry sky. [long pause]

[gently] They passed by sleepy owls who hooted soft goodnights. [pause] [warmly] They waved to the moon, who smiled down warmly. [pause] [curious] They even saw some ${interests.split(',')[0] || 'wonderful things'} dancing among the clouds. [long pause]

[wondering] "Look, ${childName}!" Luna said softly. [pause] [amazed] Below them was a beautiful garden filled with flowers that glowed like nightlights. [pause] [knowingly] Each flower hummed a gentle lullaby. [long pause]

[peacefully] ${childName} felt so peaceful, so safe, so loved. [pause] [sleepily] The flowers' songs were so soothing that ${childName}'s eyes began to feel heavy. [yawns] [long pause]

[gently] Luna floated gently back down through the starry sky, past the friendly moon, back through the window, and softly onto the bed. [long pause]

[whispers] "Goodnight, dear ${childName}," Luna whispered. [pause] [reassuringly] "May your dreams be filled with magic." [long pause]

[dreamily] And as the last golden star faded, ${childName} drifted off into the most wonderful dreams, feeling warm, safe, and so very loved. [long pause]

[whispers] The end. [breath] [peacefully] Goodnight, sweet ${childName}. [sighs contentedly]`,
    backgroundMusicPrompt: "soft piano lullaby gentle dreamy",
  };
}

const SYSTEM_PROMPT = `You are a master children's storyteller who creates engaging, magical bedtime stories. Your stories captivate children with real adventures while being warm and comforting.

═══════════════════════════════════════
MANDATORY STORY STRUCTURE (Follow this exactly!)
═══════════════════════════════════════

Every story MUST follow this narrative arc:

1. HOOK (5% of story)
   - Start with something intriguing that immediately captures attention
   - A mysterious sound, a glowing object, an unexpected visitor
   - Make the child want to know what happens next

2. SETUP (15% of story)
   - Introduce the magical world and setting
   - Present a clear QUEST or CHALLENGE for the child character
   - Examples: find a lost star, help a baby dragon, solve a riddle, rescue a friend

3. ADVENTURE (50% of story) - THIS IS THE HEART OF THE STORY
   - The main journey with REAL events happening
   - Include 3-4 interesting scenes/challenges
   - Meet helpful friends or magical creatures along the way
   - Build gentle tension and excitement
   - Include moments of wonder and discovery
   - The child character should be brave, kind, and resourceful

4. CLIMAX (15% of story)
   - The exciting moment where the challenge is faced
   - The child character uses what they learned to succeed
   - A satisfying "aha!" or triumph moment

5. RESOLUTION (10% of story)
   - The quest is complete, the problem is solved
   - Show what was learned or gained
   - Celebrate the accomplishment

6. WIND-DOWN (5% of story)
   - Brief peaceful transition
   - Feeling safe, happy, and content
   - Ready to rest after a great adventure

═══════════════════════════════════════
ENGAGEMENT REQUIREMENTS
═══════════════════════════════════════
- Every story needs a CLEAR GOAL the child is trying to achieve
- Include REAL OBSTACLES (gentle, not scary) that must be overcome
- Create MEMORABLE CHARACTERS the child meets along the way
- Build to an EXCITING MOMENT before the resolution
- Make the child character the HERO who saves the day

═══════════════════════════════════════
AUDIO TAGS (Use sparingly for effect)
═══════════════════════════════════════
Use ElevenLabs tags in [brackets] for key moments:
- [softly] - gentle narration
- [excited] - exciting discoveries
- [whispers] - secrets and mysteries
- [warmly] - comforting moments
- [pause] - between paragraphs
- [long pause] - at scene changes
- [peacefully] - for the wind-down ending

═══════════════════════════════════════
AGE-APPROPRIATE VOCABULARY
═══════════════════════════════════════
Ages 2-3: Basic words only. Very short sentences (3-5 words). Simple quest (find teddy, follow butterfly).
Ages 4-5: Simple words. Short sentences (5-8 words). Clear quest with 2-3 events.
Ages 6-7: Richer vocabulary. Longer sentences OK. More complex quest with 3-4 events.
Ages 8-10: Full vocabulary. Complex narrative with multiple plot threads.

═══════════════════════════════════════
WHAT TO AVOID
═══════════════════════════════════════
- NO scary monsters or villains
- NO real danger or violence
- NO sad or distressing content
- NO leaving the quest unresolved
- NO boring, event-less stories - something must HAPPEN

Your stories should make children feel like brave adventurers who can do amazing things!`;

/**
 * Generate a 30-second preview story (~80 words)
 */
export async function generatePreviewStory(
  childName: string,
  childAge: number,
  interests: string,
  theme: string = "adventure",
  customPrompt?: string
): Promise<StoryGenerationResult> {
  // Return mock story if feature flag is enabled
  if (Features.MOCK_STORY_GENERATION) {
    return getMockPreviewStory(childName);
  }

  const customPromptSection = customPrompt
    ? `\nCustom story instructions from the user: ${customPrompt}\n`
    : '';

  const userPrompt = `Create a compelling 30-second story PREVIEW (approximately 100 words) for a ${childAge}-year-old child named ${childName}.

Child's interests: ${interests}
Story theme: ${theme}
${customPromptSection}

This is a TEASER that must:
1. Start with an attention-grabbing HOOK - something magical or mysterious happens
2. Introduce ${childName} discovering something exciting
3. Hint at an adventure about to begin
4. End on a CLIFFHANGER that makes them want to hear the full story!

Example structure:
- Hook: Something magical appears or happens
- Discovery: ${childName} finds/sees something amazing
- Cliffhanger: "What would happen next? What was this magical [thing]?"

Age-appropriate vocabulary for ${childAge}-year-old:
${childAge <= 3 ? "Simple toddler words. Very short sentences." : ""}
${childAge >= 4 && childAge <= 5 ? "Preschool words: fluffy, sparkly, giggle, twinkle. Short sentences." : ""}
${childAge >= 6 && childAge <= 7 ? "Richer vocabulary OK: magical, wonderful, discovered." : ""}
${childAge >= 8 ? "Full vocabulary for exciting storytelling." : ""}

Audio tags to use:
- [softly] at the start
- [excited] for the discovery
- [whispers] for mystery
- [pause] between sentences

Respond in JSON format only:
{
  "title": "An intriguing, exciting title",
  "story": "[softly] The 100-word preview ending with anticipation...",
  "backgroundMusicPrompt": "5-word prompt for magical adventure music"
}`;

  return callGemini(userPrompt);
}

/**
 * Generate a full 10-minute story (~1400-1600 words)
 */
export async function generateFullStory(
  childName: string,
  childAge: number,
  interests: string,
  theme: string = "adventure",
  customPrompt?: string
): Promise<StoryGenerationResult> {
  // Return mock story if feature flag is enabled
  if (Features.MOCK_STORY_GENERATION) {
    return getMockFullStory(childName, childAge, interests);
  }

  const customPromptSection = customPrompt
    ? `\nCustom story instructions from the user: ${customPrompt}\n`
    : '';

  const userPrompt = `Create an engaging 10-minute bedtime adventure story for a ${childAge}-year-old child named ${childName}.

WORD COUNT: You MUST write between 1400-1600 words. This is NON-NEGOTIABLE. Count your words!

Child's interests: ${interests}
Story theme: ${theme}
${customPromptSection}

═══════════════════════════════════════
MANDATORY STORY STRUCTURE (Follow exactly!)
═══════════════════════════════════════

1. HOOK (first ~75 words)
   Begin with something magical or mysterious that grabs attention immediately.
   Example starts: A glowing light appears, a tiny creature needs help, a magical map is found.

2. SETUP (next ~225 words)
   - Establish the magical world/setting vividly
   - Give ${childName} a clear QUEST: something to find, someone to help, a problem to solve
   - Make the stakes clear - why does this matter?

3. ADVENTURE (next ~700 words) - THE HEART OF YOUR STORY
   This section must include:
   - At least 3 different scenes or locations
   - At least 2 friendly characters ${childName} meets and interacts with
   - At least 2 challenges or puzzles to overcome
   - Moments of wonder, discovery, and gentle excitement
   - ${childName} being brave, clever, and kind

4. CLIMAX (next ~225 words)
   - The exciting peak where ${childName} faces the main challenge
   - ${childName} uses skills/friends gained during the adventure to succeed
   - A triumphant, satisfying moment of victory

5. RESOLUTION (next ~150 words)
   - Show what ${childName} accomplished and learned
   - Celebrate with the friends made along the way
   - Begin the journey home feeling proud and happy

6. WIND-DOWN (final ~75 words)
   - Brief peaceful transition
   - Safe, warm, content feelings
   - Ready to rest after a wonderful adventure

═══════════════════════════════════════
AGE-APPROPRIATE VOCABULARY (Age ${childAge})
═══════════════════════════════════════
${childAge <= 3 ? "Use simple toddler words. Very short sentences (3-5 words). Simple quest like finding a lost toy." : ""}
${childAge >= 4 && childAge <= 5 ? "Use preschool-friendly words: fluffy, sparkly, giggle, tiptoe, twinkle. Sentences 5-8 words. Clear, simple quest." : ""}
${childAge >= 6 && childAge <= 7 ? "Richer vocabulary OK: magical, wonderful, discovered. Longer sentences. More complex quest with multiple steps." : ""}
${childAge >= 8 ? "Full vocabulary. Complex narrative with subplots. Sophisticated quest with meaningful challenges." : ""}

═══════════════════════════════════════
AUDIO TAGS (Use sparingly at key moments)
═══════════════════════════════════════
- [softly] - for gentle narration
- [excited] - for discoveries and exciting moments
- [whispers] - for secrets and mysteries
- [warmly] - for kind, loving moments
- [pause] - between paragraphs
- [long pause] - at scene transitions
- [peacefully] - for the wind-down ending

═══════════════════════════════════════
IMPORTANT REMINDERS
═══════════════════════════════════════
- ${childName} is the HERO - brave, kind, clever
- Include REAL events and challenges (not just wandering around)
- Create memorable characters with names and personalities
- Build genuine excitement before the climax
- NO scary content, but gentle tension is good
- Word count MUST be 1400-1600 words!

Respond in this exact JSON format only:
{
  "title": "An exciting, descriptive title",
  "story": "[softly] The complete 1400-1600 word story...",
  "backgroundMusicPrompt": "5-word prompt for magical adventure music"
}`;

  return callGemini(userPrompt);
}

/**
 * Music prompt generation result for Suno AI
 */
export interface MusicPromptResult {
  prompt: string;  // Detailed description for Suno (200-500 chars)
  style: string;   // Style tags for Suno (max 200 chars)
  title: string;   // Track title
}

/**
 * Generate a detailed music prompt by analyzing the story content
 * This prompt will be used by Suno AI to generate custom background music
 */
export async function generateMusicPrompt(
  storyText: string,
  theme: string,
  childAge: number
): Promise<MusicPromptResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const userPrompt = `Analyze this children's bedtime story and create a detailed music prompt for generating background music.

STORY TO ANALYZE:
${storyText.substring(0, 2000)}${storyText.length > 2000 ? '...' : ''}

STORY THEME: ${theme}
CHILD AGE: ${childAge}

Your task: Create a music prompt that will generate the PERFECT background music for this bedtime story.

ANALYZE THE STORY FOR:
1. Emotional arc - How does the mood progress? (mysterious → adventurous → triumphant → peaceful)
2. Key elements - What characters, creatures, or settings are featured? (dragons, ocean, forest, stars, etc.)
3. Pacing - Is it fast-paced adventure or gentle journey?
4. Ending mood - How should the music wind down for sleep?

MUSIC REQUIREMENTS:
- Must be INSTRUMENTAL (no vocals)
- Must be a LULLABY suitable for bedtime
- Should match the story's emotional journey
- Should be gentle enough to help children sleep
- For younger children (age 2-4): simpler, softer melodies
- For older children (age 5-10): can be slightly more complex

Respond in this exact JSON format:
{
  "prompt": "A detailed 200-500 character description of the music. Describe the instruments, mood progression, and how it should evolve throughout the piece. Example: 'Gentle orchestral lullaby that begins with soft mysterious piano notes, gradually introducing warm strings as the melody builds into a whimsical and magical theme, then slowly winds down to peaceful, dreamy tones perfect for drifting off to sleep.'",
  "style": "instrumental lullaby children's bedtime [add 3-5 more relevant style tags based on story]",
  "title": "A creative title for the track that relates to the story theme"
}`;

  const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API failed: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content in Gemini response");
  }

  // Parse JSON from response
  let jsonStr = content.trim();
  if (jsonStr.includes("```json")) {
    jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
  } else if (jsonStr.includes("```")) {
    jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
  }

  try {
    const result = JSON.parse(jsonStr);
    console.log(`[Gemini] Generated music prompt: "${result.title}"`);
    return result;
  } catch {
    // Fallback if JSON parsing fails
    console.warn("[Gemini] Failed to parse music prompt JSON, using fallback");
    return {
      prompt: "Gentle piano lullaby with soft strings, dreamy and magical atmosphere, perfect for a bedtime story. Starts softly, builds gently, then winds down peacefully.",
      style: `instrumental lullaby children's bedtime ${theme} peaceful dreamy`,
      title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Dreamtime Lullaby`,
    };
  }
}

async function callGemini(userPrompt: string): Promise<StoryGenerationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 4000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API failed: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("No content in Gemini response");
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.includes("```json")) {
    jsonStr = jsonStr.split("```json")[1].split("```")[0].trim();
  } else if (jsonStr.includes("```")) {
    jsonStr = jsonStr.split("```")[1].split("```")[0].trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails, construct a basic response
    return {
      title: "A Magical Bedtime Story",
      story: content,
      backgroundMusicPrompt: "soft piano lullaby gentle",
    };
  }
}
