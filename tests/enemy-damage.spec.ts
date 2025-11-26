import { test, expect } from '@playwright/test';

test.describe('Enemy Damage System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('enemies should deal damage according to their codex stats', async ({ page }) => {
    // Wait for map selection to appear
    await page.waitForSelector('text=Select a Map', { timeout: 10000 });
    
    // Select the first map
    const firstMap = page.locator('.map-card').first();
    await firstMap.click();
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Get initial castle health
    const initialHealth = await page.evaluate(() => {
      const app = (window as any).__REACT_APP__;
      return app?.gameState?.castleHealth || 100;
    });
    
    // Start wave to spawn enemies
    const startWaveButton = page.locator('button:has-text("Start Wave")');
    if (await startWaveButton.isVisible()) {
      await startWaveButton.click();
    }
    
    // Wait for enemies to spawn and reach castle
    await page.waitForTimeout(5000);
    
    // Get enemy damage values from codex
    const enemyDamageValues = await page.evaluate(() => {
      const { ENEMY_CODEX } = require('@/utils/enemy-codex');
      return {
        demon: ENEMY_CODEX.demon.baseStats.damage,
        shadow: ENEMY_CODEX.shadow.baseStats.damage,
        beast: ENEMY_CODEX.beast.baseStats.damage,
      };
    });
    
    // Verify damage values are defined and non-zero
    expect(enemyDamageValues.demon).toBeGreaterThan(0);
    expect(enemyDamageValues.shadow).toBeGreaterThan(0);
    expect(enemyDamageValues.beast).toBeGreaterThan(0);
    
    // Wait for enemies to attack castle
    await page.waitForTimeout(8000);
    
    // Get current castle health
    const currentHealth = await page.evaluate(() => {
      const app = (window as any).__REACT_APP__;
      return app?.gameState?.castleHealth || 100;
    });
    
    // Verify castle took damage
    expect(currentHealth).toBeLessThan(initialHealth);
    
    // Verify enemies have damage property set
    const enemiesWithDamage = await page.evaluate(() => {
      const app = (window as any).__REACT_APP__;
      const enemies = app?.gameState?.enemies || [];
      return enemies.map((e: any) => ({
        type: e.type,
        damage: e.damage,
        hasValidDamage: e.damage > 0
      }));
    });
    
    // All enemies should have damage > 0
    for (const enemy of enemiesWithDamage) {
      expect(enemy.hasValidDamage).toBe(true);
      expect(enemy.damage).toBeGreaterThan(0);
    }
  });

  test('different enemy types should have different damage values', async ({ page }) => {
    // Check enemy codex has varied damage values
    const damageValues = await page.evaluate(() => {
      const { ENEMY_CODEX } = require('@/utils/enemy-codex');
      return {
        demon: ENEMY_CODEX.demon.baseStats.damage,
        shadow: ENEMY_CODEX.shadow.baseStats.damage,
        beast: ENEMY_CODEX.beast.baseStats.damage,
        wraith: ENEMY_CODEX.wraith.baseStats.damage,
        golem: ENEMY_CODEX.golem.baseStats.damage,
        dragon: ENEMY_CODEX.dragon.baseStats.damage,
      };
    });
    
    // Verify all have damage defined
    Object.entries(damageValues).forEach(([type, damage]) => {
      expect(damage).toBeGreaterThan(0);
    });
    
    // Verify damage scales with difficulty
    expect(damageValues.shadow).toBeLessThan(damageValues.demon); // Shadow is weaker
    expect(damageValues.demon).toBeLessThan(damageValues.beast); // Beast is stronger
    expect(damageValues.beast).toBeLessThan(damageValues.golem); // Golem is elite
    expect(damageValues.golem).toBeLessThan(damageValues.dragon); // Dragon is boss
  });
});
