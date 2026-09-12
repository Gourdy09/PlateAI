import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
    cookingSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CookingSession', default: null },
    title: { type: String, trim: true, maxlength: 140, default: 'Plate' },
    lastMessageAt: { type: Date, default: Date.now },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, cookingSessionId: 1 });
conversationSchema.index({ userId: 1, recipeId: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);

export function publicConversation(conversation) {
  return {
    id: conversation._id.toString(),
    title: conversation.title,
    recipeId: conversation.recipeId ? conversation.recipeId.toString() : null,
    cookingSessionId: conversation.cookingSessionId
      ? conversation.cookingSessionId.toString()
      : null,
    messageCount: conversation.messageCount,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}
