import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, unique: true },
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    profileImage: { type: String, trim: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { sparse: true });

export const User = mongoose.model('User', userSchema);

/** Older schemas marked email unique. Missing emails then collide and block sign-in. */
export async function alignUserIndexes() {
  try {
    const indexes = await User.collection.indexes();
    for (const index of indexes) {
      if (index.key?.email === 1 && index.unique) {
        await User.collection.dropIndex(index.name);
        console.log(`[db] dropped leftover unique index ${index.name} on users.email`);
      }
    }
  } catch (error) {
    console.warn('[db] could not align user indexes:', error.message);
  }
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name || '',
    email: user.email || '',
    profileImage: user.profileImage || null,
    createdAt: user.createdAt,
  };
}
