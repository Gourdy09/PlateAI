import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'placed',
  'preparing',
  'in_transit',
  'delivered',
  'cancelled',
  'failed',
];

/**
 * An Order only exists once a grocery provider confirmed it and returned its own
 * order id. Every price and status here is a value the provider reported.
 */
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: String, required: true, trim: true },
    providerName: { type: String, trim: true },
    providerOrderId: { type: String, required: true, trim: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    items: {
      type: [
        {
          name: { type: String, trim: true },
          quantity: { type: Number, min: 0 },
          priceCents: { type: Number, min: 0, default: null },
          _id: false,
        },
      ],
      default: [],
    },
    totals: {
      subtotalCents: { type: Number, min: 0, default: null },
      deliveryFeeCents: { type: Number, min: 0, default: null },
      taxCents: { type: Number, min: 0, default: null },
      totalCents: { type: Number, min: 0, default: null },
    },
    currency: { type: String, trim: true, maxlength: 3, default: null },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ providerId: 1, providerOrderId: 1 }, { unique: true });

export const Order = mongoose.model('Order', orderSchema);

export function publicOrder(order) {
  return {
    id: order._id.toString(),
    providerId: order.providerId,
    providerName: order.providerName || order.providerId,
    providerOrderId: order.providerOrderId,
    status: order.status,
    items: order.items,
    totals: order.totals,
    currency: order.currency,
    placedAt: order.placedAt,
  };
}
