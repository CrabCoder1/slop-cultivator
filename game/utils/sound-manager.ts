// Sound Manager for Xianxia Tower Defense
// Uses Web Audio API to generate themed sound effects

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private volume: number = 0.5;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.6;
  private muted: boolean = false;
  private backgroundMusic: OscillatorNode | null = null;
  private musicInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();
      
      this.masterGain.connect(this.audioContext.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      
      this.updateVolumes();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  private updateVolumes() {
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }

  // Create a tone with envelope
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    destination: GainNode,
    volumeMultiplier: number = 1
  ) {
    if (!this.audioContext || !destination) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(destination);

    // ADSR envelope
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(0.3 * volumeMultiplier, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2 * volumeMultiplier, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2 * volumeMultiplier, now + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Play a chord (multiple frequencies)
  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', destination: GainNode) {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, type, destination, 0.3);
    });
  }

  // Sword Cultivator attack - sharp blade sound
  playSwordAttack() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Metallic swoosh
    this.playTone(800, 0.15, 'sawtooth', this.sfxGain, 0.4);
    setTimeout(() => {
      this.playTone(600, 0.1, 'sawtooth', this.sfxGain, 0.3);
    }, 50);
  }

  // Palm Master attack - qi blast
  playPalmAttack() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Whoosh with low frequency
    this.playTone(200, 0.2, 'sine', this.sfxGain, 0.5);
    setTimeout(() => {
      this.playTone(150, 0.15, 'sine', this.sfxGain, 0.4);
    }, 80);
  }

  // Arrow Sage attack - bow release
  playArrowAttack() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // String twang
    this.playTone(400, 0.08, 'triangle', this.sfxGain, 0.5);
    // Arrow whistle
    setTimeout(() => {
      this.playTone(1200, 0.3, 'sine', this.sfxGain, 0.2);
    }, 50);
  }

  // Lightning Lord attack - thunder crack
  playLightningAttack() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Thunder crack
    this.playTone(100, 0.15, 'sawtooth', this.sfxGain, 0.6);
    setTimeout(() => {
      this.playTone(80, 0.2, 'square', this.sfxGain, 0.4);
    }, 50);
  }

  // Enemy hit - impact sound
  playEnemyHit() {
    if (!this.audioContext || !this.sfxGain) return;
    
    this.playTone(300, 0.1, 'square', this.sfxGain, 0.3);
  }

  // Enemy defeated - vanquish sound
  playEnemyDefeated() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Descending tones
    this.playTone(600, 0.15, 'sine', this.sfxGain, 0.4);
    setTimeout(() => {
      this.playTone(400, 0.15, 'sine', this.sfxGain, 0.3);
    }, 80);
    setTimeout(() => {
      this.playTone(200, 0.2, 'sine', this.sfxGain, 0.2);
    }, 150);
  }

  // Tower placed - spiritual energy
  playTowerPlaced() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Ascending mystical chime
    this.playChord([523.25, 659.25, 783.99], 0.3, 'sine', this.sfxGain); // C5, E5, G5
  }

  // Tower sold - energy dissipation
  playSellTower() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Descending mystical chime (opposite of placement)
    this.playChord([783.99, 659.25, 523.25], 0.25, 'sine', this.sfxGain); // G5, E5, C5
  }

  // Castle damaged - alarm
  playCastleDamaged() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Warning bell
    this.playTone(880, 0.2, 'triangle', this.sfxGain, 0.7);
    setTimeout(() => {
      this.playTone(880, 0.2, 'triangle', this.sfxGain, 0.7);
    }, 200);
  }

  // Wave start - ceremonial gong
  playWaveStart() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Deep gong sound
    this.playTone(110, 0.8, 'sine', this.sfxGain, 0.6);
    this.playTone(220, 0.8, 'sine', this.sfxGain, 0.3);
  }

  // Game over - defeat
  playGameOver() {
    if (!this.audioContext || !this.sfxGain) return;
    
    // Dramatic descending sequence
    const notes = [523, 494, 440, 392, 349];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.4, 'triangle', this.sfxGain, 0.5);
      }, i * 150);
    });
  }

  // UI click - subtle
  playUIClick() {
    if (!this.audioContext || !this.sfxGain) return;
    
    this.playTone(800, 0.05, 'sine', this.sfxGain, 0.2);
  }

  // UI hover - very subtle
  playUIHover() {
    if (!this.audioContext || !this.sfxGain) return;
    
    this.playTone(600, 0.03, 'sine', this.sfxGain, 0.1);
  }

  // Start ambient background music - pentatonic meditation theme
  startBackgroundMusic() {
    if (this.backgroundMusic || !this.audioContext || !this.musicGain) return;
    
    // Pentatonic scale (Chinese scale): C, D, E, G, A
    const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00]; // C4, D4, E4, G4, A4
    const bassPentatonic = [130.81, 146.83, 164.81, 196.00, 220.00]; // C3, D3, E3, G3, A3
    
    let currentIndex = 0;
    
    const playNote = () => {
      if (!this.audioContext || !this.musicGain) return;
      
      // Play melody note
      const melodyNote = pentatonicNotes[currentIndex % pentatonicNotes.length];
      this.playTone(melodyNote, 2, 'sine', this.musicGain, 0.15);
      
      // Occasionally play bass note
      if (currentIndex % 3 === 0) {
        const bassNote = bassPentatonic[Math.floor(currentIndex / 3) % bassPentatonic.length];
        this.playTone(bassNote, 3, 'sine', this.musicGain, 0.1);
      }
      
      currentIndex = (currentIndex + 1) % 12;
    };
    
    // Play first note immediately
    playNote();
    
    // Continue playing notes at intervals
    this.musicInterval = window.setInterval(playNote, 2000);
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
    }
  }

  // Volume controls
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.updateVolumes();
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  getVolume() {
    return this.volume;
  }

  // Clean up
  dispose() {
    this.stopBackgroundMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();