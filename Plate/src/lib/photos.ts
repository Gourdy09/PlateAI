import * as ImagePicker from 'expo-image-picker';

import { imageMimeTypeFor } from '@/lib/media';

export type PickedPhoto = { base64: string; mimeType: string; uri: string };

/** Thrown when the user declined camera or library access. */
export class PhotoPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoPermissionError';
  }
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  base64: true,
  // Gemini reads the photo fine at this size, and it keeps uploads quick.
  quality: 0.7,
  allowsMultipleSelection: false,
  exif: false,
};

function toPickedPhoto(result: ImagePicker.ImagePickerResult): PickedPhoto | null {
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset?.base64) return null;
  return {
    base64: asset.base64,
    mimeType: asset.mimeType ?? imageMimeTypeFor(asset.uri),
    uri: asset.uri,
  };
}

export async function takePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoPermissionError(
      'Plate needs camera access to take a photo. Enable it in your device settings.'
    );
  }
  return toPickedPhoto(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
}

export async function pickPhotoFromLibrary(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoPermissionError(
      'Plate needs photo access to attach a picture. Enable it in your device settings.'
    );
  }
  return toPickedPhoto(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
}
