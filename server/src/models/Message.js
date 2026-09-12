import mongoose from 'mongoose';

export const MESSAGE_ROLES = ['user', 'assistant'];
export const MESSAGE_TYPES = ['text', 'voice', 'image'];

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true, maxlength: 8000 },
    messageType: { type: String, enum: MESSAGE_TYPES, default: 'text' },
    /** Describes an image the user sent. Plate never stores the image bytes. */
    imageSummary: { type: String, trim: true, maxlength: 600, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);

export function publicMessage(message) {
  return {
    id: message._id.toString(),
    role: message.role,
    content: message.content,
    messageType: message.messageType,
    imageSummary: message.imageSummary || '',
    createdAt: message.createdAt,
  };
}
