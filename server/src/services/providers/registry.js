import { serviceUnavailable } from '../../lib/errors.js';
import { PROVIDER_CAPABILITIES } from './types.js';

/**
 * Registry of grocery providers.
 *
 * Intentionally empty: no grocery API is connected to this deployment. Adding a
 * real integration means implementing the GroceryProvider contract in
 * ./types.js and calling `registerProvider` here at startup. Until then the app
 * reports shopping as unavailable instead of showing invented prices or orders.
 */
const providers = new Map();

export function registerProvider(provider) {
  if (!provider?.id || typeof provider.isConfigured !== 'function') {
    throw new Error('A grocery provider needs an id and an isConfigured() function.');
  }
  const unknown = (provider.capabilities || []).filter(
    (capability) => !PROVIDER_CAPABILITIES.includes(capability)
  );
  if (unknown.length) {
    throw new Error(`Unknown provider capabilities: ${unknown.join(', ')}`);
  }
  providers.set(provider.id, provider);
}

export function listProviders() {
  return [...providers.values()]
    .filter((provider) => provider.isConfigured())
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      capabilities: provider.capabilities || [],
    }));
}

export function getProvider(id) {
  const provider = providers.get(id);
  if (!provider || !provider.isConfigured()) return null;
  return provider;
}

export function requireProvider(id, capability) {
  const provider = getProvider(id);
  if (!provider) {
    throw serviceUnavailable(
      'That grocery service is not connected to Plate. Your shopping list is saved and ready when one is.'
    );
  }
  if (capability && !(provider.capabilities || []).includes(capability)) {
    throw serviceUnavailable(`${provider.name} does not support that yet.`);
  }
  return provider;
}

export function hasAnyProvider() {
  return listProviders().length > 0;
}
