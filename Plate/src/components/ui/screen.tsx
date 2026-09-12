import { useRouter } from 'expo-router';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { MaxContentWidth, Plate, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The shell every screen sits in: themed background, the same soft washes as the
 * sign-in screens, safe-area handling, and a capped content width so the layout
 * holds together on tablets and the web.
 */
export function Screen({
  children,
  edges = ['top', 'left', 'right'],
  washes = true,
  style,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  washes?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {washes ? (
        <>
          <View
            pointerEvents="none"
            style={[styles.herbWash, { backgroundColor: Plate.herbWash, opacity: 0.34 }]}
          />
          <View
            pointerEvents="none"
            style={[styles.spiceWash, { backgroundColor: Plate.spiceWash, opacity: 0.32 }]}
          />
        </>
      ) : null}
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={[styles.content, style]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  right,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Pass `true` to use router.back(), or a handler for custom dismissal. */
  onBack?: boolean | (() => void);
  right?: React.ReactNode;
  compact?: boolean;
}) {
  const router = useRouter();
  const theme = useTheme();
  const handleBack = typeof onBack === 'function' ? onBack : () => router.back();

  return (
    <View style={[styles.header, compact ? styles.headerCompact : null]}>
      <View style={styles.headerTop}>
        {onBack ? (
          <IconButton
            name="arrow-left"
            onPress={handleBack}
            accessibilityLabel="Go back"
            variant="surface"
            size={40}
          />
        ) : null}
        <View style={styles.headerText}>
          {eyebrow ? (
            <AppText variant="eyebrow" tint={theme.primary} uppercase>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant={compact ? 'heading' : 'title'} numberOfLines={2}>
            {title}
          </AppText>
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
      {subtitle ? (
        <AppText variant="small" color="textSecondary">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Standard vertical scroller with pull-to-refresh wired to a real refetch. */
export function ScreenScroll({
  children,
  onRefresh,
  refreshing = false,
  contentStyle,
  bottomInset = Spacing.six,
}: {
  children: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bottomInset?: number;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  herbWash: {
    position: 'absolute',
    top: 84,
    right: -46,
    width: 152,
    height: 152,
    borderRadius: 76,
  },
  spiceWash: {
    position: 'absolute',
    bottom: 120,
    left: -64,
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  headerCompact: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
});
