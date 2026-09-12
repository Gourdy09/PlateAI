import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CartItemRow } from '@/components/cart/cart-item-row';
import { TAB_BAR_CONTENT_HEIGHT } from '@/components/nav/tab-bar';
import { Button, IconButton } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenHeader, ScreenScroll } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/states';
import { Section } from '@/components/ui/surface';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useToast } from '@/ctx/toast';
import {
  useAddCartItem,
  useCart,
  useClearCart,
  useMoveCartToFridge,
  useRemoveCartItem,
  useShoppingProviders,
  useUpdateCartItem,
} from '@/api/use-kitchen';
import type { CartItem } from '@/api/types';

const NO_ITEMS: CartItem[] = [];

function groupByCategory(items: CartItem[]) {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.category || 'other';
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function CartScreen() {
  const toast = useToast();
  const cart = useCart();
  const providers = useShoppingProviders();
  const addItem = useAddCartItem();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const moveToFridge = useMoveCartToFridge();

  const [draft, setDraft] = useState('');

  const items = cart.data?.items ?? NO_ITEMS;
  const groups = useMemo(() => groupByCategory(items), [items]);
  const checked = items.filter((item) => item.checked);

  const add = async () => {
    const name = draft.trim();
    if (!name) return;
    try {
      await addItem.mutateAsync({ name });
      setDraft('');
    } catch (error) {
      toast.showError(error, 'That item could not be added.');
    }
  };

  const run = async (action: () => Promise<unknown>, failure: string) => {
    try {
      await action();
    } catch (error) {
      toast.showError(error, failure);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Shopping"
        title="Cart"
        subtitle={
          items.length
            ? `${items.length} item${items.length === 1 ? '' : 's'}, ${checked.length} checked off`
            : undefined
        }
        right={
          items.length > 0 ? (
            <IconButton
              name="trash"
              onPress={() =>
                run(() => clearCart.mutateAsync(undefined), 'The cart could not be cleared.')
              }
              accessibilityLabel="Clear cart"
              size={40}
              loading={clearCart.isPending}
            />
          ) : undefined
        }
      />

      <View style={styles.composer}>
        <TextField
          placeholder="Add an item"
          icon="plus"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          autoCapitalize="none"
          right={
            draft.trim() ? (
              <IconButton
                name="send"
                size={34}
                variant="plain"
                onPress={add}
                accessibilityLabel="Add item to cart"
                loading={addItem.isPending}
              />
            ) : undefined
          }
        />
      </View>

      {cart.isPending ? (
        <LoadingState label="Loading your cart…" />
      ) : cart.isError ? (
        <ErrorState error={cart.error} fallback="Your cart could not load." onRetry={() => cart.refetch()} />
      ) : (
        <ScreenScroll
          onRefresh={() => cart.refetch()}
          refreshing={cart.isRefetching}
          bottomInset={TAB_BAR_CONTENT_HEIGHT + Spacing.five}>
          {providers.data && !providers.data.connected ? (
            <Notice
              tone="info"
              icon="cart"
              title="Shopping list only"
              message={
                providers.data.message ??
                'No grocery service is connected to Plate yet, so prices, delivery, and ordering are not available. Your list is saved here.'
              }
            />
          ) : null}

          {items.length === 0 ? (
            <EmptyState
              icon="cart"
              title="Your cart is empty"
              description="Open a recipe and add what you are missing, or type an item above."
            />
          ) : (
            <>
              {groups.map(([category, group]) => (
                <Section key={category} title={category.replace(/-/g, ' ')}>
                  <View style={styles.group}>
                    {group.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        busy={updateItem.isPending || removeItem.isPending}
                        onToggle={() =>
                          run(
                            () => updateItem.mutateAsync({ id: item.id, checked: !item.checked }),
                            'That item could not be updated.'
                          )
                        }
                        onRemove={() =>
                          run(
                            () => removeItem.mutateAsync(item.id),
                            'That item could not be removed.'
                          )
                        }
                      />
                    ))}
                  </View>
                </Section>
              ))}

              {checked.length > 0 ? (
                <View style={styles.footer}>
                  <Button
                    label={`Move ${checked.length} checked to fridge`}
                    icon="fridge"
                    onPress={() =>
                      run(async () => {
                        const result = await moveToFridge.mutateAsync(
                          checked.map((item) => item.id)
                        );
                        toast.show(
                          `${result.moved.length} item${
                            result.moved.length === 1 ? '' : 's'
                          } added to your fridge.`,
                          'success'
                        );
                      }, 'Those items could not be moved.')
                    }
                    loading={moveToFridge.isPending}
                  />
                  <AppText variant="caption" color="textTertiary" align="center">
                    Moving items updates your fridge so recipe matching stays accurate.
                  </AppText>
                </View>
              ) : null}
            </>
          )}
        </ScreenScroll>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  group: {
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
});
