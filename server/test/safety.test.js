import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkRecipeAgainstUser,
  detectAllergens,
  findAllergyViolations,
  findDietViolations,
  findDislikeMatches,
} from '../src/services/recipes/safety.js';

function recipe(title, ingredients, instructions = ['Cook it.']) {
  return {
    title,
    description: '',
    ingredients: ingredients.map((name) => (typeof name === 'string' ? { name } : name)),
    instructions,
  };
}

describe('allergy detection', () => {
  it('flags a direct allergen', () => {
    const hits = findAllergyViolations(
      recipe('Peanut noodles', ['peanut butter', 'rice noodles']),
      ['peanuts']
    );
    assert.equal(hits.length, 1);
    assert.equal(hits[0].label, 'Peanuts');
  });

  it('flags hidden gluten in soy sauce', () => {
    const hits = findAllergyViolations(recipe('Stir fry', ['soy sauce', 'broccoli']), ['gluten']);
    assert.equal(hits.length, 1);
  });

  it('flags hidden fish in worcestershire sauce', () => {
    const hits = findAllergyViolations(
      recipe('Caesar dressing', ['worcestershire sauce', 'lemon']),
      ['fish']
    );
    assert.equal(hits.length, 1);
  });

  it('matches singular and plural allergy spellings', () => {
    const target = recipe('Cashew curry', ['cashews', 'coconut milk']);
    assert.equal(findAllergyViolations(target, ['tree nuts']).length, 1);
    assert.equal(findAllergyViolations(target, ['tree nut']).length, 1);
  });

  it('respects an allergy Plate does not have a group for', () => {
    const hits = findAllergyViolations(recipe('Mango salad', ['mango', 'lime']), ['mango']);
    assert.equal(hits.length, 1);
  });
});

describe('allergy false positives', () => {
  const cases = [
    ['coconut milk is not dairy', recipe('Thai curry', ['coconut milk', 'chicken']), ['dairy']],
    ['almond milk is not dairy', recipe('Smoothie', ['almond milk', 'banana']), ['dairy']],
    ['peanut butter is not dairy', recipe('Toast', ['peanut butter', 'gluten-free bread']), ['dairy']],
    ['butternut squash is not dairy', recipe('Soup', ['butternut squash', 'onion']), ['dairy']],
    ['cream of tartar is not dairy', recipe('Meringue', ['cream of tartar', 'sugar']), ['dairy']],
    ['eggplant is not eggs', recipe('Baba ganoush', ['eggplant', 'tahini']), ['eggs']],
    ['coconut is not a tree nut', recipe('Rice', ['coconut', 'jasmine rice']), ['tree nuts']],
    ['nutmeg is not a tree nut', recipe('Spiced milk', ['nutmeg', 'oat milk']), ['tree nuts']],
    ['almond flour is not gluten', recipe('Cake', ['almond flour', 'eggs']), ['gluten']],
    ['rice noodles are not gluten', recipe('Pho', ['rice noodles', 'beef']), ['gluten']],
    ['tamari is not gluten', recipe('Bowl', ['tamari', 'rice']), ['gluten']],
    ['oyster mushrooms are not shellfish', recipe('Ragu', ['oyster mushroom', 'tomato']), ['shellfish']],
    ['coconut aminos are not soy', recipe('Marinade', ['coconut aminos', 'ginger']), ['soy']],
    ['mustard greens are not mustard', recipe('Greens', ['mustard greens', 'garlic']), ['mustard']],
    ['wine vinegar is not sulfites', recipe('Dressing', ['red wine vinegar', 'olive oil']), ['sulfites']],
  ];

  for (const [name, target, allergies] of cases) {
    it(name, () => {
      assert.deepEqual(findAllergyViolations(target, allergies), []);
    });
  }
});

describe('dietary restrictions', () => {
  it('blocks meat for a vegetarian', () => {
    const hits = findDietViolations(recipe('Bolognese', ['ground beef', 'tomato']), ['vegetarian']);
    assert.equal(hits.length, 1);
  });

  it('blocks dairy for a vegan but allows it for a vegetarian', () => {
    const target = recipe('Cacio e pepe', ['parmesan', 'pasta', 'black pepper']);
    assert.equal(findDietViolations(target, ['vegan']).length, 1);
    assert.equal(findDietViolations(target, ['vegetarian']).length, 0);
  });

  it('allows fish for a pescatarian but not chicken', () => {
    assert.equal(findDietViolations(recipe('Salmon', ['salmon', 'dill']), ['pescatarian']).length, 0);
    assert.equal(
      findDietViolations(recipe('Roast chicken', ['chicken thigh', 'thyme']), ['pescatarian']).length,
      1
    );
  });

  it('blocks pork and gelatin for halal', () => {
    assert.equal(findDietViolations(recipe('Carbonara', ['pancetta', 'egg']), ['halal']).length, 1);
    assert.equal(findDietViolations(recipe('Panna cotta', ['gelatin', 'cream']), ['halal']).length, 1);
  });

  it('blocks shellfish for kosher', () => {
    assert.equal(findDietViolations(recipe('Shrimp scampi', ['shrimp', 'butter']), ['kosher']).length, 1);
  });

  it('ignores advisory diets that are about ratios', () => {
    assert.deepEqual(findDietViolations(recipe('Steak', ['ribeye', 'butter']), ['keto', 'paleo']), []);
  });

  it('allows a plant-based version of a normally animal dish', () => {
    const target = recipe('Vegan bolognese', ['beyond meat', 'tomato', 'vegan butter']);
    assert.deepEqual(findDietViolations(target, ['vegan']), []);
  });
});

describe('dislikes and reporting', () => {
  it('reports dislikes without making the recipe unsafe', () => {
    const target = recipe('Olive pasta', ['olive', 'gluten-free pasta']);
    const result = checkRecipeAgainstUser(target, { allergies: [], dietaryRestrictions: [], dislikes: ['olive'] });
    assert.equal(result.safe, true);
    assert.deepEqual(result.dislikeMatches, ['olive']);
  });

  it('finds dislikes case-insensitively', () => {
    assert.deepEqual(findDislikeMatches(recipe('Salad', ['Cilantro', 'lime']), ['cilantro']), ['cilantro']);
  });

  it('labels every allergen it can see in a recipe', () => {
    const detected = detectAllergens(recipe('Pad thai', ['peanuts', 'shrimp', 'egg', 'fish sauce']));
    assert.ok(detected.includes('Peanuts'));
    assert.ok(detected.includes('Shellfish'));
    assert.ok(detected.includes('Eggs'));
    assert.ok(detected.includes('Fish'));
    assert.ok(!detected.includes('Dairy'));
  });

  it('checks instruction text, not just the ingredient list', () => {
    const target = recipe('Finished pasta', ['gluten-free pasta'], [
      'Boil the pasta.',
      'Finish with grated parmesan.',
    ]);
    assert.equal(findAllergyViolations(target, ['dairy']).length, 1);
  });
});
