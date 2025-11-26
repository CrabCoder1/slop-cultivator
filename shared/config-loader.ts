/**
 * Configuration Loader
 * Loads game configuration from JSON files or defaults
 * Used by both game and admin tool
 */

export interface GameConfig {
  cultivators?: any;
  enemies?: any;
  items?: any;
  skills?: any;
  map?: any;
}

const CONFIG_STORAGE_KEY = 'castle-defense-config';

/**
 * Load configuration from localStorage
 */
export function loadConfig(): GameConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: GameConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

/**
 * Clear all custom configuration
 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing config:', error);
  }
}

/**
 * Export configuration as JSON file
 */
export function exportConfigFile(config: GameConfig, filename: string = 'game-config.json'): void {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import configuration from JSON file
 */
export function importConfigFile(): Promise<GameConfig> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          resolve(config);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };

    input.click();
  });
}
