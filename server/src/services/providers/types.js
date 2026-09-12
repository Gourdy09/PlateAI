/**
 * Grocery provider contract.
 *
 * Plate ships with no provider implementations. Every number a provider returns
 * (price, availability, delivery window, order id) must come from that provider's
 * API — Plate never estimates or invents them. A provider that cannot answer a
 * capability simply omits it, and the app tells the user that information is not
 * available rather than filling in a plausible value.
 *
 * @typedef {'searchProducts'|'quoteCart'|'createOrder'|'getOrderStatus'} ProviderCapability
 *
 * @typedef {object} ProviderProduct
 * @property {string} providerProductId
 * @property {string} name
 * @property {string} [brand]
 * @property {string} [size]
 * @property {number} [priceCents]   Omit entirely when the API does not return a price.
 * @property {string} [currency]
 * @property {boolean} [inStock]
 * @property {string} [imageUrl]
 *
 * @typedef {object} ProviderQuote
 * @property {{ providerProductId: string, quantity: number, priceCents?: number }[]} lineItems
 * @property {number} [subtotalCents]
 * @property {number} [deliveryFeeCents]
 * @property {number} [taxCents]
 * @property {number} [totalCents]
 * @property {string} [currency]
 * @property {string} [earliestDeliveryAt]  ISO timestamp, only if the API returns one.
 *
 * @typedef {object} GroceryProvider
 * @property {string} id
 * @property {string} name
 * @property {ProviderCapability[]} capabilities
 * @property {() => boolean} isConfigured
 * @property {(query: string, context: object) => Promise<ProviderProduct[]>} [searchProducts]
 * @property {(items: object[], context: object) => Promise<ProviderQuote>} [quoteCart]
 * @property {(quote: ProviderQuote, context: object) => Promise<object>} [createOrder]
 * @property {(providerOrderId: string, context: object) => Promise<object>} [getOrderStatus]
 */

export const PROVIDER_CAPABILITIES = ['searchProducts', 'quoteCart', 'createOrder', 'getOrderStatus'];
