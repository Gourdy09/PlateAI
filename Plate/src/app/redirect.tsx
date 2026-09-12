import { useEffect } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/**
 * Auth0 / expo-auth-session redirect landing path (`plate://redirect` / web `/redirect`).
 */
export default function AuthRedirectScreen() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return <View />;
}
