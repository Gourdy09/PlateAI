import { env } from '../../config/env.js';
import { fetchWithTimeout } from '../../lib/http.js';

/**
 * Food photography provider.
 *
 * Gemini returns recipe text, not photographs, so images come from a real photo
 * API. When no provider is configured we return an empty string and the app
 * renders its own typographic recipe cover — Plate never attaches a stock photo
 * of a different dish and presents it as the recipe.
 */

const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';

export function isImageProviderConfigured() {
  return Boolean(env.images?.unsplashAccessKey);
}

function searchQuery({ title, cuisine }) {
  return [title, cuisine, 'food'].filter(Boolean).join(' ').slice(0, 120);
}

/** @returns {Promise<string>} an image URL, or '' when unavailable. */
export async function findRecipeImage(recipe) {
  if (!isImageProviderConfigured()) return '';

  try {
    const url = new URL(UNSPLASH_ENDPOINT);
    url.searchParams.set('query', searchQuery(recipe));
    url.searchParams.set('per_page', '1');
    url.searchParams.set('orientation', 'portrait');
    url.searchParams.set('content_filter', 'high');

    const response = await fetchWithTimeout(url, {
      headers: {
        Authorization: `Client-ID ${env.images.unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
      timeoutMs: 8_000,
      serviceName: 'Image provider',
    });
    if (!response.ok) return '';

    const data = await response.json().catch(() => null);
    const photo = data?.results?.[0];
    return typeof photo?.urls?.regular === 'string' ? photo.urls.regular : '';
  } catch {
    // Imagery is decorative; a lookup failure must never fail recipe generation.
    return '';
  }
}

export async function attachImages(recipes) {
  if (!isImageProviderConfigured()) return recipes;
  return Promise.all(
    recipes.map(async (recipe) =>
      recipe.image ? recipe : { ...recipe, image: await findRecipeImage(recipe) }
    )
  );
}
