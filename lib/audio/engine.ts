// Procedural audio engine. Everything is synthesised with the Web Audio API —
// no files, no preload, no latency, gapless music loops. The palette is
// deliberately soft (sine/triangle, short envelopes, gentle filtering) to match
// the Linear-premium aesthetic rather than arcade blips.

export type SfxName =
  | "hover" | "click" | "modalOpen" | "modalClose"
  | "playerJoin" | "playerLeave" | "ready" | "startGame"
  | "tick" | "go" | "letter"
  | "valid" | "invalid" | "duplicate" | "combo" | "personalBest" | "shuffle" | "hint"
  | "t10" | "t5" | "timeUp" | "roundComplete" | "roundStart"
  | "rankUp" | "overtake" | "reachFirst"
  | "badge" | "levelUp" | "xp" | "streakStart" | "streakBroken"
  | "winner" | "confetti" | "statsReveal" | "playAgain";

export type MusicState =
  | "off" | "lobby" | "gameplay" | "energetic" | "countdown" | "winner" | "results";

export type AudioSettings = {
  sfxOn: boolean;
  musicOn: boolean;
  sfxVol: number; // 0..1
  musicVol: number; // 0..1
};

const A = 220, C = 261.63, D = 293.66, E = 329.63, G = 392.0;
const A4 = 440, Cs5 = 554.37, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5;

// Pentatonic pool used by generative arps / sparkles.
const PENTA = [A, C, D, E, G, A4, C * 2, D5, E5, G5, A5];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private settings: AudioSettings = { sfxOn: true, musicOn: true, sfxVol: 0.7, musicVol: 0.5 };
  private lastPlayed: Record<string, number> = {};
  private voices = 0;

  // music
  private musicState: MusicState = "off";
  private schedTimer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;

  private ensure(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.settings.sfxVol;
      this.musicBus.gain.value = 0;
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
    }
    return true;
  }

  unlock() {
    if (!this.ensure() || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  getSettings(): AudioSettings { return { ...this.settings }; }

  setSettings(s: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...s };
    if (this.sfxBus) this.sfxBus.gain.value = this.settings.sfxVol;
    // Re-apply music target level for the current state.
    this.applyMusicLevel();
    if (!this.settings.musicOn) this.stopMusic();
    else if (this.musicState !== "off" && !this.schedTimer) this.startScheduler();
  }

  // ---- SFX ----------------------------------------------------------------

  private now() { return this.ctx!.currentTime; }

  private tone(
    freq: number,
    t: number,
    dur: number,
    peak: number,
    type: OscillatorType = "sine",
    glideTo?: number,
    filter?: number,
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t + dur);
    let node: AudioNode = osc;
    if (filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = filter;
      osc.connect(lp);
      node = lp;
    }
    const a = Math.min(0.02, dur * 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    g.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    this.voices++;
    osc.onended = () => { this.voices--; };
  }

  private noise(t: number, dur: number, peak: number, hp = 2000) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hpf); hpf.connect(g); g.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private chord(freqs: number[], t: number, dur: number, peak: number, type: OscillatorType = "sine", stagger = 0) {
    freqs.forEach((f, i) => this.tone(f, t + i * stagger, dur, peak, type));
  }

  sfx(name: SfxName, opts: { intensity?: number } = {}) {
    if (!this.settings.sfxOn || !this.ensure() || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    // Throttle & voice cap to avoid overlap spam.
    const minGap: Record<string, number> = { hover: 60, xp: 40, tick: 90, letter: 0 };
    const gap = minGap[name] ?? 30;
    const nowMs = performance.now();
    if (this.lastPlayed[name] && nowMs - this.lastPlayed[name] < gap) return;
    this.lastPlayed[name] = nowMs;
    if (this.voices > 24) return;

    const t = this.now() + 0.001;
    const I = opts.intensity ?? 0;

    switch (name) {
      case "hover": this.tone(1200, t, 0.05, 0.02, "sine"); break;
      case "click": this.tone(520, t, 0.06, 0.05, "triangle", 480); break;
      case "playAgain": this.tone(660, t, 0.07, 0.06, "triangle", 720); break;
      case "modalOpen": this.tone(440, t, 0.12, 0.04, "sine", 660); break;
      case "modalClose": this.tone(660, t, 0.12, 0.04, "sine", 440); break;

      case "playerJoin": this.chord([E5, G5], t, 0.14, 0.05, "sine", 0.05); break;
      case "playerLeave": this.tone(G, t, 0.16, 0.045, "sine", D); break;
      case "ready": this.chord([D5, A5], t, 0.12, 0.06, "triangle", 0.04); break;
      case "startGame": this.chord([A4, Cs5, E5], t, 0.4, 0.06, "sine", 0.03); break;

      case "tick": this.tone(880, t, 0.05, 0.05, "triangle", undefined, 3000); break;
      case "letter": this.tone(1500, t, 0.045, 0.03, "sine", 1650); break;
      case "go": this.chord([C * 2, E5, G5], t, 0.5, 0.07, "sine", 0.02); this.noise(t, 0.25, 0.02, 3000); break;

      case "valid": this.tone(D5, t, 0.09, 0.07, "sine", A5); break;
      case "invalid": this.tone(180, t, 0.2, 0.08, "triangle", 110, 700); break;
      case "duplicate": this.tone(440, t, 0.06, 0.05, "sine"); this.tone(440, t + 0.09, 0.06, 0.05, "sine"); break;
      case "combo": {
        const n = Math.min(6, 2 + Math.floor(I));
        for (let i = 0; i < n; i++) this.tone(PENTA[3 + i] ?? A5, t + i * 0.05, 0.12, 0.05, "triangle");
        break;
      }
      case "personalBest": this.chord([E5, A5, C6], t, 0.5, 0.05, "sine", 0.06); break;
      case "shuffle": this.noise(t, 0.18, 0.03, 1500); this.tone(520, t, 0.12, 0.03, "triangle", 700); break;
      case "hint": this.tone(A5, t, 0.14, 0.04, "sine", C6); break;

      case "t10": this.tone(E5, t, 0.09, 0.05, "sine"); break;
      case "t5": this.tone(G5, t, 0.1, 0.055, "sine"); break;
      case "timeUp": this.tone(A4, t, 0.4, 0.06, "sine", A); break;
      case "roundComplete": this.chord([C * 2, G], t, 0.3, 0.05, "sine", 0.08); break;
      case "roundStart": this.tone(G, t, 0.22, 0.05, "sine", C * 2); break;

      case "rankUp": this.tone(E5, t, 0.08, 0.05, "triangle", G5); break;
      case "overtake": this.tone(E5, t, 0.12, 0.055, "sine", 988); break;
      case "reachFirst": this.chord([E5, 830, 988], t, 0.35, 0.06, "sine", 0.04); break;

      case "badge": this.tone(C6, t, 0.1, 0.05, "sine"); this.tone(E6, t + 0.08, 0.14, 0.045, "sine"); break;
      case "levelUp": this.chord([C * 2, E5, G5, C6], t, 0.45, 0.06, "sine", 0.07); break;
      case "xp": this.tone(C6, t, 0.05, 0.03, "sine"); break;
      case "streakStart": this.tone(D5, t, 0.12, 0.05, "triangle", A5); break;
      case "streakBroken": this.tone(A4, t, 0.2, 0.05, "triangle", D); break;

      case "winner": this.chord([C * 2, E5, G5, C6], t, 0.7, 0.07, "sine", 0.09); break;
      case "confetti": this.noise(t, 0.4, 0.025, 2500); this.chord([G5, C6, E6], t + 0.05, 0.4, 0.03, "sine", 0.05); break;
      case "statsReveal": this.tone(A5, t, 0.06, 0.03, "sine"); break;
    }
  }

  // ---- Music (generative, gapless) ---------------------------------------

  private patternFor(state: MusicState) {
    // step sequencer @ 16 steps; returns tempo + level + layer flags
    switch (state) {
      case "lobby": return { bpm: 82, level: 0.5, pad: true, arp: true, kick: false, hat: false, bright: 700 };
      case "gameplay": return { bpm: 96, level: 0.6, pad: true, arp: true, kick: true, hat: false, bright: 900 };
      case "energetic": return { bpm: 112, level: 0.75, pad: true, arp: true, kick: true, hat: true, bright: 1400 };
      case "countdown": return { bpm: 96, level: 0.22, pad: true, arp: false, kick: false, hat: false, bright: 600 };
      case "winner": return { bpm: 100, level: 0.7, pad: true, arp: true, kick: false, hat: false, bright: 1600 };
      case "results": return { bpm: 74, level: 0.45, pad: true, arp: false, kick: false, hat: false, bright: 600 };
      default: return { bpm: 90, level: 0, pad: false, arp: false, kick: false, hat: false, bright: 800 };
    }
  }

  // Chord roots cycling under the pads (Am – F – C – G feel, transposed low).
  private CHORDS = [
    [A / 2, C, E],
    [174.61, A, C], // F
    [C / 2, E, G],
    [G / 2, D, G],
  ];

  private applyMusicLevel() {
    if (!this.musicBus || !this.ctx) return;
    const p = this.patternFor(this.musicState);
    const target = this.settings.musicOn ? p.level * this.settings.musicVol * 0.6 : 0;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  setMusic(state: MusicState) {
    if (!this.ensure() || !this.ctx) return;
    this.musicState = state;
    if (state === "off" || !this.settings.musicOn) {
      this.applyMusicLevel();
      return;
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    this.applyMusicLevel();
    if (!this.schedTimer) this.startScheduler();
  }

  private startScheduler() {
    if (!this.ctx) return;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.schedTimer = setInterval(() => this.schedule(), 25);
  }

  private stopMusic() {
    this.applyMusicLevel();
    if (this.schedTimer) { clearInterval(this.schedTimer); this.schedTimer = null; }
  }

  private musicVoice(freq: number, t: number, dur: number, peak: number, type: OscillatorType, filterHz: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = filterHz;
    osc.type = type; osc.frequency.value = freq;
    const a = Math.min(0.08, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(this.musicBus!);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  private kickAt(t: number, peak: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(g); g.connect(this.musicBus!);
    osc.start(t); osc.stop(t + 0.18);
  }

  private hatAt(t: number, peak: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.value = peak;
    src.connect(hp); hp.connect(g); g.connect(this.musicBus!);
    src.start(t); src.stop(t + 0.06);
  }

  private schedule() {
    if (!this.ctx) return;
    const p = this.patternFor(this.musicState);
    const stepDur = 60 / p.bpm / 4; // 16th notes
    while (this.nextStepTime < this.ctx.currentTime + 0.12) {
      const s = this.step % 16;
      const bar = Math.floor(this.step / 16) % 4;
      const chord = this.CHORDS[bar];
      const t = this.nextStepTime;

      // Pad: sustain the chord at the start of each bar.
      if (p.pad && s === 0) {
        chord.forEach((f, i) =>
          this.musicVoice(f, t, stepDur * 16 * 1.05, 0.05 - i * 0.008, "sine", p.bright),
        );
      }
      // Arp: sparse plucks on off-beats.
      if (p.arp && (s === 2 || s === 6 || s === 10 || s === 13)) {
        const note = chord[(s / 2) % chord.length | 0] * 2;
        this.musicVoice(note, t, 0.3, 0.03, "triangle", p.bright + 400);
      }
      // Kick on strong beats.
      if (p.kick && (s === 0 || s === 8)) this.kickAt(t, 0.09);
      if (p.kick && p.hat && (s === 4 || s === 12)) this.kickAt(t, 0.06);
      // Hats.
      if (p.hat && s % 2 === 1) this.hatAt(t, 0.012);

      this.step++;
      this.nextStepTime += stepDur;
    }
  }
}

let engine: AudioEngine | null = null;
export function getAudio(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
