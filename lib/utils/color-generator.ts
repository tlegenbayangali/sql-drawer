/**
 * Generates a muted/pastel color in hex format
 * Uses desaturated colors with controlled lightness
 */
export function generateMutedColor(): string {
  // Predefined muted color palette
  const mutedColors = [
    '#d4c5f9', // Lavender
    '#c5e8f9', // Light blue
    '#c5f9d4', // Mint green
    '#f9e8c5', // Peach
    '#f9c5d4', // Pink
    '#e8c5f9', // Light purple
    '#c5f9e8', // Aqua
    '#f9d4c5', // Coral
    '#d4f9c5', // Light green
    '#c5d4f9', // Periwinkle
    '#f9c5e8', // Rose
    '#e8f9c5', // Light lime
    '#c5f9f9', // Cyan
    '#f9f9c5', // Light yellow
    '#f9c5c5', // Light red
    '#c5e8e8', // Teal
    '#e8c5e8', // Orchid
    '#e8e8c5', // Beige
    '#c5c5f9', // Soft blue
    '#f9c5f9', // Magenta
  ];

  // Select a random color from the palette
  return mutedColors[Math.floor(Math.random() * mutedColors.length)];
}
