import { AppSettings } from '../../models/AppSettings.js';
import { Cart } from '../../models/Cart.js';
import { User } from '../../models/User.js';
import { UserPreferences } from '../../models/UserPreferences.js';

/**
 * Maps a verified Auth0 identity onto MongoDB records, creating the user and
 * their default preferences/settings/cart on first sign-in.
 */
export async function ensureUserContext(identity, { profileRefreshMs = 86_400_000 } = {}) {
  const now = new Date();
  let user = await User.findOne({ auth0Id: identity.auth0Id });

  if (!user) {
    user = await User.create({
      auth0Id: identity.auth0Id,
      name: identity.name || identity.email || 'Chef',
      email: identity.email,
      profileImage: identity.profileImage,
      lastSeenAt: now,
    }).catch(async (error) => {
      // Two concurrent first requests can race the unique index; reuse the winner.
      if (error?.code === 11000) return User.findOne({ auth0Id: identity.auth0Id });
      throw error;
    });
  } else {
    const staleProfile = now - new Date(user.lastSeenAt ?? 0) > profileRefreshMs;
    const patch = { lastSeenAt: now };
    if (staleProfile) {
      if (identity.name && identity.name !== user.name) patch.name = identity.name;
      if (identity.email && identity.email !== user.email) patch.email = identity.email;
      if (identity.profileImage && identity.profileImage !== user.profileImage) {
        patch.profileImage = identity.profileImage;
      }
    }
    user = await User.findByIdAndUpdate(user._id, patch, { new: true });
  }

  const [preferences, settings] = await Promise.all([
    findOrCreate(UserPreferences, user._id),
    findOrCreate(AppSettings, user._id),
    findOrCreate(Cart, user._id),
  ]);

  return { user, preferences, settings };
}

async function findOrCreate(Model, userId) {
  const existing = await Model.findOne({ userId });
  if (existing) return existing;
  try {
    return await Model.create({ userId });
  } catch (error) {
    if (error?.code === 11000) return Model.findOne({ userId });
    throw error;
  }
}

export { findOrCreate };
