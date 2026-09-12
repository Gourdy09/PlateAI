import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Lifts bottom composers and fields above the software keyboard.
 * Android `adjustResize` is unreliable with Expo Router screens, so Android
 * pads by the real keyboard height instead of relying on KeyboardAvoidingView.
 */
export function KeyboardAvoid({
  children,
  style,
  offset = 0,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  offset?: number;
}) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'ios') return;
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={[{ flex: 1 }, style]}
        behavior="padding"
        keyboardVerticalOffset={offset}>
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>{children}</View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={[
        { flex: 1, paddingBottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom },
        style,
      ]}>
      {children}
    </View>
  );
}
