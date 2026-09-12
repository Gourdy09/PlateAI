import { generateStructured, generateText } from './client.js';
import { constraintBlock } from '../recipes/prompt.js';

const PLATE_SYSTEM_INSTRUCTION = `You are Plate, the cooking assistant inside the Plate app.

How you talk:
- Direct and practical. Short paragraphs. No preamble, no sign-off, no emoji.
- Answer the question first, then add the one detail that matters most.
- When the cook is mid-recipe, speak like someone standing next to them at the stove.
- Use the cook's measurement system.

Hard rules:
- The cook's allergies and dietary restrictions are absolute. Never suggest an ingredient, substitution, garnish, or side that breaks them. If they ask for something that would, say so plainly and offer a compliant alternative.
- Never invent food-safety guarantees. You cannot confirm doneness, freshness, or safety from a photo or description alone; point to temperature, time, and visual cues instead.
- If you do not know something about their specific kitchen or ingredients, say so and ask one focused question.
- Stay on food, cooking, ingredients, nutrition, and kitchen technique. Politely redirect anything else.`;

const MAX_HISTORY_MESSAGES = 12;

/** Maps stored messages to Gemini `contents`, keeping only the recent window. */
function toGeminiHistory(messages = []) {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
}

function recipeContext(recipe, session) {
  if (!recipe) return 'The cook is not working from a specific recipe right now.';

  const instructions = recipe.instructions || [];
  const currentIndex = session ? Math.min(session.currentStep, Math.max(instructions.length - 1, 0)) : null;

  const lines = [
    `RECIPE: ${recipe.title}`,
    recipe.description ? `SUMMARY: ${recipe.description}` : '',
    `SERVINGS: ${session?.servings || recipe.servings}`,
    recipe.cuisine ? `CUISINE: ${recipe.cuisine}` : '',
    `TIMES: ${recipe.prepTime} min prep, ${recipe.cookTime} min cook`,
    'INGREDIENTS:',
    ...(recipe.ingredients || []).map(
      (item) => `- ${[item.quantity, item.unit, item.name].filter(Boolean).join(' ')}${item.optional ? ' (optional)' : ''}`
    ),
    'STEPS:',
    ...instructions.map((step, index) => `${index + 1}. ${step}`),
  ];

  if (session && instructions.length) {
    lines.push(
      '',
      `COOKING STATE: the cook is on step ${currentIndex + 1} of ${instructions.length}.`,
      `CURRENT STEP TEXT: ${instructions[currentIndex]}`,
      session.completedSteps?.length
        ? `COMPLETED STEPS: ${session.completedSteps.map((index) => index + 1).join(', ')}`
        : 'COMPLETED STEPS: none yet.',
      currentIndex + 1 < instructions.length
        ? `NEXT STEP TEXT: ${instructions[currentIndex + 1]}`
        : 'The cook is on the final step.'
    );
  }

  return lines.filter(Boolean).join('\n');
}

/**
 * Generates a Plate reply with the recipe, cooking state, and cook's constraints
 * in context. Images are passed through to Gemini but never persisted.
 */
export async function plateReply({
  preferences,
  recipe,
  session,
  history = [],
  message,
  images = [],
  fridgeItems = [],
}) {
  const contextBlocks = [
    'COOK PROFILE (never repeat this back verbatim, just respect it):',
    constraintBlock({ preferences, fridgeItems, includeFridge: fridgeItems.length > 0 }),
    '',
    recipeContext(recipe, session),
    '',
    images.length
      ? 'The cook attached a photo. Describe only what you can actually see, and be explicit about what the photo cannot tell you.'
      : '',
    '',
    `THE COOK SAYS: ${message}`,
  ];

  return generateText({
    prompt: contextBlocks.filter((block) => block !== undefined).join('\n'),
    systemInstruction: PLATE_SYSTEM_INSTRUCTION,
    history: toGeminiHistory(history),
    images,
    temperature: 0.6,
    maxOutputTokens: 700,
  });
}

const TITLE_SCHEMA = {
  type: 'OBJECT',
  properties: { title: { type: 'STRING' } },
  required: ['title'],
};

/** Short conversation title derived from the opening message. */
export async function conversationTitle(firstMessage) {
  try {
    const result = await generateStructured({
      prompt: `Write a 3-to-5 word title for a cooking conversation that starts with: "${firstMessage}". No quotes, no punctuation at the end.`,
      responseSchema: TITLE_SCHEMA,
      temperature: 0.3,
      context: 'conversation title',
      attempts: 1,
    });
    const title = String(result?.title || '').trim();
    return title ? title.slice(0, 60) : '';
  } catch {
    return '';
  }
}
