import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/** Maps a recording or image file extension to the MIME type the API expects. */
const AUDIO_MIME_BY_EXTENSION: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  caf: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  '3gp': 'audio/3gpp',
};

export function audioMimeTypeFor(uri: string) {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return AUDIO_MIME_BY_EXTENSION[extension] ?? (Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a');
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export function imageMimeTypeFor(uri: string, fallback = 'image/jpeg') {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_MIME_BY_EXTENSION[extension] ?? fallback;
}

/** Reads a local file as base64 so it can be posted to the backend as JSON. */
export async function readFileAsBase64(uri: string) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('That file could not be read.'));
      reader.onload = () => {
        const result = String(reader.result ?? '');
        resolve(result.slice(result.indexOf(',') + 1));
      };
      reader.readAsDataURL(blob);
    });
  }
  return new File(uri).base64();
}

/**
 * Writes base64 audio to a cache file and returns a playable URI. expo-audio
 * plays from a URI, and cache files are disposable by design.
 */
export async function writeAudioToCache(base64: string, mimeType: string) {
  if (Platform.OS === 'web') return `data:${mimeType};base64,${base64}`;

  const extension = mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3' : 'm4a';
  const file = new File(Paths.cache, `plate-speech-${Date.now()}.${extension}`);
  file.create({ overwrite: true, intermediates: true });
  file.write(base64, { encoding: 'base64' });
  return file.uri;
}

export function deleteCachedFile(uri: string) {
  if (Platform.OS === 'web' || !uri.startsWith('file://')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A leftover cache file is harmless; the OS clears the cache directory.
  }
}
