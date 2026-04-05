import * as Tone from "tone";
import { rnd } from "./constants.js";

class SoundEngine {
  constructor() {
    this.ready = false;
    this.muted = false;
  }
  async init() {
    if (this.ready) return;
    try {
      await Tone.start();
      this.masterVol = new Tone.Volume(-8).toDestination();

      this.ambientSynth = new Tone.FMSynth({
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 },
        modulation: { type: "sine" },
        modulationEnvelope: { attack: 3, decay: 2, sustain: 0.6, release: 4 },
      }).connect(new Tone.Volume(-28).connect(new Tone.Reverb({ decay: 8, wet: 0.7 }).connect(this.masterVol)));

      this.rifleSynth = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0 },
      }).connect(new Tone.Filter(3000, "bandpass").connect(new Tone.Volume(-16).connect(this.masterVol)));

      this.shotgunSynth = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      }).connect(new Tone.Filter(1500, "lowpass").connect(new Tone.Volume(-12).connect(this.masterVol)));

      this.explosionSynth = new Tone.MembraneSynth({
        pitchDecay: 0.08, octaves: 6, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
      }).connect(new Tone.Distortion(0.4).connect(new Tone.Volume(-14).connect(this.masterVol)));

      this.zapSynth = new Tone.FMSynth({
        harmonicity: 8, modulationIndex: 20,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
        modulation: { type: "square" },
      }).connect(new Tone.Volume(-18).connect(this.masterVol));

      this.fireSynth = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0 },
      }).connect(new Tone.Filter(2000, "lowpass").connect(new Tone.Volume(-18).connect(this.masterVol)));

      this.freezeSynth = new Tone.MetalSynth({
        frequency: 400, envelope: { attack: 0.001, decay: 0.25, release: 0.1 },
        harmonicity: 12, modulationIndex: 8, resonance: 2000, octaves: 1,
      }).connect(new Tone.Volume(-22).connect(this.masterVol));

      this.deathSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      }).connect(new Tone.Volume(-16).connect(this.masterVol));

      this.placeSynth = new Tone.MetalSynth({
        frequency: 200, envelope: { attack: 0.001, decay: 0.15, release: 0.05 },
        harmonicity: 5.1, modulationIndex: 16, resonance: 3000, octaves: 0.5,
      }).connect(new Tone.Volume(-20).connect(this.masterVol));

      this.hornSynth = new Tone.FMSynth({
        harmonicity: 2, modulationIndex: 3,
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.3, release: 0.5 },
      }).connect(new Tone.Reverb({ decay: 3, wet: 0.5 }).connect(new Tone.Volume(-14).connect(this.masterVol)));

      this.alarmSynth = new Tone.FMSynth({
        harmonicity: 4, modulationIndex: 10,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
      }).connect(new Tone.Volume(-16).connect(this.masterVol));

      this.gameOverSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.05, decay: 1.5, sustain: 0, release: 1 },
      }).connect(new Tone.Reverb({ decay: 5, wet: 0.6 }).connect(new Tone.Volume(-12).connect(this.masterVol)));

      this.victorySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1 },
      }).connect(new Tone.Reverb({ decay: 4, wet: 0.5 }).connect(new Tone.Volume(-12).connect(this.masterVol)));

      this.groanSynth = new Tone.FMSynth({
        harmonicity: 1.5, modulationIndex: 5,
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.3, decay: 0.6, sustain: 0.2, release: 0.4 },
        modulation: { type: "sine" },
      }).connect(new Tone.Filter(600, "lowpass").connect(new Tone.Reverb({ decay: 2, wet: 0.4 }).connect(new Tone.Volume(-26).connect(this.masterVol))));

      this.ready = true;
    } catch(e) { console.warn("Audio init failed:", e); }
  }

  play(type) {
    if (!this.ready || this.muted) return;
    try {
      const now = Tone.now();
      switch(type) {
        case "rifle": this.rifleSynth.triggerAttackRelease("16n", now); break;
        case "shotgun": this.shotgunSynth.triggerAttackRelease("8n", now); break;
        case "explosion": this.explosionSynth.triggerAttackRelease("C1", "8n", now); break;
        case "cannon": this.explosionSynth.triggerAttackRelease("G0", "4n", now); break;
        case "zap": this.zapSynth.triggerAttackRelease("C5", "16n", now); break;
        case "fire": this.fireSynth.triggerAttackRelease("8n", now); break;
        case "freeze": this.freezeSynth.triggerAttackRelease("16n", now); break;
        case "death": this.deathSynth.triggerAttackRelease("E1", "16n", now); break;
        case "bigdeath": this.deathSynth.triggerAttackRelease("C1", "8n", now); break;
        case "place": this.placeSynth.triggerAttackRelease("16n", now); break;
        case "sell": this.placeSynth.triggerAttackRelease("32n", now); break;
        case "wavestart":
          this.hornSynth.triggerAttackRelease("D3", "4n", now);
          this.hornSynth.triggerAttackRelease("A3", "4n", now + 0.3);
          break;
        case "breach":
          this.alarmSynth.triggerAttackRelease("A4", "16n", now);
          this.alarmSynth.triggerAttackRelease("E4", "16n", now + 0.1);
          break;
        case "gameover":
          this.gameOverSynth.triggerAttackRelease(["D2","A2","F2"], "2n", now);
          break;
        case "victory":
          this.victorySynth.triggerAttackRelease(["C4","E4","G4"], "8n", now);
          this.victorySynth.triggerAttackRelease(["E4","G4","C5"], "8n", now + 0.25);
          this.victorySynth.triggerAttackRelease(["G4","C5","E5"], "4n", now + 0.5);
          break;
        case "groan":
          this.groanSynth.triggerAttackRelease(rnd(55,85), "8n", now);
          break;
        case "ambientstart":
          this.ambientSynth.triggerAttack("C1", now);
          break;
        case "ambientstop":
          this.ambientSynth.triggerRelease(now);
          break;
      }
    } catch(e) {}
  }

  toggle() { this.muted = !this.muted; return this.muted; }
}

export const sfx = new SoundEngine();
