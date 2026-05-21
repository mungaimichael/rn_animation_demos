// Background and container colors
export const COLORS = {
  background: '#f7f7f7',
} as const;

export const CONTAINER_BG = COLORS.background;
export const DEFAULT_QR_CONTENT = 'https://enzo.fyi';

// Color palette for lighting
export const PALETTE = {
  skyZenith: { r: 0.82, g: 0.88, b: 0.92 },
  skyHorizon: { r: 0.91, g: 0.93, b: 0.91 },
  sun: { r: 1.15, g: 1.05, b: 0.95 },
  skyFill: { r: 0.85, g: 0.9, b: 0.95 },
  bounce: { r: 0.5, g: 0.65, b: 0.42 },
} as const;

// Block/cube dimensions
export const BLOCK_SIZE = 0.0245;
export const CUBE_HEIGHT = BLOCK_SIZE;

// Tree structure parameters
export const TRUNK_RADIUS = 2.5;
export const TRUNK_LAYERS = 12;
export const MAX_CANOPY_LAYERS = 12;
export const CANOPY_OUTER_RADIUS_FACTOR = 0.46;

// Grid limits
export const MAX_GRID_SIZE = 41;
export const MAX_BLOCKS = MAX_GRID_SIZE * MAX_GRID_SIZE * 18;

// Camera angles for 3D isometric view
export const ISO_ANGLE_Y = 0.78;
export const ISO_ANGLE_X = -0.55;

// Camera angles for 2D flat view (top-down for QR scanning)
export const FLAT_ANGLE_Y = 0.0;
export const FLAT_ANGLE_X = -1.5708; // -π/2

// Animation
export const LERP_SPEED = 4.0;

// View scaling
export const VIEW_SCALE_3D = 1.6;
export const VIEW_SCALE_2D = 2.1;

// Centering offsets for 2D view
export const Y_OFFSET_2D = 0.08;
export const X_OFFSET_2D = 0.015;

// ============================================
// SKIA ORGANIC TREE CONSTANTS
// ============================================

// Seasonal canopy color palettes (arrays of hex colors for gradient mixing)
export const CANOPY_COLORS = {
  spring: ['#f5b7c5', '#e899a8', '#d47a8c', '#c25b70', '#f0ccd5', '#fce4ec'],
  summer: ['#7cb342', '#8bc34a', '#aed581', '#558b2f', '#9ccc65', '#c5e1a5'],
  autumn: ['#fef3e2', '#f9d78f', '#f0a43a', '#e67e22', '#d35400', '#c0392b', '#fdebd0', '#f5cba7'],
  winter: ['#ecf0f1', '#bdc3c7', '#95a5a6', '#d5f5e3', '#abebc6', '#dfe6e9'],
} as const;

// Trunk colors
export const BARK_COLORS = {
  light: '#8d6e63',
  mid: '#6d4c41',
  dark: '#4e342e',
  line: '#3e2723',
} as const;

// Grass colors per season
export const GRASS_COLORS = {
  spring: ['#66bb6a', '#43a047', '#2e7d32', '#81c784'],
  summer: ['#558b2f', '#33691e', '#689f38', '#7cb342'],
  autumn: ['#8d6e63', '#a1887f', '#6d4c41', '#bcaaa4', '#c8b88a', '#9e9d24'],
  winter: ['#b0bec5', '#90a4ae', '#78909c', '#cfd8dc'],
} as const;

// Fallen leaf colors
export const FALLEN_LEAF_COLORS = {
  spring: ['#f48fb1', '#f06292', '#ec407a'],
  summer: ['#aed581', '#9ccc65', '#8bc34a'],
  autumn: ['#ffb74d', '#ff9800', '#f57c00', '#e65100', '#d84315'],
  winter: ['#b0bec5', '#90a4ae', '#78909c'],
} as const;

// Skia tree geometry (relative to canvas dimensions)
export const TREE_GEOMETRY = {
  // Trunk
  trunkWidthRatio: 0.05,      // Fraction of canvas width
  trunkHeightRatio: 0.22,     // Fraction of canvas height
  trunkCenterXRatio: 0.5,     // Horizontal center
  trunkBaseYRatio: 0.62,      // Where trunk meets ground

  // Canopy
  canopyRadiusXRatio: 0.32,   // Horizontal radius as fraction of width
  canopyRadiusYRatio: 0.28,   // Vertical radius as fraction of height
  canopyCenterYRatio: 0.32,   // Vertical center of canopy
  canopyLayers: 18,           // Number of overlapping cloud blobs

  // Branches
  branchCount: 5,
  branchMaxLength: 0.18,      // Fraction of canvas width

  // Grass
  grassBladeCount: 35,
  grassMaxHeight: 0.04,       // Fraction of canvas height

  // Fallen leaves
  fallenLeafCount: 12,
  fallenLeafSize: 0.015,      // Fraction of canvas width
} as const;
