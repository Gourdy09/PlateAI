import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { TAB_BAR_CONTENT_HEIGHT } from '@/components/nav/tab-bar';
import { Button } from '@/components/ui/button';
import { OptionRow } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Card, Divider, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/ctx/auth';
import { useToast } from '@/ctx/toast';
import { useTheme } from '@/hooks/use-theme';
import { useBootstrap } from '@/api/use-account';

export default function YouScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const { signOut } = useAuth();
  const bootstrap = useBootstrap();

  const user = bootstrap.data?.user;
  const stats = bootstrap.data?.stats;
  const preferences = bootstrap.data?.preferences;
  const capabilities = bootstrap.data?.capabilities;

  return (
    <Screen>
      <ScreenHeader eyebrow="Your kitchen" title="You" />

      {bootstrap.isPending ? (
        <LoadingState label="Loading your profile…" />
      ) : bootstrap.isError ? (
        <ErrorState
          error={bootstrap.error}
          fallback="Your profile could not load."
          onRetry={() => bootstrap.refetch()}
        />
      ) : (
        <ScreenScroll
          onRefresh={() => bootstrap.refetch()}
          refreshing={bootstrap.isRefetching}
          bottomInset={TAB_BAR_CONTENT_HEIGHT + Spacing.five}>
          <Card>
            <View style={styles.profile}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primaryWash }]}>
                  <Icon name="user" size={26} color={theme.primary} />
                </View>
              )}
              <View style={styles.profileText}>
                <AppText variant="heading" numberOfLines={1}>
                  {user?.name || 'Chef'}
                </AppText>
                {user?.email ? (
                  <AppText variant="small" color="textSecondary" numberOfLines={1}>
                    {user.email}
                  </AppText>
                ) : null}
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.stats}>
              <Stat label="Saved" value={stats?.savedRecipes ?? 0} />
              <Stat label="Swipes" value={stats?.swipes ?? 0} />
              <Stat label="In fridge" value={stats?.fridgeItems ?? 0} />
              <Stat label="Cooked" value={stats?.recipesCooked ?? 0} />
            </View>
          </Card>

          {capabilities && !capabilities.ai ? (
            <Notice
              tone="warning"
              title="AI features are off"
              message="This Plate backend has no Gemini API key configured, so recipe generation and the cooking assistant are unavailable."
            />
          ) : null}

          <Section title="Your kitchen">
            <Card padded={false} style={styles.menu}>
              <OptionRow
                label="My fridge"
                icon="fridge"
                value={stats ? `${stats.fridgeItems} items` : undefined}
                onPress={() => router.push('/(app)/fridge')}
              />
              <Divider />
              <OptionRow
                label="Taste and diet"
                icon="leaf"
                value={
                  preferences?.allergies.length
                    ? `${preferences.allergies.length} allergies on file`
                    : 'No allergies set'
                }
                onPress={() => router.push('/(app)/preferences')}
              />
              <Divider />
              <OptionRow
                label="Swipe history"
                icon="clock"
                onPress={() => router.push('/(app)/history')}
              />
              <Divider />
              <OptionRow
                label="Conversations with Plate"
                icon="mic"
                onPress={() => router.push('/(app)/chat')}
              />
            </Card>
          </Section>

          <Section title="App">
            <Card padded={false} style={styles.menu}>
              <OptionRow
                label="Settings"
                icon="settings"
                value={bootstrap.data?.settings.theme === 'system' ? 'System theme' : undefined}
                onPress={() => router.push('/(app)/settings')}
              />
            </Card>
          </Section>

          <Button
            label="Sign out"
            icon="logout"
            variant="secondary"
            onPress={() => {
              signOut().catch((error) => toast.showError(error, 'Sign out did not finish.'));
            }}
          />
        </ScreenScroll>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 3,
  },
  divider: {
    marginVertical: Spacing.three,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  menu: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
