import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canonicalIngredientName,
  combineQuantities,
  normalizeUnit,
  parseAmount,
} from '../src/services/ingredients/units.js';
import { compareIngredients, fridgeCoverage } from '../src/services/ingredients/match.js';

describe('quantity parsing', () => {
  it('parses whole numbers, decimals, and fractions', () => {
    assert.equal(parseAmount('2'), 2);
    assert.equal(parseAmount('0.5'), 0.5);
    assert.equal(parseAmount('1/2'), 0.5);
    assert.equal(parseAmount('1 1/2'), 1.5);
  });

  it('parses vulgar fractions', () => {
    assert.equal(parseAmount('½'), 0.5);
    assert.equal(parseAmount('2¼'), 2.25);
  });

  it('takes the upper bound of a range so shopping does not fall short', () => {
    assert.equal(parseAmount('2-3'), 3);
    assert.equal(parseAmount('1 to 2'), 2);
  });

  it('returns null for amounts it cannot add up', () => {
    assert.equal(parseAmount('a handful'), null);
    assert.equal(parseAmount(''), null);
    assert.equal(parseAmount(undefined), null);
  });
});

describe('unit normalisation', () => {
  it('collapses aliases', () => {
    assert.equal(normalizeUnit('Tablespoons'), 'tbsp');
    assert.equal(normalizeUnit('tbsp.'), 'tbsp');
    assert.equal(normalizeUnit('lbs'), 'lb');
    assert.equal(normalizeUnit('grams'), 'g');
  });
});

describe('combining quantities', () => {
  it('adds matching units', () => {
    assert.deepEqual(combineQuantities({ quantity: '1', unit: 'cup' }, { quantity: '1/2', unit: 'cups' }), {
      quantity: '1 1/2',
      unit: 'cup',
    });
  });

  it('refuses to combine mismatched units rather than guessing', () => {
    assert.equal(combineQuantities({ quantity: '1', unit: 'cup' }, { quantity: '2', unit: 'tbsp' }), null);
  });

  it('refuses to combine unparseable amounts', () => {
    assert.equal(combineQuantities({ quantity: 'a pinch', unit: '' }, { quantity: '1', unit: '' }), null);
  });
});

describe('canonical ingredient names', () => {
  it('strips quantities, descriptors, and parentheticals', () => {
    assert.equal(
      canonicalIngredientName('2 large boneless, skinless chicken breasts (about 1 lb)'),
      'chicken breast'
    );
    assert.equal(canonicalIngredientName('freshly grated Parmesan cheese'), 'parmesan cheese');
    assert.equal(canonicalIngredientName('3 cloves garlic, minced'), 'garlic');
  });
});

describe('fridge comparison', () => {
  const fridge = [
    { _id: 'a', name: 'chicken' },
    { _id: 'b', name: 'broccoli' },
    { _id: 'c', name: 'olive oil' },
  ];

  it('matches a broader fridge item to a specific recipe line', () => {
    const result = compareIngredients([{ name: '2 chicken breasts' }], fridge);
    assert.equal(result.have.length, 1);
    assert.equal(result.have[0].matchedFridgeItem.name, 'chicken');
  });

  it('separates missing from optional ingredients', () => {
    const result = compareIngredients(
      [
        { name: 'chicken breast' },
        { name: 'gochujang' },
        { name: 'toasted sesame seeds', optional: true },
      ],
      fridge
    );
    assert.deepEqual(result.missing.map((item) => item.name), ['gochujang']);
    assert.deepEqual(result.optional.map((item) => item.name), ['toasted sesame seeds']);
  });

  it('does not match on a weak shared word alone', () => {
    const result = compareIngredients([{ name: 'sesame oil' }], fridge);
    assert.equal(result.have.length, 0);
    assert.equal(result.missing.length, 1);
  });

  it('reports coverage as a percentage of required ingredients', () => {
    const comparison = compareIngredients(
      [{ name: 'chicken' }, { name: 'broccoli' }, { name: 'rice' }, { name: 'ginger' }],
      fridge
    );
    assert.equal(fridgeCoverage(comparison), 50);
  });

  it('reports zero coverage for an empty fridge', () => {
    assert.equal(fridgeCoverage(compareIngredients([{ name: 'rice' }], [])), 0);
  });
});
