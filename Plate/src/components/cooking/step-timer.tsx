import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useHaptics } from '@/lib/haptics';

/**
 * Reads a duration out of the step text and offers a timer for it. Nothing is
 * invented: if the step names no time, no timer is offered.
 */
export function findStepDurationSeconds(step: string) {
  const pattern =
    /(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)/gi;
  let longest = 0;

  for (const match of step.matchAll(pattern)) {
    // A range such as "5-7 minutes" times the longer end so nothing burns early.
    const value = Number(match[2] ?? match[1]);
    if (!Number.isFinite(value) || value <= 0) continue;
    const unit = match[3].toLowerCase();
    const seconds = unit.startsWith('h') ? value * 3600 : unit.startsWith('m') ? value * 60 : value;
    if (seconds > longest) longest = seconds;
  }

  return longest > 0 ? Math.round(longest) : null;
}

function format(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The countdown is derived from a wall-clock deadline rather than a counter, so it
 * stays accurate even if the interval is throttled while the phone is idle.
 *
 * Mount this with a key tied to the step so a new step starts with a fresh timer.
 */
export function StepTimer({ step }: { step: string }) {
  const duration = useMemo(() => findStepDurationSeconds(step), [step]);
  const haptics = useHaptics();

  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const remaining =
    endsAt !== null ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : pausedAt;
  const done = remaining === 0;
  const started = endsAt !== null || pausedAt !== null;

  useEffect(() => {
    if (endsAt === null) return;
    const ticker = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(ticker);
  }, [endsAt]);

  useEffect(() => {
    if (done) haptics.success();
  }, [done, haptics]);

  if (duration === null) return null;

  const start = (seconds: number) => {
    setNow(Date.now());
    setEndsAt(Date.now() + seconds * 1000);
    setPausedAt(null);
  };

  const reset = () => {
    setEndsAt(null);
    setPausedAt(null);
  };

  return (
    <View style={styles.wrap}>
      {!started ? (
        <Button
          label={`Start ${format(duration)} timer`}
          icon="clock"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onPress={() => start(duration)}
        />
      ) : (
        <View style={styles.running}>
          <AppText variant="title">{format(remaining ?? 0)}</AppText>
          {done ? (
            <AppText variant="small" color="textSecondary">
              Time is up. Check the pan before moving on.
            </AppText>
          ) : null}
          <View style={styles.controls}>
            {!done ? (
              <Button
                label={endsAt !== null ? 'Pause' : 'Resume'}
                variant="secondary"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  if (endsAt !== null) {
                    setPausedAt(remaining ?? 0);
                    setEndsAt(null);
                  } else {
                    start(pausedAt ?? duration);
                  }
                }}
              />
            ) : null}
            <Button
              label={done ? 'Reset timer' : 'Cancel'}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={reset}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  running: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
