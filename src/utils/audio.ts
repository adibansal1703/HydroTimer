/**
 * Utility to generate natural water bubble sounds using Web Audio API
 */
export function playWaterSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Helper to create a single "bubble" pop sound
    const createBubble = (startTime: number, baseFreq: number, sweepRange: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // SINE wave for clean tone
      osc.type = "sine";

      // Frequency Sweep: upward sweep for a bubble pop!
      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + sweepRange, startTime + duration);

      // Gain Sweep: quick attack, fast decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    // We trigger multiple bubble sounds in a staggered sequence to create a "splash"
    createBubble(now, 450, 600, 0.15);
    createBubble(now + 0.06, 600, 700, 0.12);
    createBubble(now + 0.12, 500, 800, 0.18);
    createBubble(now + 0.18, 700, 600, 0.1);
    createBubble(now + 0.24, 550, 950, 0.2);

  } catch (err) {
    console.warn("Failed to play water synthesizer audio:", err);
  }
}

/**
 * Play a light "sip" sound when water is successfully logged
 */
export function playSipSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = "sine";
    
    // Slur frequency down then up for a "gulp" or "sip"
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.quadraticRampToValueAtTime(150, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    console.warn("Failed to play sip audio:", err);
  }
}
