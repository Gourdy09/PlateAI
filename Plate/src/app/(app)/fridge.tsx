import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, IconButton } from '@/components/ui/button';
import { OptionRow, TextField } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Card, Chip, ChipScroller, Divider, Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import { useTheme } from '@/hooks/use-theme';
import { PhotoPermissionError, pickPhotoFromLibrary, takePhoto } from '@/lib/photos';
import { useBootstrap, useMetaOptions } from '@/api/use-account';
import {
  useAddFridgeItem,
  useAddFridgeItems,
  useFridge,
  useRemoveFridgeItem,
  useScanFridge,
  useUpdateFridgeItem,
} from '@/api/use-kitchen';
import type { FridgeItem, FridgeScan } from '@/api/types';

const NO_ITEMS: FridgeItem[] = [];

export default function FridgeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();

  const fridge = useFridge();
  const meta = useMetaOptions();
  const bootstrap = useBootstrap();
  const addItem = useAddFridgeItem();
  const addItems = useAddFridgeItems();
  const updateItem = useUpdateFridgeItem();
  const removeItem = useRemoveFridgeItem();
  const scan = useScanFridge();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [editing, setEditing] = useState<FridgeItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [scanResult, setScanResult] = useState<FridgeScan | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string | null>(null);

  const items = fridge.data ?? NO_ITEMS;
  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.category));
    return [...unique].sort();
  }, [items]);
  const visible = filter ? items.filter((item) => item.category === filter) : items;

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      toast.showError(error, failure);
    }
  };

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    run(async () => {
      await addItem.mutateAsync({ name: trimmed, category });
      setName('');
    }, 'That ingredient could not be added.');
  };

  const startScan = async (source: 'camera' | 'library') => {
    try {
      const picked = source === 'camera' ? await takePhoto() : await pickPhotoFromLibrary();
      if (!picked) return;
      const result = await scan.mutateAsync({ base64: picked.base64, mimeType: picked.mimeType });
      setScanResult(result);
      setChosen(new Set(result.suggestions.map((entry) => entry.name)));
    } catch (error) {
      if (error instanceof PhotoPermissionError) toast.show(error.message, 'error');
      else toast.showError(error, 'That photo could not be read.');
    }
  };

  const confirmScan = () =>
    run(async () => {
      const picks = (scanResult?.suggestions ?? []).filter((entry) => chosen.has(entry.name));
      if (picks.length === 0) {
        setScanResult(null);
        return;
      }
      const result = await addItems.mutateAsync(picks.map((entry) => ({ name: entry.name })));
      setScanResult(null);
      toast.show(
        `${result.added.length} added${result.skipped.length ? `, ${result.skipped.length} already there` : ''}.`,
        'success'
      );
    }, 'Those ingredients could not be added.');

  const saveEdit = () =>
    run(async () => {
      if (!editing) return;
      await updateItem.mutateAsync({
        id: editing.id,
        name: editing.name,
        quantity: editQuantity.trim(),
        unit: editUnit.trim(),
      });
      setEditing(null);
    }, 'That ingredient could not be updated.');

  return (
    <Screen>
      <ScreenHeader
        eyebrow="What you have"
        title="My fridge"
        subtitle="Plate matches recipes against this list, so keeping it current makes suggestions better."
        onBack
        right={
          <IconButton
            name="camera"
            onPress={() => startScan('camera')}
            accessibilityLabel="Scan ingredients with the camera"
            size={40}
            loading={scan.isPending}
            disabled={!(bootstrap.data?.capabilities.ai ?? true)}
          />
        }
      />

      <View style={styles.composer}>
        <TextField
          placeholder="Add an ingredient"
          icon="plus"
          value={name}
          onChangeText={setName}
          onSubmitEditing={add}
          returnKeyType="done"
          right={
            name.trim() ? (
              <IconButton
                name="send"
                size={34}
                variant="plain"
                onPress={add}
                accessibilityLabel="Add ingredient"
                loading={addItem.isPending}
              />
            ) : undefined
          }
        />
        {name.trim() ? (
          <ChipScroller contentStyle={styles.categoryRow}>
            {(meta.data?.fridgeCategories ?? []).map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={category === option.value}
                onPress={() => setCategory(option.value)}
                size="sm"
              />
            ))}
          </ChipScroller>
        ) : null}
      </View>

      {fridge.isPending ? (
        <LoadingState label="Loading your fridge…" />
      ) : fridge.isError ? (
        <ErrorState
          error={fridge.error}
          fallback="Your fridge could not load."
          onRetry={() => fridge.refetch()}
        />
      ) : (
        <ScreenScroll onRefresh={() => fridge.refetch()} refreshing={fridge.isRefetching}>
          {items.length === 0 ? (
            <EmptyState
              icon="fridge"
              title="Your fridge is empty"
              description="Add what you have, or photograph a shelf and Plate will suggest what it can see."
              action={{ label: 'Scan a photo', icon: 'camera', onPress: () => startScan('camera') }}
              secondaryAction={{ label: 'Choose from library', onPress: () => startScan('library') }}
            />
          ) : (
            <>
              {categories.length > 1 ? (
                <ChipScroller contentStyle={styles.categoryRow}>
                  <Chip label="Everything" selected={filter === null} onPress={() => setFilter(null)} />
                  {categories.map((item) => (
                    <Chip
                      key={item}
                      label={item.replace(/-/g, ' ')}
                      selected={filter === item}
                      onPress={() => setFilter(filter === item ? null : item)}
                    />
                  ))}
                </ChipScroller>
              ) : null}

              <Card padded={false} style={styles.list}>
                {visible.map((item, index) => (
                  <View key={item.id}>
                    {index > 0 ? <Divider /> : null}
                    <View style={styles.itemRow}>
                      <Icon name="leaf" size={18} color={theme.accent} />
                      <View style={styles.itemText}>
                        <AppText variant="body">{item.name}</AppText>
                        {item.quantity || item.unit ? (
                          <AppText variant="caption" color="textSecondary">
                            {[item.quantity, item.unit].filter(Boolean).join(' ')}
                          </AppText>
                        ) : null}
                      </View>
                      <IconButton
                        name="edit"
                        size={34}
                        variant="plain"
                        color={theme.textSecondary}
                        onPress={() => {
                          setEditing(item);
                          setEditQuantity(item.quantity);
                          setEditUnit(item.unit);
                        }}
                        accessibilityLabel={`Edit ${item.name}`}
                      />
                      <IconButton
                        name="trash"
                        size={34}
                        variant="plain"
                        color={theme.textTertiary}
                        onPress={() =>
                          run(
                            () => removeItem.mutateAsync(item.id),
                            'That ingredient could not be removed.'
                          )
                        }
                        accessibilityLabel={`Remove ${item.name}`}
                      />
                    </View>
                  </View>
                ))}
              </Card>

              <Button
                label="Cook something from this"
                icon="utensils"
                onPress={() => router.push('/(app)/generate')}
              />
            </>
          )}
        </ScreenScroll>
      )}

      <Sheet
        visible={scanResult !== null}
        onClose={() => setScanResult(null)}
        title="What Plate can see"
        subtitle="Confirm what is right. Nothing is added until you say so."
        footer={
          <Button
            label={`Add ${chosen.size} ingredient${chosen.size === 1 ? '' : 's'}`}
            onPress={confirmScan}
            disabled={chosen.size === 0}
            loading={addItems.isPending}
          />
        }>
        {scanResult?.summary ? (
          <AppText variant="small" color="textSecondary">
            {scanResult.summary}
          </AppText>
        ) : null}

        {(scanResult?.suggestions ?? []).length === 0 ? (
          <Notice
            tone="info"
            message="Plate could not identify individual ingredients in that photo. Try a closer, brighter shot, or add them by name."
          />
        ) : (
          <Section>
            {(scanResult?.suggestions ?? []).map((suggestion) => {
              const selected = chosen.has(suggestion.name);
              return (
                <OptionRow
                  key={suggestion.name}
                  label={suggestion.name}
                  description={`${suggestion.confidence} confidence`}
                  icon={selected ? 'check-circle' : 'plus'}
                  showChevron={false}
                  onPress={() =>
                    setChosen((current) => {
                      const next = new Set(current);
                      if (next.has(suggestion.name)) next.delete(suggestion.name);
                      else next.add(suggestion.name);
                      return next;
                    })
                  }
                />
              );
            })}
          </Section>
        )}

        {(scanResult?.uncertain ?? []).length > 0 ? (
          <Notice
            tone="warning"
            title="Plate is not sure about"
            message={(scanResult?.uncertain ?? []).join('; ')}
          />
        ) : null}
      </Sheet>

      <Sheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ''}
        subtitle="Amounts help Plate tell whether you have enough."
        footer={<Button label="Save" onPress={saveEdit} loading={updateItem.isPending} />}>
        <View style={styles.editRow}>
          <TextField
            label="Amount"
            placeholder="2"
            value={editQuantity}
            onChangeText={setEditQuantity}
            keyboardType="numbers-and-punctuation"
            containerStyle={styles.editField}
          />
          <TextField
            label="Unit"
            placeholder="cups"
            value={editUnit}
            onChangeText={setEditUnit}
            autoCapitalize="none"
            containerStyle={styles.editField}
          />
        </View>
        <Button
          label="Remove from fridge"
          icon="trash"
          variant="danger"
          onPress={() => {
            if (!editing) return;
            const target = editing;
            setEditing(null);
            run(() => removeItem.mutateAsync(target.id), 'That ingredient could not be removed.');
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  categoryRow: {
    paddingHorizontal: 0,
  },
  list: {
    paddingHorizontal: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
  },
  itemText: {
    flex: 1,
    gap: 1,
  },
  editRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  editField: {
    flex: 1,
  },
});
