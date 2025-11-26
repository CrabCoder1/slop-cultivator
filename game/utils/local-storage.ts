// Local storage utilities for player data and local leaderboard

export interface LocalScore {
  score: number;
  wave: number;
  timestamp: number;
  enemiesDefeated: number;
  cultivatorsDeployed: number;
  timePlayed: number;
}

export interface PlayerData {
  playerName: string;
  personalBest: number;
  totalGamesPlayed: number;
  localScores: LocalScore[];
}

const STORAGE_KEY = 'wuxia_player_data';
const MAX_LOCAL_SCORES = 10;

// Generate a random cultivator name
const generateRandomName = (): string => {
  const titles = [
    'Iron Palm', 'Jade Sword', 'Golden Dragon', 'Silver Phoenix',
    'Crimson Fist', 'Azure Cloud', 'Thunder Strike', 'Wind Walker',
    'Shadow Blade', 'Lotus Blossom', 'Mountain Peak', 'River Flow',
    'Storm Rider', 'Moon Shadow', 'Sun Warrior', 'Star Seeker'
  ];
  
  const suffixes = [
    'Master', 'Disciple', 'Elder', 'Sage', 'Warrior', 'Guardian',
    'Protector', 'Champion', 'Hero', 'Legend', 'Immortal', 'Saint'
  ];
  
  const title = titles[Math.floor(Math.random() * titles.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${title} ${suffix}`;
};

// Get player data from localStorage
export const getPlayerData = (): PlayerData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading player data:', error);
  }
  
  // Return default data with random name
  return {
    playerName: generateRandomName(),
    personalBest: 0,
    totalGamesPlayed: 0,
    localScores: [],
  };
};

// Save player data to localStorage
export const savePlayerData = (data: PlayerData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving player data:', error);
  }
};

// Add a new score to local leaderboard
export const addLocalScore = (score: LocalScore): { isNewPB: boolean; playerData: PlayerData } => {
  const playerData = getPlayerData();
  
  // Check if this is a new personal best
  const isNewPB = score.score > playerData.personalBest;
  
  // Update personal best
  if (isNewPB) {
    playerData.personalBest = score.score;
  }
  
  // Add score to local scores
  playerData.localScores.push(score);
  
  // Sort by score descending
  playerData.localScores.sort((a, b) => b.score - a.score);
  
  // Keep only top scores
  if (playerData.localScores.length > MAX_LOCAL_SCORES) {
    playerData.localScores = playerData.localScores.slice(0, MAX_LOCAL_SCORES);
  }
  
  // Increment games played
  playerData.totalGamesPlayed++;
  
  // Save to localStorage
  savePlayerData(playerData);
  
  return { isNewPB, playerData };
};

// Get local leaderboard
export const getLocalLeaderboard = (): LocalScore[] => {
  const playerData = getPlayerData();
  return playerData.localScores;
};

// Update player name
export const updatePlayerName = (newName: string): void => {
  const playerData = getPlayerData();
  playerData.playerName = newName.trim();
  savePlayerData(playerData);
};

// Get player name
export const getPlayerName = (): string => {
  const playerData = getPlayerData();
  return playerData.playerName;
};

// Get personal best
export const getPersonalBest = (): number => {
  const playerData = getPlayerData();
  return playerData.personalBest;
};
