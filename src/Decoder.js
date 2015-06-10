import InlineWorker from "inline-worker";
import DecoderWorker from "./DecoderWorker";

let instance = null;

export default class Decoder {
  static decode(buffer) {
    if (instance === null) {
      instance = new Decoder();
    }
    return instance.decode(buffer);
  }

  constructor() {
    this._worker = new InlineWorker(DecoderWorker, DecoderWorker.self);
    this._worker.onmessage = ({ data }) => {
      let callback = this._callbacks[data.callbackId];

      if (callback) {
        if (data.type === "decoded") {
          callback.resolve({
            sampleRate: data.audioData.sampleRate,
            channelData: data.audioData.buffers.map(buffer => new Float32Array(buffer)),
          });
        } else {
          callback.reject(new Error(data.message));
        }
      }

      this._callbacks[data.callbackId] = null;
    };
    this._callbacks = [];
  }

  decode(buffer) {
    return new Promise((resolve, reject) => {
      let callbackId = this._callbacks.length;

      this._callbacks.push({ resolve, reject });

      if (buffer && buffer.buffer instanceof ArrayBuffer) {
        buffer = buffer.buffer;
      }

      this._worker.postMessage({
        type: "decode", buffer, callbackId,
      }, [ buffer ]);
    });
  }
}
