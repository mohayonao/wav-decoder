import InlineWorker from "inline-worker";
import decoder from "./decoder-worker";

export default class Decoder {
  static canProcess(src) {
    if (src && (src instanceof ArrayBuffer || typeof src.length === "number")) {
      return "maybe";
    }
    return "";
  }

  static decode(buffer) {
    return new Decoder().decode(buffer);
  }

  constructor() {
    this._worker = new InlineWorker(decoder, decoder.self);
    this._worker.onmessage = (e) => {
      let callback = this._callbacks[e.data.callbackId];

      if (callback) {
        if (e.data.type === "decoded") {
          let audioData = e.data.audioData;

          audioData.channelData = audioData.buffers.map((buffer) => {
            return new Float32Array(buffer);
          });

          callback.resolve(audioData);
        } else {
          callback.reject(new Error(e.data.message));
        }
      }

      this._callbacks[e.data.callbackId] = null;
    };
    this._callbacks = [];
  }

  canProcess(format) {
    return Decoder.canProcess(format);
  }

  decode(buffer) {
    return new Promise((resolve, reject) => {
      let callbackId = this._callbacks.length;

      this._callbacks.push({ resolve, reject });

      if (buffer && typeof buffer.length === "number") {
        buffer = new Uint8Array(buffer).buffer;
      }

      this._worker.postMessage({
        type: "decode", buffer, callbackId,
      }, [ buffer ]);
    });
  }
}
