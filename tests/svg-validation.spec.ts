/**
 * Property-Based Tests for SVG Validation
 * 
 * Tests Properties 7-8 from the SVG Asset System design document.
 * These tests validate that ready SVG assets conform to design guidelines.
 */
import { test, expect } from '@playwright/test';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  uiIcons,
  weaponIcons,
  skillIcons,
  itemIcons,
  statIcons,
  speciesSprites,
  combatEffects,
  magicEffects,
  movementEffects,
  statusEffects,
  levelBadges,
  type AssetEntry,
} from '../game/assets/asset-manifest';
import {
  parseSVG,
  validateViewBox,
  validateColors,
  isApprovedColor,
  getApprovedColors,
  SPECIAL_COLORS,
} from '../game/utils/svg-validator';

// Helper to get all assets from all categories
function getAllAssets(): AssetEntry[] {
  return [
    ...Object.values(uiIcons),
    ...Object.values(weaponIcons),
    ...Object.values(skillIcons),
    ...Object.values(itemIcons),
    ...Object.values(statIcons),
    ...Object.values(speciesSprites),
    ...Object.values(combatEffects),
    ...Object.values(magicEffects),
    ...Object.values(movementEffects),
    ...Object.values(statusEffects),
    ...Object.values(levelBadges),
  ];
}

// Helper to get ready assets only
function getReadyAssets(): AssetEntry[] {
  return getAllAssets().filter(a => a.status === 'ready');
}

// Helper to read SVG file content
function readSVGFile(assetPath: string): string | null {
  try {
    const fullPath = path.resolve(process.cwd(), assetPath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

test.describe('SVG Validation - Property 7: ViewBox Consistency', () => {
  /**
   * **Feature: svg-asset-system, Property 7: ViewBox Consistency**
   * **Validates: Requirements 5.1, 1.2**
   * 
   * For any SVG file with status 'ready', the file SHALL contain a viewBox
   * attribute with value "0 0 24 24".
   */
  
  test('All ready SVG assets have viewBox "0 0 24 24"', () => {
    const readyAssets = getReadyAssets();
    
    if (readyAssets.length === 0) {
      console.log('No ready assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...readyAssets),
        (entry) => {
          const svgContent = readSVGFile(entry.path);
          
          if (svgContent === null) {
            console.log(`Could not read SVG file: ${entry.path}`);
            // File doesn't exist - this is a separate concern from viewBox validation
            // The asset is marked ready but file is missing
            return false;
          }
          
          const parseResult = parseSVG(svgContent);
          const isValid = validateViewBox(parseResult.viewBox);
          
          if (!isValid) {
            console.log(`Invalid viewBox for "${entry.name}": expected "0 0 24 24", got "${parseResult.viewBox}"`);
          }
          
          return isValid;
        }
      ),
      { numRuns: readyAssets.length }
    );
  });
  
  test('ViewBox validation correctly identifies valid viewBox', () => {
    expect(validateViewBox('0 0 24 24')).toBe(true);
    expect(validateViewBox(' 0 0 24 24 ')).toBe(true); // with whitespace
  });
  
  test('ViewBox validation correctly rejects invalid viewBox', () => {
    expect(validateViewBox(null)).toBe(false);
    expect(validateViewBox('')).toBe(false);
    expect(validateViewBox('0 0 32 32')).toBe(false);
    expect(validateViewBox('0 0 16 16')).toBe(false);
    expect(validateViewBox('0 0 24')).toBe(false);
  });
});

test.describe('SVG Validation - Property 8: Color Palette Compliance', () => {
  /**
   * **Feature: svg-asset-system, Property 8: Color Palette Compliance**
   * **Validates: Requirements 5.2**
   * 
   * For any SVG file with status 'ready', all color values (fill, stroke)
   * SHALL be from the approved color palette or 'none'/'currentColor'.
   */
  
  test('All ready SVG assets use only approved colors', () => {
    const readyAssets = getReadyAssets();
    
    if (readyAssets.length === 0) {
      console.log('No ready assets to test');
      return;
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...readyAssets),
        (entry) => {
          const svgContent = readSVGFile(entry.path);
          
          if (svgContent === null) {
            console.log(`Could not read SVG file: ${entry.path}`);
            return false;
          }
          
          const parseResult = parseSVG(svgContent);
          const colorValidation = validateColors(parseResult.colors);
          
          if (!colorValidation.isValid) {
            console.log(`Invalid colors in "${entry.name}": ${colorValidation.invalidColors.join(', ')}`);
          }
          
          return colorValidation.isValid;
        }
      ),
      { numRuns: readyAssets.length }
    );
  });
  
  test('Special colors are always approved', () => {
    for (const color of SPECIAL_COLORS) {
      expect(isApprovedColor(color)).toBe(true);
    }
  });
  
  test('Approved palette colors are recognized', () => {
    const approvedColors = getApprovedColors();
    
    // Test a few known colors from the palette
    expect(isApprovedColor('#B8C4D0')).toBe(true); // steel.light
    expect(isApprovedColor('#DAA520')).toBe(true); // gold.primary
    expect(isApprovedColor('#8B0000')).toBe(true); // crimson
    expect(isApprovedColor('#8B5A2B')).toBe(true); // leather.primary
    
    // Case insensitive
    expect(isApprovedColor('#b8c4d0')).toBe(true);
    expect(isApprovedColor('#daa520')).toBe(true);
  });
  
  test('Non-palette colors are rejected', () => {
    expect(isApprovedColor('#FF0000')).toBe(false); // pure red
    expect(isApprovedColor('#00FF00')).toBe(false); // pure green
    expect(isApprovedColor('#0000FF')).toBe(false); // pure blue
    expect(isApprovedColor('red')).toBe(false); // named color
    expect(isApprovedColor('rgb(255, 0, 0)')).toBe(false); // rgb format
  });
});

test.describe('SVG Parser Unit Tests', () => {
  test('parseSVG extracts viewBox correctly', () => {
    const svg = '<svg viewBox="0 0 24 24"><rect/></svg>';
    const result = parseSVG(svg);
    expect(result.viewBox).toBe('0 0 24 24');
  });
  
  test('parseSVG extracts colors from fill attributes', () => {
    const svg = '<svg viewBox="0 0 24 24"><rect fill="#B8C4D0"/><circle fill="#DAA520"/></svg>';
    const result = parseSVG(svg);
    expect(result.colors).toContain('#B8C4D0');
    expect(result.colors).toContain('#DAA520');
  });
  
  test('parseSVG extracts colors from stroke attributes', () => {
    const svg = '<svg viewBox="0 0 24 24"><path stroke="#8B0000"/></svg>';
    const result = parseSVG(svg);
    expect(result.colors).toContain('#8B0000');
  });
  
  test('parseSVG handles invalid SVG content', () => {
    const result = parseSVG('not an svg');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('parseSVG handles empty content', () => {
    const result = parseSVG('');
    expect(result.isValid).toBe(false);
  });
  
  test('parseSVG extracts width and height', () => {
    const svg = '<svg viewBox="0 0 24 24" width="24" height="24"><rect/></svg>';
    const result = parseSVG(svg);
    expect(result.width).toBe('24');
    expect(result.height).toBe('24');
  });
});
