/**
 * SVG Validation Utilities
 * 
 * Provides parsing and validation functions for SVG assets to ensure
 * consistency with design guidelines (viewBox, color palette).
 */

// ============================================================================
// COLOR PALETTE - Approved colors from design document
// ============================================================================

export const ASSET_COLORS = {
  // Metals
  steel: { light: '#B8C4D0', dark: '#5D3A1A', highlight: '#D4DEE8' },
  
  // Materials
  leather: { primary: '#8B5A2B', secondary: '#A0522D', dark: '#8B4513' },
  wood: { primary: '#8B4513', light: '#CD853F' },
  
  // Accents
  gold: { primary: '#DAA520', dark: '#B8860B' },
  crimson: '#8B0000',
  
  // Energy/Magic
  qi: { cyan: '#7DD3FC', purple: '#A78BFA' },
  lightning: { yellow: '#FBBF24', blue: '#60A5FA' },
  fire: { orange: '#F97316', red: '#EF4444' },
  
  // Status
  heal: '#22C55E',
  poison: '#84CC16',
  shield: '#3B82F6',
} as const;

/**
 * Flattened list of all approved color values (uppercase for comparison)
 */
export function getApprovedColors(): string[] {
  const colors: string[] = [];
  
  function extractColors(obj: unknown): void {
    if (typeof obj === 'string') {
      colors.push(obj.toUpperCase());
    } else if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        extractColors(value);
      }
    }
  }
  
  extractColors(ASSET_COLORS);
  return colors;
}

// Special color values that are always allowed
export const SPECIAL_COLORS = ['none', 'currentColor', 'transparent', 'inherit'];

// ============================================================================
// SVG PARSING TYPES
// ============================================================================

export interface SVGParseResult {
  viewBox: string | null;
  colors: string[];
  width: string | null;
  height: string | null;
  isValid: boolean;
  errors: string[];
}

export interface ColorValidationResult {
  isValid: boolean;
  invalidColors: string[];
  validColors: string[];
}

// ============================================================================
// SVG PARSER
// ============================================================================

/**
 * Parse SVG content and extract key attributes
 */
export function parseSVG(svgContent: string): SVGParseResult {
  const result: SVGParseResult = {
    viewBox: null,
    colors: [],
    width: null,
    height: null,
    isValid: true,
    errors: [],
  };
  
  if (!svgContent || typeof svgContent !== 'string') {
    result.isValid = false;
    result.errors.push('SVG content is empty or invalid');
    return result;
  }
  
  // Check for SVG root element
  if (!svgContent.includes('<svg')) {
    result.isValid = false;
    result.errors.push('No SVG root element found');
    return result;
  }
  
  // Extract viewBox attribute
  result.viewBox = extractAttribute(svgContent, 'viewBox');
  
  // Extract width and height
  result.width = extractAttribute(svgContent, 'width');
  result.height = extractAttribute(svgContent, 'height');
  
  // Extract all color values (fill and stroke)
  result.colors = extractColors(svgContent);
  
  return result;
}

/**
 * Extract a specific attribute value from SVG content
 */
export function extractAttribute(svgContent: string, attributeName: string): string | null {
  // Match attribute="value" or attribute='value'
  const regex = new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, 'i');
  const match = svgContent.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract all color values from SVG content (fill and stroke attributes)
 */
export function extractColors(svgContent: string): string[] {
  const colors: string[] = [];
  
  // Match fill="value" or fill='value'
  const fillRegex = /fill\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = fillRegex.exec(svgContent)) !== null) {
    colors.push(match[1]);
  }
  
  // Match stroke="value" or stroke='value'
  const strokeRegex = /stroke\s*=\s*["']([^"']+)["']/gi;
  while ((match = strokeRegex.exec(svgContent)) !== null) {
    colors.push(match[1]);
  }
  
  // Also check for inline style colors
  const styleColorRegex = /style\s*=\s*["'][^"']*(?:fill|stroke)\s*:\s*([^;"']+)/gi;
  while ((match = styleColorRegex.exec(svgContent)) !== null) {
    colors.push(match[1].trim());
  }
  
  return colors;
}

// ============================================================================
// VIEWBOX VALIDATION
// ============================================================================

/**
 * Validate that viewBox matches the expected format "0 0 24 24"
 */
export function validateViewBox(viewBox: string | null): boolean {
  if (!viewBox) return false;
  return viewBox.trim() === '0 0 24 24';
}

/**
 * Parse viewBox into components
 */
export function parseViewBox(viewBox: string): { minX: number; minY: number; width: number; height: number } | null {
  if (!viewBox) return null;
  
  const parts = viewBox.trim().split(/\s+/);
  if (parts.length !== 4) return null;
  
  const [minX, minY, width, height] = parts.map(Number);
  
  if ([minX, minY, width, height].some(isNaN)) return null;
  
  return { minX, minY, width, height };
}

// ============================================================================
// COLOR PALETTE VALIDATION
// ============================================================================

/**
 * Normalize a color value for comparison
 */
export function normalizeColor(color: string): string {
  return color.trim().toUpperCase();
}

/**
 * Check if a color is in the approved palette
 */
export function isApprovedColor(color: string): boolean {
  const normalized = normalizeColor(color);
  
  // Check special values (case-insensitive)
  if (SPECIAL_COLORS.some(sc => sc.toUpperCase() === normalized)) {
    return true;
  }
  
  // Check against approved palette
  const approvedColors = getApprovedColors();
  return approvedColors.includes(normalized);
}

/**
 * Validate all colors in an SVG against the approved palette
 */
export function validateColors(colors: string[]): ColorValidationResult {
  const validColors: string[] = [];
  const invalidColors: string[] = [];
  
  for (const color of colors) {
    if (isApprovedColor(color)) {
      validColors.push(color);
    } else {
      invalidColors.push(color);
    }
  }
  
  return {
    isValid: invalidColors.length === 0,
    invalidColors,
    validColors,
  };
}

// ============================================================================
// FULL SVG VALIDATION
// ============================================================================

export interface SVGValidationResult {
  isValid: boolean;
  viewBoxValid: boolean;
  colorsValid: boolean;
  parseResult: SVGParseResult;
  colorValidation: ColorValidationResult;
  errors: string[];
}

/**
 * Perform full validation of an SVG file content
 */
export function validateSVG(svgContent: string): SVGValidationResult {
  const parseResult = parseSVG(svgContent);
  const colorValidation = validateColors(parseResult.colors);
  const viewBoxValid = validateViewBox(parseResult.viewBox);
  
  const errors: string[] = [...parseResult.errors];
  
  if (!viewBoxValid) {
    errors.push(`Invalid viewBox: expected "0 0 24 24", got "${parseResult.viewBox}"`);
  }
  
  if (!colorValidation.isValid) {
    errors.push(`Invalid colors found: ${colorValidation.invalidColors.join(', ')}`);
  }
  
  return {
    isValid: parseResult.isValid && viewBoxValid && colorValidation.isValid,
    viewBoxValid,
    colorsValid: colorValidation.isValid,
    parseResult,
    colorValidation,
    errors,
  };
}
