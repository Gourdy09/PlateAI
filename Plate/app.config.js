/** @type {import('expo/config').ExpoConfig} */
const appJson = {
  name: 'Plate',
  slug: 'Plate',
  owner: 'ompatel08',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/plate-logo-cream-on-terracotta.png',
  scheme: 'plate',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/images/plate-logo-cream-on-terracotta.png',
    bundleIdentifier: 'com.plateai.plate',
  },
  android: {
    package: 'com.plateai.plate',
    adaptiveIcon: {
      backgroundColor: '#E85D3F',
      foregroundImage: './assets/images/plate-logo-cream-on-terracotta.png',
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'resize',
  },
  web: {
    output: 'static',
    favicon: './assets/images/plate-logo-cream-on-terracotta.png',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#E85D3F',
        image: './assets/images/plate-logo-cream-on-terracotta.png',
        imageWidth: 180,
      },
    ],
    'expo-secure-store',
    [
      'expo-audio',
      {
        microphonePermission:
          'Plate uses the microphone so you can talk to your cooking assistant while your hands are busy.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'Plate uses the camera so you can photograph a dish or your fridge and ask about it.',
        photosPermission:
          'Plate needs access to your photos so you can attach a picture of a dish or your ingredients.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default ({ config } = {}) => {
  // Only public client configuration belongs here — it ships inside the bundle.
  // Gemini, ElevenLabs, MongoDB, and Auth0 secrets live in server/.env.
  // These three are public Auth0 client values (not secrets). Env overrides them
  // locally; EAS preview/production often has no Plate/.env, so keep fallbacks
  // so a standalone APK can still sign in.
  const auth0Domain =
    process.env.EXPO_PUBLIC_AUTH0_DOMAIN?.trim() || 'dev-365vl3uqzr1yn11f.us.auth0.com';
  const auth0ClientId =
    process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID?.trim() || 'gg01fOQHenMv6bOLlnVzmwBLz9c66De7';
  const auth0Audience =
    process.env.EXPO_PUBLIC_AUTH0_AUDIENCE?.trim() || 'https://api.plate.app';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://plate-api.onrender.com';

  return {
    ...config,
    ...appJson,
    extra: {
      ...config?.extra,
      auth0Domain,
      auth0ClientId,
      auth0Audience,
      apiUrl,
      eas: {
        ...config?.extra?.eas,
        projectId: '6fbd7a5f-207d-4f16-8bf0-e3591bb27cad',
      },
    },
  };
};
