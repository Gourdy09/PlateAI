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

userSchema.index({ email: 1 });

export const User = mongoose.model('User', userSchema);

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name || '',
    email: user.email || '',
    profileImage: user.profileImage || null,
    createdAt: user.createdAt,
  };
}
