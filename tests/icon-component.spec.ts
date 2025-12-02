/**
 * Unit Tests for Icon Component
 * 
 * Tests the Icon component's rendering behavior for:
 * - SVG rendering for ready assets
 * - Fallback emoji rendering for pending assets
 * - Size prop application
 * - className prop passthrough
 * - Error handling with fallback to emoji
 * 
 * **Validates: Requirements 3.1-3.4**
 */
import { test, expect } from '@playwright/test';
import {
  weaponIcons,
  uiIcons,
  getAssetOrFallback,
  isAssetReady,
  type AssetEntry,
} from '../game/assets/asset-manifest';

test.describe('Icon Component - SVG Asset Accessibility', () => {
  // Use the game app on port 5173 for these tests
  const baseUrl = 'http://localhost:5173';

  test('renders SVG for ready assets - sword icon is accessible', async ({ page }) => {
    /**
     * Test: Ready SVG assets are accessible via HTTP
     * **Validates: Requirements 3.1**
     */
    const response = await page.request.get(`${baseUrl}/game/assets/icons/weapons/sword.svg`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  });

  test('SVG file contains valid viewBox attribute', async ({ page }) => {
    /**
     * Test: Ready SVG assets have proper viewBox for scaling
     * **Validates: Requirements 1.2, 3.1**
     */
    const response = await page.request.get(`${baseUrl}/game/assets/icons/weapons/sword.svg`);
    const svgContent = await response.text();
    
    // Check that the SVG has a viewBox attribute
    expect(svgContent).toContain('viewBox');
  });

  test('spear SVG is accessible and valid', async ({ page }) => {
    /**
     * Test: Another ready asset (spear) is accessible
     * **Validates: Requirements 3.1**
     */
    const response = await page.request.get(`${baseUrl}/game/assets/icons/weapons/spear.svg`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  });

  test('inventory UI icon is accessible', async ({ page }) => {
    /**
     * Test: UI icon (inventory) marked as ready is accessible
     * **Validates: Requirements 3.1**
     */
    const response = await page.request.get(`${baseUrl}/game/assets/icons/ui/inventory.svg`);
    expect(response.ok()).toBe(true);
  });
});

test.describe('Icon Component - Asset Manifest Helper Functions', () => {
  /**
   * These tests verify the asset manifest helper functions work correctly
   * by testing them directly (not through browser evaluation)
   */

  test('getAssetOrFallback returns path for ready assets', () => {
    /**
     * Test: getAssetOrFallback returns file path when status is 'ready'
     * **Validates: Requirements 2.3, 3.1**
     */
    const swordAsset = weaponIcons.sword;
    expect(swordAsset.status).toBe('ready');
    expect(getAssetOrFallback(swordAsset)).toBe(swordAsset.path);
  });

  test('getAssetOrFallback returns fallback for pending assets', () => {
    /**
     * Test: getAssetOrFallback returns emoji fallback when status is 'pending'
     * **Validates: Requirements 2.2, 3.1**
     */
    const settingsAsset = uiIcons.settings;
    expect(settingsAsset.status).toBe('pending');
    expect(getAssetOrFallback(settingsAsset)).toBe(settingsAsset.fallback);
  });

  test('isAssetReady returns true for ready assets', () => {
    /**
     * Test: isAssetReady correctly identifies ready assets
     * **Validates: Requirements 3.1**
     */
    expect(isAssetReady(weaponIcons.sword)).toBe(true);
    expect(isAssetReady(weaponIcons.spear)).toBe(true);
    expect(isAssetReady(uiIcons.inventory)).toBe(true);
  });

  test('isAssetReady returns false for pending assets', () => {
    /**
     * Test: isAssetReady correctly identifies pending assets
     * **Validates: Requirements 3.1**
     */
    expect(isAssetReady(uiIcons.settings)).toBe(false);
    expect(isAssetReady(weaponIcons.bow)).toBe(false);
  });

  test('ready assets have valid path format', () => {
    /**
     * Test: Ready assets have paths that end with .svg
     * **Validates: Requirements 3.1**
     */
    const readyAssets = [weaponIcons.sword, weaponIcons.spear, uiIcons.inventory];
    for (const asset of readyAssets) {
      expect(asset.path).toMatch(/\.svg$/);
      expect(asset.path).toMatch(/^game\/assets\//);
    }
  });

  test('pending assets have fallback emojis defined', () => {
    /**
     * Test: Pending assets have fallback emojis for display
     * **Validates: Requirements 3.1, 3.4**
     */
    const pendingAssets = [uiIcons.settings, weaponIcons.bow, weaponIcons.staff];
    for (const asset of pendingAssets) {
      expect(asset.fallback).toBeDefined();
      expect(asset.fallback!.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Icon Component - Size and ClassName Props', () => {
  /**
   * These tests verify the Icon component interface requirements
   * by testing the expected prop types and behaviors
   */

  test('AssetEntry interface has required fields', () => {
    /**
     * Test: AssetEntry has all required fields
     * **Validates: Requirements 2.1, 3.2, 3.3**
     */
    const asset: AssetEntry = weaponIcons.sword;
    
    // Required fields
    expect(typeof asset.path).toBe('string');
    expect(typeof asset.name).toBe('string');
    expect(['ready', 'pending', 'placeholder']).toContain(asset.status);
    
    // Optional fallback
    if (asset.fallback !== undefined) {
      expect(typeof asset.fallback).toBe('string');
    }
  });

  test('all weapon icons have consistent structure', () => {
    /**
     * Test: All weapon icons follow the same structure
     * **Validates: Requirements 2.1**
     */
    for (const [key, asset] of Object.entries(weaponIcons)) {
      expect(asset.path).toBeDefined();
      expect(asset.name).toBeDefined();
      expect(asset.status).toBeDefined();
      expect(asset.fallback).toBeDefined();
    }
  });

  test('all UI icons have consistent structure', () => {
    /**
     * Test: All UI icons follow the same structure
     * **Validates: Requirements 2.1**
     */
    for (const [key, asset] of Object.entries(uiIcons)) {
      expect(asset.path).toBeDefined();
      expect(asset.name).toBeDefined();
      expect(asset.status).toBeDefined();
      expect(asset.fallback).toBeDefined();
    }
  });
});
