/**
 * Microphone capture → 16 kHz signed 16-bit little-endian PCM.
 *
 * The Gemini Live API requires raw PCM at 16 kHz; browsers hand us audio at
 * whatever the device runs (usually 48 kHz). Two decisions worth knowing:
 *
 * 1. The AudioWorklet processor is loaded from a Blob URL rather than a file.
 *    The production build bundles everything into a single `app.js` (esbuild,
 *    see package.json), so a separate `.js` worklet file would never be
 *    emitted next to it. Blob URLs keep this dependency-free.
 *
 * 2. We resample locally instead of letting the API do it. Upstream 48 kHz
 * costs 3x the bytes on a rural 4G connection for no quality gain at 16 kHz.
 *
 * Output chunks are 512 samples = 32 ms, which is inside Google's recommended
 * 20–40 ms send window. Posting per 128-frame process() block instead would
 * mean ~40 msg/s of tiny transferables and pointless main-thread churn.
 */

const CHUNK_SAMPLES = 512;

const WORKLET_SOURCE = `
class ChakkibookMicProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetRate = opts.targetRate || 16000;
    this.chunkSamples = opts.chunkSamples || ${CHUNK_SAMPLES};
    this.ratio = sampleRate / this.targetRate;
    this.pending = new Float32Array(0);
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel || channel.length === 0) return true;

    // Append this 128-frame block to the carry-over buffer.
    const merged = new Float32Array(this.pending.length + channel.length);
    merged.set(this.pending, 0);
    merged.set(channel, this.pending.length);
    this.pending = merged;

    // Wait until we have at least one full output chunk's worth of input.
    const need = Math.ceil(this.chunkSamples * this.ratio) + 2;
    if (this.pending.length < need) return true;

    const outCount = Math.floor(this.pending.length / this.ratio);
    const out = new Int16Array(outCount);

    for (let i = 0; i < outCount; i++) {
      const x = i * this.ratio;
      const i0 = Math.floor(x);
      const frac = x - i0;
      const s0 = this.pending[i0];
      const s1 = i0 + 1 < this.pending.length ? this.pending[i0 + 1] : s0;
      // Linear interpolation between neighbouring input frames.
      let s = s0 + (s1 - s0) * frac;
      if (s > 1) s = 1; else if (s < -1) s = -1;
      // Asymmetric scaling so symmetry around 0 is preserved in int16.
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.pending = this.pending.slice(Math.floor(outCount * this.ratio));
    this.port.postMessage(out.buffer, [out.buffer]);
    return true;
  }
}
registerProcessor('chakkibook-mic', ChakkibookMicProcessor);
`;

function floatToInt16(s) {
  return s < 0 ? s * 0x8000 : s * 0x7fff;
}

/** Base64-encode an Int16Array for the JSON `realtimeInput.audio` payload. */
export function pcm16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  // Chunked to avoid blowing the argument limit on large strings.
  const STEP = 0x8000;
  for (let i = 0; i < bytes.length; i += STEP) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
  }
  if (typeof btoa === 'function') return btoa(binary);
  // Node fallback (used by the smoke tests).
  return Buffer.from(bytes).toString('base64');
}

/**
 * Live mic capture.
 *
 * `onChunk(Int16Array)` fires every ~32 ms with fresh PCM. `level` is a
 * smoothed 0..1 RMS, read by the voice UI to drive the orb — it is derived
 * here rather than in a component so the smoothing window is consistent.
 */
export class MicCapture {
  constructor() {
    this.sampleRate = 16000;
    this.onChunk = null;
    this.audioContext = null;
    this.stream = null;
    this.source = null;
    this.worklet = null;
    this._level = 0;
    this._peakHold = 0;
    this.running = false;
  }

  get level() {
    return this._level;
  }

  async start(onChunk) {
    if (this.running) return;
    this.onChunk = onChunk;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MIC_UNSUPPORTED');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Shop floor: we want the far-field mic, not the earpiece.
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new Ctx({ sampleRate: 16000 });
    // Some browsers ignore the requested rate; read the truth back.
    this.sampleRate = this.audioContext.sampleRate;

    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
      await this.audioContext.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.worklet = new AudioWorkletNode(this.audioContext, 'chakkibook-mic', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { targetRate: 16000, chunkSamples: CHUNK_SAMPLES }
    });

    this.worklet.port.onmessage = (event) => {
      const pcm = new Int16Array(event.data);
      // RMS for the orb. Cheap enough at 32 ms cadence.
      let sum = 0;
      for (let i = 0; i < pcm.length; i++) {
        const s = pcm[i] / 32768;
        sum += s * s;
      }
      const rms = Math.sqrt(sum / pcm.length);
      // Asymmetric smoothing: rise fast so the orb feels responsive, fall slow
      // so it does not flicker between words.
      this._level = rms > this._level ? this._level * 0.4 + rms * 0.6
                                      : this._level * 0.75 + rms * 0.25;
      if (this.onChunk) this.onChunk(pcm);
    };

    this.source.connect(this.worklet);
    // Deliberately not connected to destination — monitoring the mic through
    // the speaker is how you get feedback squeal on a counter-top device.
    this.running = true;
  }

  stop() {
    if (this.worklet) {
      this.worklet.port.onmessage = null;
      this.worklet.disconnect();
      this.worklet = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.running = false;
    this._level = 0;
    this.onChunk = null;
  }
}
