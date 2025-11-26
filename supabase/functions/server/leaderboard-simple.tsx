// Stage 2: Simple leaderboard functions using KV store
import * as kv from "./kv_store.tsx";

export interface ScoreEntry {
  playerName: string;
  score: number;
  wave: number;
  timestamp: string;
}

export interface StoredScore extends ScoreEntry {
  id: string;
}

// Submit a score to the leaderboard
export async function submitScore(entry: ScoreEntry): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate unique ID
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const key = `leaderboard:score:${id}`;
    
    // Create stored score
    const storedScore: StoredScore = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };
    
    // Save to KV store
    await kv.set(key, JSON.stringify(storedScore));
    
    console.log(`Score submitted: ${key}`, storedScore);
    
    return { success: true, id };
  } catch (error) {
    console.error('Error submitting score:', error);
    return { success: false, error: error.message };
  }
}

// Get top scores from the leaderboard
export async function getTopScores(limit: number = 100): Promise<StoredScore[]> {
  try {
    // Get all scores with the prefix
    const scores = await kv.getByPrefix('leaderboard:score:');
    
    // Parse and sort scores
    const parsedScores: StoredScore[] = scores
      .map(scoreStr => {
        try {
          return JSON.parse(scoreStr) as StoredScore;
        } catch (e) {
          console.error('Error parsing score:', e);
          return null;
        }
      })
      .filter(score => score !== null) as StoredScore[];
    
    // Sort by score (descending), then by wave (descending)
    parsedScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.wave - a.wave;
    });
    
    // Return top N
    return parsedScores.slice(0, limit);
  } catch (error) {
    console.error('Error getting top scores:', error);
    return [];
  }
}
