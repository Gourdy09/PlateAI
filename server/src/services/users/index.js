import { AppSettings } from '../../models/AppSettings.js';
import { Cart } from '../../models/Cart.js';
import { User } from '../../models/User.js';
import { UserPreferences } from '../../models/UserPreferences.js';
import { serviceUnavailable } from '../../lib/errors.js';

/**
 * Maps a verified Auth0 identity onto MongoDB records, creating the user and
 * their default preferences/settings/cart on first sign-in.
 *
 * Auth0 access tokens often have no email/name claims. We must not write an
 * empty email — a leftover unique email index treats every missing email as
 * the same key, so the second sign-in crashes and every screen 500s.
 */
export async function ensureUserContext(identity, { profileRefreshMs = 86_400_000 } = {}) {
  const now = new Date();
  const previousSeen = (await User.findOne({ auth0Id: identity.auth0Id }).select('lastSeenAt'))?.lastSeenAt;
  let user = await upsertUser(identity, now);

  if (user) {
    const staleProfile = !previousSeen || now - new Date(previousSeen) > profileRefreshMs;
    if (staleProfile) {
      const patch = {};
      if (identity.name && identity.name !== user.name) patch.name = identity.name;
      if (identity.email && identity.email !== user.email) patch.email = identity.email.trim().toLowerCase();
      if (identity.profileImage && identity.profileImage !== user.profileImage) {
        patch.profileImage = identity.profileImage;
      }
      if (Object.keys(patch).length) {
        user = (await User.findByIdAndUpdate(user._id, patch, { returnDocument: 'after' })) || user;
      }
    }
  }

  if (!user?._id) {
    throw serviceUnavailable('Plate could not create your account. Please try again.', {
      internalMessage: `ensureUserContext produced no user for ${identity.auth0Id}`,
    });
  }

  const [preferences, settings] = await Promise.all([
    findOrCreate(UserPreferences, user._id),
    findOrCreate(AppSettings, user._id),
    findOrCreate(Cart, user._id),
  ]);

  return { user, preferences, settings };
}

function profileFields(identity) {
  const fields = {
    name: identity.name || identity.email || 'Chef',
  };
  const email = typeof identity.email === 'string' ? identity.email.trim().toLowerCase() : '';
  if (email) fields.email = email;
  if (identity.profileImage) fields.profileImage = identity.profileImage;
  return fields;
}

async function upsertUser(identity, now) {
  const setOnInsert = profileFields(identity);

  try {
    const user = await User.findOneAndUpdate(
      { auth0Id: identity.auth0Id },
      { $setOnInsert: setOnInsert, $set: { lastSeenAt: now } },
      { upsert: true, returnDocument: 'after' }
    );
    if (user) return user;
  } catch (error) {
    // Duplicate email (legacy unique index) or a raced auth0Id insert.
    if (error?.code !== 11000) throw error;
  }

  const existing = await User.findOne({ auth0Id: identity.auth0Id });
  if (existing) {
    const updated = await User.findByIdAndUpdate(
      existing._id,
      { lastSeenAt: now },
      { returnDocument: 'after' }
    );
    return updated || existing;
  }

  // Last resort: insert without email so a leftover unique email index cannot
  // block a first-time Auth0 user whose token has no email claim.
  try {
    return await User.create({
      auth0Id: identity.auth0Id,
      name: setOnInsert.name,
      lastSeenAt: now,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const raced = await User.findOne({ auth0Id: identity.auth0Id });
      if (raced) return raced;
    }
    throw error;
  }
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
