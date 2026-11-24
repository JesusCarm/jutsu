// Synthetic data used only in tests, not Jutsu rules or production catalog entries.
export function createTestGameData() {
  return {
    ninjaTypes: [
      {
        id: 'physical',
        stats: { chakra: 0, movement: 1, attack: 2, defense: 3, skill: 4, health: 5 },
      },
      {
        id: 'defensive',
        stats: { chakra: 6, movement: 7, attack: 8, defense: 9, skill: 10, health: 11 },
      },
    ],
    techniqueGroups: ['taijutsu', 'medical'].map((id, groupIndex) => ({
      id,
      techniques: Array.from({ length: 3 }, (_, index) => ({
        id: `Test technique ${groupIndex}-${index}`,
        parameters: {},
        chakra: index,
        isMokushin: index === 1,
      })),
    })),
    weapons: Array.from({ length: 4 }, (_, index) => ({
      id: `Test weapon ${index + 1}`,
      parameters: {},
      cost: {amount: index === 0 ? 1 : 2, unit: 'action'},
    })),
    items: Array.from({ length: 3 }, (_, index) => ({
      id: `Test item ${index + 1}`,
      parameters: {},
      cost: {amount: 1, unit: 'action'},
    })),
  };
}
