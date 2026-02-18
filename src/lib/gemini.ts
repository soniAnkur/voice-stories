import { Features } from "./features";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface StoryGenerationResult {
  title: string;
  story: string;
  backgroundMusicPrompt: string;
}

// Section-based story result for video mode
export interface StorySectionResult {
  sectionNumber: number;
  title: string;
  text: string;
  cinematicDescription: string;
}

export interface StoryWithSectionsResult {
  title: string;
  sections: StorySectionResult[];
  backgroundMusicPrompt: string;
  fullStoryText: string; // Combined text for TTS
}

// ═══════════════════════════════════════════════════════════════════════════
// STORY VARIETY SYSTEM - Makes each story unique and engaging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Story archetypes - different narrative patterns to keep stories fresh
 */
const STORY_ARCHETYPES = [
  {
    name: "The Helper",
    description: "A creature or character needs help, and the child's kindness saves the day",
    hook: "meets someone in need",
    journey: "helping and problem-solving together",
    climax: "the child's kindness creates a magical reward"
  },
  {
    name: "The Discovery",
    description: "The child discovers a hidden world or secret place",
    hook: "finds a hidden entrance or magical doorway",
    journey: "exploring wonders and meeting inhabitants",
    climax: "becomes a special friend/guardian of the secret place"
  },
  {
    name: "The Mystery",
    description: "Something magical is happening and the child follows clues to understand it",
    hook: "notices something strange or magical happening",
    journey: "following clues and gathering pieces of the puzzle",
    climax: "solves the mystery and discovers something wonderful"
  },
  {
    name: "The Gift",
    description: "The child receives or finds something magical with a special purpose",
    hook: "receives or discovers a magical object",
    journey: "learning what the gift can do and how to use it",
    climax: "uses the gift to help others or create something beautiful"
  },
  {
    name: "The Festival",
    description: "The child is invited to or stumbles upon a magical celebration",
    hook: "discovers a magical celebration is happening",
    journey: "participating in magical activities and games",
    climax: "plays a special role in the celebration's highlight"
  },
  {
    name: "The Journey Home",
    description: "The child helps someone find their way back home",
    hook: "meets a lost creature or character",
    journey: "traveling through magical places together",
    climax: "reunites the friend with their family/home"
  },
  {
    name: "The Competition",
    description: "The child enters a friendly magical contest or challenge",
    hook: "is invited to participate in something special",
    journey: "preparing and competing with fun challenges",
    climax: "wins through creativity, kindness, or teamwork (not just being 'best')"
  },
  {
    name: "The Transformation",
    description: "The child temporarily becomes something else or gains special abilities",
    hook: "is magically transformed or gains powers",
    journey: "experiencing the world in a new way",
    climax: "uses new perspective to do something wonderful before returning to normal"
  }
];

/**
 * Theme-specific story elements for deep integration
 */
const THEME_ELEMENTS: Record<string, {
  settings: string[];
  characters: string[];
  objects: string[];
  challenges: string[];
  atmosphere: string;
}> = {
  adventure: {
    settings: [
      "a treehouse village high in ancient trees",
      "a cozy cave system with glowing crystals",
      "a meadow where flowers sing",
      "an old lighthouse that shows the way to anywhere",
      "a bridge made of rainbows connecting floating islands",
      "a friendly giant's garden with enormous vegetables"
    ],
    characters: [
      "a wise old owl who collects stories",
      "a tiny dragon who makes the best hot cocoa",
      "a cloud that gives fluffy rides",
      "a family of musical mice",
      "a friendly scarecrow who loves dancing",
      "a grandmother hedgehog who knows all the secret paths"
    ],
    objects: [
      "a compass that points to what you need most",
      "boots that leave flowers where you step",
      "a lantern that shows hidden doors",
      "a backpack that always has exactly what you need",
      "a whistle that calls friendly animals"
    ],
    challenges: [
      "crossing a ticklish bridge that giggles",
      "finding the right path through a maze of mirrors",
      "waking a sleepy guardian gently",
      "solving a riddle from a talking tree",
      "building something creative from found materials"
    ],
    atmosphere: "wonder-filled and empowering"
  },
  animals: {
    settings: [
      "a cozy burrow with underground tunnels",
      "a forest clearing where animals hold meetings",
      "a pond where fish and frogs share stories",
      "a barn where animals have secret adventures at night",
      "a meadow where butterflies carry messages",
      "a treehouse built by cooperative forest creatures"
    ],
    characters: [
      "a brave little mouse with big dreams",
      "a wise turtle who has seen many seasons",
      "a cheerful bluebird who delivers good news",
      "a shy deer learning to make friends",
      "a playful otter family",
      "a mother fox teaching her cubs",
      "a grumpy-but-kind badger"
    ],
    objects: [
      "a feather that lets you understand animal speech",
      "a nut that grants one wish",
      "a hollow log that's bigger inside",
      "honey that makes you brave",
      "a leaf map showing secret animal paths"
    ],
    challenges: [
      "helping gather food before winter",
      "organizing a surprise party for someone",
      "finding the perfect home for a new friend",
      "learning the special talent of a new species",
      "resolving a misunderstanding between friends"
    ],
    atmosphere: "warm, fuzzy, and full of friendship"
  },
  space: {
    settings: [
      "a cozy spaceship shaped like a teacup",
      "a planet made entirely of clouds and rainbows",
      "a friendly space station where aliens share snacks",
      "a moon with bouncy ground",
      "a garden that floats among the stars",
      "a comet that gives rides across the galaxy"
    ],
    characters: [
      "a small robot learning about feelings",
      "a purple alien who collects Earth things",
      "a star who wants to play",
      "a moon who feels lonely",
      "a family of space whales",
      "a friendly AI who tells jokes",
      "astronaut grandparents"
    ],
    objects: [
      "a telescope that shows wishes",
      "a space suit that changes colors with mood",
      "stardust that makes things float",
      "a translator that works for any language",
      "gravity boots for walking on anything"
    ],
    challenges: [
      "helping a lost star find its constellation",
      "delivering a birthday present across the galaxy",
      "teaching an alien about Earth customs",
      "collecting colors for a rainbow planet",
      "finding the music of the spheres"
    ],
    atmosphere: "cosmic wonder with cozy warmth"
  },
  ocean: {
    settings: [
      "a coral castle where fish are the royalty",
      "a submarine shaped like a friendly whale",
      "an underwater garden tended by seahorses",
      "a kelp forest full of hiding spots",
      "a shipwreck turned into a cozy home",
      "a pearl palace with rainbow walls"
    ],
    characters: [
      "a wise octopus who gives hugs",
      "a seahorse postal carrier",
      "a grumpy crab with a soft heart",
      "a whale who sings lullabies",
      "a school of fish who think as one",
      "a friendly shark who's vegetarian",
      "a jellyfish who glows with feelings"
    ],
    objects: [
      "a shell that lets you breathe underwater",
      "a pearl that lights the darkest depths",
      "seaweed that makes you swim fast",
      "a message in a bottle that finds who needs it",
      "sand dollars that grant small wishes"
    ],
    challenges: [
      "finding a lost treasure that's actually friendship",
      "helping clean up the ocean together",
      "reuniting a baby with its family",
      "creating an underwater concert",
      "discovering what makes each creature special"
    ],
    atmosphere: "flowing, peaceful, and deeply connected"
  },
  fairy: {
    settings: [
      "a mushroom village with tiny doors",
      "a flower that's actually a fairy apartment",
      "a dewdrop kingdom at dawn",
      "a magical garden that rearranges at night",
      "a pixie dust factory in an old oak",
      "a fairy market under the full moon"
    ],
    characters: [
      "a fairy godmother in training",
      "a grumpy gnome who secretly helps",
      "a tooth fairy on their first collection",
      "a garden sprite who loves mischief",
      "a wise fairy queen who speaks in rhymes",
      "a bumbling wizard's apprentice",
      "talking flowers with personalities"
    ],
    objects: [
      "a wand that only works with kind words",
      "wings that appear when you're brave",
      "a thimble full of dreams",
      "shoes that dance on their own",
      "a mirror that shows your best self"
    ],
    challenges: [
      "earning your wings through kindness",
      "brewing a potion with unusual ingredients",
      "granting a wish in an unexpected way",
      "breaking a silly spell with laughter",
      "planning a fairy ball with limited magic"
    ],
    atmosphere: "whimsical, sparkly, and full of gentle magic"
  },
  dinosaurs: {
    settings: [
      "a valley where dinosaurs still live peacefully",
      "a time-traveling treehouse",
      "a dinosaur school for young ones",
      "a nest high on a cliff with amazing views",
      "a river where herbivores and carnivores share water kindly",
      "a volcano that's actually warm and cozy inside"
    ],
    characters: [
      "a baby t-rex who's afraid of his own shadow",
      "a long-necked dinosaur who tells stories from high up",
      "a triceratops who protects smaller friends",
      "a pterodactyl mail carrier",
      "a stegosaurus who loves music",
      "a raptor family who values cleverness",
      "an old dinosaur who remembers everything"
    ],
    objects: [
      "a dinosaur egg about to hatch",
      "ancient amber that shows the past",
      "a feather that survived millions of years",
      "footprint fossils that tell stories",
      "a bone that grants dinosaur strength"
    ],
    challenges: [
      "helping a dinosaur find its herd",
      "protecting eggs from a gentle, accidental threat",
      "discovering what a dinosaur really ate",
      "making friends across species",
      "preparing for the changing seasons"
    ],
    atmosphere: "prehistoric wonder with gentle giants"
  }
};

/**
 * Opening hooks that vary the story beginning
 */
const OPENING_VARIATIONS = [
  "It all began when the last ray of sunlight touched",
  "Nobody knew that tonight would be different, until",
  "The sound was so soft, almost like a whisper, when",
  "Just as dreams began to form in the evening air,",
  "Some say magic happens when you least expect it, and that's exactly when",
  "The stars had just begun their nightly dance when",
  "In that quiet moment between waking and sleeping,",
  "What started as an ordinary evening became extraordinary when"
];

/**
 * Pick random elements from arrays
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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

const SYSTEM_PROMPT = `You are a master children's storyteller creating UNIQUE, engaging bedtime stories. Each story you create must feel fresh and different - avoid formulaic patterns.

═══════════════════════════════════════
CREATIVITY IS YOUR TOP PRIORITY
═══════════════════════════════════════

Every story must be GENUINELY DIFFERENT:
- Never use the same plot structure twice
- Surprise yourself with unexpected directions
- Let the specific story archetype guide you naturally
- Create memorable, named characters with distinct personalities
- Use the child's interests in creative, unexpected ways

═══════════════════════════════════════
STORYTELLING TECHNIQUES
═══════════════════════════════════════

MIX AND VARY these elements:
- Story openings: start mid-action, with dialogue, with mystery, with wonder
- Pacing: vary between quiet moments and exciting ones
- Character introductions: some friendly, some initially shy, some surprising
- Challenges: puzzles, creative tasks, cooperation, gentle bravery
- Endings: triumphant, peaceful, hopeful, connected

AVOID predictable patterns like:
- "Once upon a time" openings (find more creative starts)
- Linear A→B→C quests (add surprises, twists, discoveries)
- Characters who just "help the child" (give them their own motivations)
- Everything working perfectly (include small mishaps that lead to better outcomes)

═══════════════════════════════════════
EMOTIONAL DEPTH
═══════════════════════════════════════

Great stories have emotional variety:
- Moments of wonder and amazement
- Gentle humor and playfulness
- Warmth and connection with characters
- Small accomplishments that feel big
- The satisfaction of figuring things out
- The joy of making unexpected friends

═══════════════════════════════════════
AUDIO TAGS (Use naturally)
═══════════════════════════════════════
[softly] - gentle, intimate moments
[excited] - discoveries and excitement
[whispers] - secrets and mystery
[warmly] - loving, kind moments
[pause] - natural breathing room
[long pause] - scene transitions
[peacefully] - calming endings
[playfully] - fun, silly moments
[curiously] - wondering and exploring

═══════════════════════════════════════
AGE-APPROPRIATE VOCABULARY
═══════════════════════════════════════
Ages 2-3: Simple words, very short sentences. Repetition is comforting.
Ages 4-5: Playful words, short sentences. Silly sounds and actions.
Ages 6-7: Richer vocabulary. More complex emotions and relationships.
Ages 8-10: Sophisticated narrative. Subplots and character development.

═══════════════════════════════════════
WHAT TO AVOID
═══════════════════════════════════════
- NO scary content or real danger
- NO villains or antagonists
- NO sad or distressing content
- NO unresolved stories
- NO boring, repetitive patterns
- NO generic placeholder characters (give everyone names and personality!)

Your stories should feel like a gift - unique, personal, and magical.`;

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

  // Select random elements for this unique story
  const archetype = pickRandom(STORY_ARCHETYPES);
  const themeData = THEME_ELEMENTS[theme] || THEME_ELEMENTS.adventure;
  const setting = pickRandom(themeData.settings);
  const character = pickRandom(themeData.characters);
  const opening = pickRandom(OPENING_VARIATIONS);

  const customPromptSection = customPrompt
    ? `\nSpecial request: ${customPrompt}\n`
    : '';

  const userPrompt = `Create a captivating 30-second story PREVIEW (approximately 100 words) for ${childName}, age ${childAge}.

═══════════════════════════════════════
THIS STORY'S UNIQUE ELEMENTS
═══════════════════════════════════════
Story archetype: "${archetype.name}" - ${archetype.description}
- The hook: ${childName} ${archetype.hook}
- The journey will be about: ${archetype.journey}

Theme: ${theme} (${themeData.atmosphere})
Setting to feature: ${setting}
Character to introduce: ${character}
Opening style: "${opening}..."

Child's interests to weave in creatively: ${interests}
${customPromptSection}

═══════════════════════════════════════
PREVIEW REQUIREMENTS
═══════════════════════════════════════
This preview must:
1. Open with the given opening style - make it INTRIGUING
2. Introduce ${childName} in or approaching the setting
3. Create a moment of discovery or connection related to the archetype
4. End on a COMPELLING CLIFFHANGER that promises adventure

Make it feel UNIQUE - not a generic "child finds magic thing" story!

Age ${childAge} vocabulary:
${childAge <= 3 ? "Simple toddler words. Very short sentences. Gentle repetition." : ""}
${childAge >= 4 && childAge <= 5 ? "Playful words: fluffy, sparkly, giggle, whoosh. Short sentences with rhythm." : ""}
${childAge >= 6 && childAge <= 7 ? "Richer vocabulary. Build atmosphere. Show don't tell." : ""}
${childAge >= 8 ? "Sophisticated language. Create intrigue and depth." : ""}

Audio tags: [softly], [excited], [whispers], [curiously], [pause]

Respond in JSON only:
{
  "title": "A unique, intriguing title specific to THIS story",
  "story": "The ~100 word preview with audio tags...",
  "backgroundMusicPrompt": "5 words describing the mood"
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

  // Select random elements for this unique story
  const archetype = pickRandom(STORY_ARCHETYPES);
  const themeData = THEME_ELEMENTS[theme] || THEME_ELEMENTS.adventure;
  const settings = pickMultiple(themeData.settings, 3);
  const characters = pickMultiple(themeData.characters, 3);
  const objects = pickMultiple(themeData.objects, 2);
  const challenges = pickMultiple(themeData.challenges, 2);
  const opening = pickRandom(OPENING_VARIATIONS);

  const customPromptSection = customPrompt
    ? `\nSpecial request from the creator: ${customPrompt}\n`
    : '';

  const userPrompt = `Create a UNIQUE, engaging 10-minute bedtime story for ${childName}, age ${childAge}.

WORD COUNT: 1400-1600 words. NON-NEGOTIABLE!

═══════════════════════════════════════
THIS STORY'S UNIQUE DNA
═══════════════════════════════════════

STORY ARCHETYPE: "${archetype.name}"
${archetype.description}
- Hook concept: ${childName} ${archetype.hook}
- Journey theme: ${archetype.journey}
- Climax moment: ${archetype.climax}

THEME: ${theme}
Atmosphere: ${themeData.atmosphere}

SETTINGS TO VISIT (use at least 2):
1. ${settings[0]}
2. ${settings[1]}
3. ${settings[2]}

CHARACTERS TO MEET (use at least 2, give them NAMES):
1. ${characters[0]}
2. ${characters[1]}
3. ${characters[2]}

MAGICAL OBJECTS (weave in at least 1):
- ${objects[0]}
- ${objects[1]}

CHALLENGES TO FACE (include at least 1):
- ${challenges[0]}
- ${challenges[1]}

OPENING STYLE: "${opening}..."

CHILD'S INTERESTS (weave these in creatively): ${interests}
${customPromptSection}

═══════════════════════════════════════
STORY STRUCTURE (Flexible, not rigid!)
═══════════════════════════════════════

The archetype guides your structure:

"${archetype.name}" story flow:
1. OPENING (~100 words): Use the opening style. ${childName} ${archetype.hook}.
2. DISCOVERY (~200 words): The first setting reveals itself. Meet the first character.
3. JOURNEY (~800 words): ${archetype.journey}. Visit multiple settings. Meet more characters. Face challenges. Include moments of humor, wonder, and connection.
4. CLIMAX (~200 words): ${archetype.climax}. Make it satisfying!
5. WARM CLOSE (~200 words): Celebrate, say goodbyes, settle into peaceful rest.

DON'T follow this rigidly - let the story breathe and surprise you!

═══════════════════════════════════════
MAKE IT UNIQUE
═══════════════════════════════════════

AVOID these clichés:
- "Once upon a time" (use the given opening instead)
- Generic "magical door appears" openings
- Characters who only exist to help the child
- Predictable "collect 3 things" quests
- Endings where everyone just says "goodbye, you're special"

INCLUDE these for richness:
- Give every character a NAME and quirk
- Small moments of humor or silliness
- Unexpected twists (a helper needs help, a challenge solves itself wrong at first)
- Sensory details (sounds, textures, colors, smells)
- The child's interests appearing in surprising ways
- Quiet moments between exciting ones

═══════════════════════════════════════
AGE ${childAge} VOCABULARY
═══════════════════════════════════════
${childAge <= 3 ? "Simple words. Very short sentences. Comforting repetition. Focus on sensory details." : ""}
${childAge >= 4 && childAge <= 5 ? "Playful words with fun sounds. Short sentences with rhythm. Silly moments and sound effects." : ""}
${childAge >= 6 && childAge <= 7 ? "Richer vocabulary. Show emotions, not just actions. Characters can have complex feelings." : ""}
${childAge >= 8 ? "Sophisticated narrative. Subtle humor. Characters with depth and motivation. Meaningful themes." : ""}

═══════════════════════════════════════
AUDIO TAGS (Use naturally, not formulaically)
═══════════════════════════════════════
[softly] - intimate moments
[excited] - discoveries
[whispers] - secrets
[warmly] - connection
[playfully] - fun moments
[curiously] - wondering
[pause] - breathing room
[long pause] - scene changes
[peacefully] - winding down

═══════════════════════════════════════
ABSOLUTE REQUIREMENTS
═══════════════════════════════════════
✓ 1400-1600 words (COUNT THEM!)
✓ ${childName} is brave, kind, and clever
✓ Named characters with personalities
✓ No scary content (gentle tension is fine)
✓ Satisfying resolution
✓ Peaceful ending for sleep

Respond in JSON only:
{
  "title": "A unique title that captures THIS specific story",
  "story": "The complete 1400-1600 word story with audio tags...",
  "backgroundMusicPrompt": "5 words for the mood"
}`;

  return callGemini(userPrompt);
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
        temperature: 0.95, // Higher for more creative, varied stories
        maxOutputTokens: 4000,
        topP: 0.95, // Allow more diverse token selection
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

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO MODE: Story with 4 sections and cinematographic descriptions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a full 10-minute story with 4 distinct sections for video mode.
 * Each section includes a cinematographic description for image/video generation.
 */
export async function generateFullStoryWithSections(
  childName: string,
  childAge: number,
  interests: string,
  theme: string = "adventure",
  customPrompt?: string
): Promise<StoryWithSectionsResult> {
  // Select random elements for this unique story
  const archetype = pickRandom(STORY_ARCHETYPES);
  const themeData = THEME_ELEMENTS[theme] || THEME_ELEMENTS.adventure;
  const settings = pickMultiple(themeData.settings, 4);
  const characters = pickMultiple(themeData.characters, 3);
  const objects = pickMultiple(themeData.objects, 2);
  const opening = pickRandom(OPENING_VARIATIONS);

  const customPromptSection = customPrompt
    ? `\nSpecial request from the creator: ${customPrompt}\n`
    : '';

  const userPrompt = `Create a UNIQUE, engaging 10-minute bedtime story for ${childName}, age ${childAge}.

═══════════════════════════════════════
VIDEO STORY MODE - 4 SECTIONS
═══════════════════════════════════════

This story will be turned into a VIDEO with images and animations.
You MUST structure it into exactly 4 sections.
Each section needs a CINEMATOGRAPHIC DESCRIPTION for the visuals.

WORD COUNT: 1400-1600 words total. NON-NEGOTIABLE!

═══════════════════════════════════════
THIS STORY'S UNIQUE DNA
═══════════════════════════════════════

STORY ARCHETYPE: "${archetype.name}"
${archetype.description}
- Hook concept: ${childName} ${archetype.hook}
- Journey theme: ${archetype.journey}
- Climax moment: ${archetype.climax}

THEME: ${theme}
Atmosphere: ${themeData.atmosphere}

SETTINGS TO VISIT (one per section):
1. ${settings[0]}
2. ${settings[1]}
3. ${settings[2]}
4. ${settings[3]}

CHARACTERS TO MEET (give them NAMES):
1. ${characters[0]}
2. ${characters[1]}
3. ${characters[2]}

MAGICAL OBJECTS: ${objects[0]}, ${objects[1]}

OPENING STYLE: "${opening}..."

CHILD'S INTERESTS (weave these in): ${interests}
${customPromptSection}

═══════════════════════════════════════
4-SECTION STRUCTURE (MUST FOLLOW)
═══════════════════════════════════════

SECTION 1 - "The Beginning" (~350 words)
Setting: ${settings[0]}
- Use the opening style
- ${childName} ${archetype.hook}
- Introduce the magical world
- Meet first character
CINEMATIC FOCUS: Establish the cozy, magical atmosphere

SECTION 2 - "The Discovery" (~400 words)
Setting: ${settings[1]}
- Journey deeper into the adventure
- Meet more characters
- First challenge or puzzle
CINEMATIC FOCUS: Show wonder and exploration

SECTION 3 - "The Climax" (~450 words)
Setting: ${settings[2]}
- ${archetype.journey}
- Face the main challenge
- ${archetype.climax}
CINEMATIC FOCUS: Exciting action, magical moments

SECTION 4 - "The Peaceful End" (~350 words)
Setting: ${settings[3]}
- Celebration of success
- Warm goodbyes with friends
- ${childName} settles into peaceful sleep
CINEMATIC FOCUS: Calming, dreamy, sleepy atmosphere

═══════════════════════════════════════
CINEMATOGRAPHIC DESCRIPTIONS
═══════════════════════════════════════

For each section, provide a "cinematicDescription" that describes:
- The visual scene (colors, lighting, mood)
- What the child looks like in the scene
- Key visual elements and characters
- Camera movement suggestion (slow pan, gentle zoom, etc.)

This will be used to generate AI images and videos.
Keep it vivid, warm, and child-friendly.
Example: "A young child with curious eyes stands in a moonlit forest clearing. Soft blue and silver light filters through ancient oak trees. Tiny fireflies create gentle sparkles around them. A friendly owl with golden spectacles perches nearby. Camera slowly pans across the magical scene."

═══════════════════════════════════════
AGE ${childAge} VOCABULARY
═══════════════════════════════════════
${childAge <= 3 ? "Simple words. Very short sentences. Comforting repetition." : ""}
${childAge >= 4 && childAge <= 5 ? "Playful words with fun sounds. Short sentences with rhythm." : ""}
${childAge >= 6 && childAge <= 7 ? "Richer vocabulary. Show emotions, not just actions." : ""}
${childAge >= 8 ? "Sophisticated narrative. Subtle humor. Meaningful themes." : ""}

═══════════════════════════════════════
AUDIO TAGS (Use naturally)
═══════════════════════════════════════
[softly] [excited] [whispers] [warmly] [playfully] [curiously] [pause] [long pause] [peacefully]

═══════════════════════════════════════
RESPONSE FORMAT (JSON)
═══════════════════════════════════════

{
  "title": "A unique title for this story",
  "backgroundMusicPrompt": "5 words for the mood",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Short title for section 1",
      "text": "The story text for section 1 with audio tags... (~350 words)",
      "cinematicDescription": "Visual description for AI image/video generation (2-3 sentences)"
    },
    {
      "sectionNumber": 2,
      "title": "Short title for section 2",
      "text": "The story text for section 2... (~400 words)",
      "cinematicDescription": "Visual description for section 2..."
    },
    {
      "sectionNumber": 3,
      "title": "Short title for section 3",
      "text": "The story text for section 3... (~450 words)",
      "cinematicDescription": "Visual description for section 3..."
    },
    {
      "sectionNumber": 4,
      "title": "Short title for section 4",
      "text": "The story text for section 4... (~350 words)",
      "cinematicDescription": "Visual description for section 4..."
    }
  ]
}`;

  return callGeminiForSections(userPrompt);
}

async function callGeminiForSections(userPrompt: string): Promise<StoryWithSectionsResult> {
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
        temperature: 0.9,
        maxOutputTokens: 6000, // Larger for structured output
        topP: 0.95,
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

    // Combine all section texts into fullStoryText for TTS
    const fullStoryText = result.sections
      .map((s: StorySectionResult) => s.text)
      .join("\n\n[long pause]\n\n");

    return {
      title: result.title,
      sections: result.sections,
      backgroundMusicPrompt: result.backgroundMusicPrompt,
      fullStoryText,
    };
  } catch (e) {
    console.error("Failed to parse Gemini sections response:", e);
    throw new Error("Failed to parse story sections from Gemini");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO MODE: Analyze existing story for video generation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analysis result for video generation from existing story
 */
export interface VideoStoryAnalysis {
  mainCharacter: {
    name: string;
    appearance: string;
  };
  supportingCharacters: Array<{
    name: string;
    appearance: string;
  }>;
  setting: string;
  sections: Array<{
    sectionNumber: number;
    title: string;
    text: string;
    startScene: string;
    endScene: string;
    cameraMovement: string;
  }>;
}

/**
 * Analyze an existing story to extract characters, scenes, and create
 * story-specific visual descriptions for video generation.
 *
 * This reads the ACTUAL story content and creates cinematographic
 * descriptions that match the real characters and plot.
 */
export async function analyzeStoryForVideo(
  storyText: string,
  childName?: string,
  childAge?: number
): Promise<VideoStoryAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const userPrompt = `You are analyzing a children's bedtime story to create VIDEO scenes.
Your job is to READ the story carefully and extract the ACTUAL characters, settings, and events.

═══════════════════════════════════════
STORY TEXT TO ANALYZE
═══════════════════════════════════════

${storyText}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════

1. EXTRACT the main character (the child in the story)
   - Their name
   - Create a detailed visual description for a children's book illustration
   - Age: ${childAge || "young child"}
   - Make them look like a cute, friendly cartoon child

2. EXTRACT all supporting characters from the story
   - Their names (as mentioned in the story)
   - Visual descriptions that match how they're described

3. IDENTIFY the overall setting/world of the story

4. SPLIT the story into exactly 4 sections:
   - Each section should be roughly equal length
   - Each section should have a clear narrative arc

5. For EACH section, create:
   - title: A short descriptive title
   - text: The actual story text for that section
   - startScene: A detailed visual description of what we SEE at the START of this section
   - endScene: A detailed visual description of what we SEE at the END of this section
   - cameraMovement: How the camera should move (slow zoom, gentle pan, floating, etc.)

═══════════════════════════════════════
CRITICAL RULES FOR VISUAL DESCRIPTIONS
═══════════════════════════════════════

1. ONLY describe what's ACTUALLY in the story
   - If the story mentions a "magic car", include the magic car
   - If the story has a "friendly mouse named Whiskers", include Whiskers
   - Do NOT invent characters or objects that aren't in the story

2. MAINTAIN CONTINUITY between sections
   - Section 1 END should visually connect to Section 2 START
   - Characters should look consistent across all scenes
   - The setting should evolve naturally

3. INCLUDE the main character in EVERY scene
   - Always mention ${childName || "the child"} by name
   - Describe what they're doing, their expression, their position

4. Use WARM, COZY, BEDTIME-APPROPRIATE imagery
   - Soft lighting, gentle colors, safe atmosphere
   - Children's storybook illustration style
   - Nothing scary or dark

═══════════════════════════════════════
EXAMPLE (for a story about "Ocean and a magic car")
═══════════════════════════════════════

GOOD startScene: "Ocean, a cheerful 3-year-old with short brown hair and star pajamas, crouches in a sunny backyard garden, eyes wide with wonder, looking at a small red toy car that's beginning to glow with golden sparkles."

BAD startScene: "A child stands in a meadow with cute animals." (generic, not from story)

═══════════════════════════════════════
RESPONSE FORMAT (JSON ONLY)
═══════════════════════════════════════

{
  "mainCharacter": {
    "name": "The child's name from the story",
    "appearance": "Detailed visual description: age, hair color/style, clothing, expression. Make them look like a cute illustrated storybook character."
  },
  "supportingCharacters": [
    {
      "name": "Character name from story",
      "appearance": "Visual description matching how they're described in the story"
    }
  ],
  "setting": "Overall visual world/atmosphere of the story",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Short title",
      "text": "Actual story text for this section...",
      "startScene": "Detailed visual description of scene START. Include ${childName || "the child"}'s position, expression, surroundings, lighting, mood. 2-3 sentences.",
      "endScene": "Detailed visual description of scene END. Show the transition moment. Should connect to next section's start. 2-3 sentences.",
      "cameraMovement": "Camera direction: slow zoom in / gentle pan right / floating upward / etc."
    },
    // ... 3 more sections
  ]
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
        temperature: 0.7, // Lower for more faithful extraction
        maxOutputTokens: 6000,
        topP: 0.9,
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
    const result = JSON.parse(jsonStr) as VideoStoryAnalysis;

    console.log("\n=== Story Analysis Complete ===");
    console.log(`Main character: ${result.mainCharacter.name}`);
    console.log(`Supporting characters: ${result.supportingCharacters.length}`);
    console.log(`Sections: ${result.sections.length}`);

    return result;
  } catch (e) {
    console.error("Failed to parse Gemini analysis response:", e);
    console.error("Raw response:", content);
    throw new Error("Failed to parse story analysis from Gemini");
  }
}
