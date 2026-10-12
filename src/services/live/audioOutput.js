/**
 * Gapless 24 kHz PCM playback with hard barge-in support.
 *
 * The Live API returns raw PCM at 24 kHz. Playback strategy is explicit
 * scheduling against `nextStartTime` rather than "play each chunk when it
 * arrives", because network jitter otherwise produces audible gaps between
 * every sentence.
 *
 * Barge-in is the reason this class exists rather than three lines of code:
 * when the server sends `serverContent.interrupted` we must drop everything
 * instantly. Leaving it running makes the agent talk over the operator, which
 * is the single fastest way to make a voice UI feel broken.
 */

export class PcmPlayer {
  constructor({ sampleRate = 24000 } = {}) {
    this.sampleRate = sampleRate;
    this.audioContext = null;
    this.gainNode = null;
    this.activeSources = new Set();
    this.nextStartTime = 0;
    this.underruns = 0;
    this.started = false;
    this._totalQueued = 0;
  }

  async start() {
    if (this.started) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new Ctx({ sampleRate: this.sampleRate });
    this.sampleRate = this.audioContext.sampleRate;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.audioContext.destination);
    this.nextStartTime = this.audioContext.currentTime;
    this.started = true;

    // Autoplay policy: the context starts suspended until a user gesture.
    // Never throws — if we cannot resume, playback silently no-ops and the UI
    // still shows transcripts, which is the degraded state we want anyway.
    if (this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch (_) { /* ignore */ }
    }
  }

  /** Seconds of audio already handed to the hardware but not yet heard. */
  get bufferedMs() {
    if (!this.audioContext) return 0;
    return Math.max(0, (this.nextStartTime - this.audioContext.currentTime) * 1000);
  }

  get isSpeaking() {
    return this.activeSources.size > 0;
  }

  /** Queue one 16-bit PCM chunk. Safe to call before start(); it is dropped. */
  enqueue(int16) {
    if (!this.started || !this.audioContext || int16.length === 0) return;

    const frames = int16.length;
    const buffer = this.audioContext.createBuffer(1, frames, this.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) channel[i] = int16[i] / 32768;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    const now = this.audioContext.currentTime;
    // A small lead hides scheduler jitter; too much and the agent feels laggy
    // when the user tries to interrupt.
    const LEAD = 0.06;
    let startAt = Math.max(now + LEAD, this.nextStartTime);

    if (startAt < now + 0.005) {
      this.underruns += 1;
      startAt = now + 0.005;
    }

    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
    this._totalQueued += 1;

    const track = source;
    this.activeSources.add(track);
    source.onended = () => this.activeSources.delete(track);
  }

  /** Drop all queued audio immediately. Called on interruption. */
  clear() {
    this.activeSources.forEach((src) => {
      try {
        src.onended = null;
        src.stop();
      } catch (_) { /* already stopped */ }
    });
    this.activeSources.clear();
    if (this.audioContext) this.nextStartTime = this.audioContext.currentTime;
  }

  async stop() {
    this.clear();
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      try { await this.audioContext.close(); } catch (_) { /* ignore */ }
      this.audioContext = null;
    }
    this.started = false;
  }
}
