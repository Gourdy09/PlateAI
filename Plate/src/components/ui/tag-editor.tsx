import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Free-text list editor for things like dislikes and favourite ingredients. */
export function TagEditor({
  values,
  onChange,
  placeholder,
  emptyLabel = 'Nothing added yet.',
  max = 40,
  busy = false,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyLabel?: string;
  max?: number;
  busy?: boolean;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    const exists = values.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists && values.length < max) onChange([...values, value]);
    setDraft('');
  };

  return (
    <View style={styles.wrap}>
      <TextField
        placeholder={placeholder}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
        right={
          draft.trim() ? (
            <IconButton
              name="plus"
              size={34}
              variant="plain"
              onPress={add}
              accessibilityLabel="Add"
              loading={busy}
            />
          ) : undefined
        }
      />

      {values.length === 0 ? (
        <AppText variant="caption" color="textTertiary">
          {emptyLabel}
        </AppText>
      ) : (
        <View style={styles.tags}>
          {values.map((value) => (
            <View
              key={value}
              style={[styles.tag, { backgroundColor: theme.chip, borderColor: theme.border }]}>
              <AppText variant="small">{value}</AppText>
              <IconButton
                name="close"
                size={22}
                variant="plain"
                color={theme.textSecondary}
                onPress={() => onChange(values.filter((item) => item !== value))}
                accessibilityLabel={`Remove ${value}`}
                disabled={busy}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Read-only summary row, used to preview a list without editing it. */
export function TagSummary({ values, icon }: { values: string[]; icon?: 'warning' | 'leaf' }) {
  const theme = useTheme();
  if (values.length === 0) return null;

  return (
    <View style={styles.summary}>
      {icon ? <Icon name={icon} size={15} color={theme.textSecondary} /> : null}
      <AppText variant="small" color="textSecondary" style={styles.summaryText}>
        {values.join(', ')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.three,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  summaryText: {
    flex: 1,
  },
});
