// Synthetic data used only in tests, not Jutsu rules or production catalog entries.
export function createTestGameData() {
  return {
    ninjaTypes: [
      {
        name: 'Physical',
        stats: { chakra: 0, movement: 1, attack: 2, defense: 3, skill: 4, health: 5 },
      },
      {
        name: 'Defensive',
        stats: { chakra: 6, movement: 7, attack: 8, defense: 9, skill: 10, health: 11 },
      },
    ],
    techniqueGroups: ['Taijutsu', 'Medical'].map((name, groupIndex) => ({
      name,
      techniques: Array.from({ length: 3 }, (_, index) => ({
        name: `Test technique ${groupIndex}-${index}`,
        description: `Test description ${groupIndex}-${index}`,
        chakra: index,
        isMokushin: index === 1,
      })),
    })),
    weapons: Array.from({ length: 4 }, (_, index) => ({
      name: `Test weapon ${index + 1}`,
      description: `Weapon description ${index + 1}`,
      cost: index === 0 ? '1 action' : '2 actions',
    })),
    items: Array.from({ length: 3 }, (_, index) => ({
      name: `Test item ${index + 1}`,
      description: `Item description ${index + 1}`,
      cost: '1 action',
    })),
  };
}
