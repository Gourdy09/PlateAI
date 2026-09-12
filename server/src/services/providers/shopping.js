import { serviceUnavailable } from '../../lib/errors.js';
import { listProviders, requireProvider } from './registry.js';

/**
 * Cross-provider comparison.
 *
 * All arithmetic here is deterministic and runs only on figures the providers
 * actually returned. Quotes missing a total are reported as incomparable rather
 * than being estimated.
 */

export const STRATEGIES = ['lowest-cost', 'fastest', 'balanced'];

export async function searchAcrossProviders(query, context) {
  const available = listProviders().filter((provider) =>
    provider.capabilities.includes('searchProducts')
  );
  if (!available.length) {
    throw serviceUnavailable('No grocery service is connected to Plate yet.');
  }

  const results = await Promise.allSettled(
    available.map(async (summary) => {
      const provider = requireProvider(summary.id, 'searchProducts');
      return { providerId: summary.id, providerName: summary.name, products: await provider.searchProducts(query, context) };
    })
  );

  return {
    query,
    providers: results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value),
    failed: available
      .filter((_, index) => results[index].status === 'rejected')
      .map((provider) => provider.id),
  };
}

function comparable(quote) {
  return typeof quote?.totalCents === 'number';
}

export function rankQuotes(quotes, strategy = 'balanced') {
  const scored = quotes.filter(comparable);
  const incomparable = quotes.filter((quote) => !comparable(quote));

  if (!scored.length) {
    return { best: null, ranked: [], incomparable, reason: 'No provider returned a comparable total.' };
  }

  const byCost = (a, b) => a.totalCents - b.totalCents;
  const byTime = (a, b) => deliveryRank(a) - deliveryRank(b);

  let ranked;
  let reason;
  if (strategy === 'lowest-cost') {
    ranked = [...scored].sort(byCost);
    reason = 'Ordered by the lowest total each store quoted.';
  } else if (strategy === 'fastest') {
    ranked = [...scored].sort(byTime);
    reason = 'Ordered by the earliest delivery window each store quoted.';
  } else {
    const cheapest = Math.min(...scored.map((quote) => quote.totalCents));
    ranked = [...scored].sort((a, b) => {
      const costPenaltyA = (a.totalCents - cheapest) / Math.max(cheapest, 1);
      const costPenaltyB = (b.totalCents - cheapest) / Math.max(cheapest, 1);
      return costPenaltyA + deliveryRank(a) / 1440 - (costPenaltyB + deliveryRank(b) / 1440);
    });
    reason = 'Balanced the quoted totals against the quoted delivery windows.';
  }

  return { best: ranked[0], ranked, incomparable, reason };
}

/** Minutes until the earliest delivery a provider quoted; unknown sorts last. */
function deliveryRank(quote) {
  if (!quote?.earliestDeliveryAt) return Number.MAX_SAFE_INTEGER;
  const timestamp = Date.parse(quote.earliestDeliveryAt);
  if (!Number.isFinite(timestamp)) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, (timestamp - Date.now()) / 60_000);
}
