/** @type {import('expo/config').ExpoConfig} */
const appJson = {
  name: 'Plate',
  slug: 'Plate',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'plate',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.plateai.plate',
  },
  android: {
    package: 'com.plateai.plate',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    softwareKeyboardLayoutMode: 'resize',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#fff8ef',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default () => {
  const auth0Domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN?.trim() || null;
  const auth0ClientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID?.trim() || null;

  return {
    ...appJson,
    extra: {
      auth0Domain,
      auth0ClientId,
    },
  };
};
