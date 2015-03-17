"use strict";

import InlineWorker from "inline-worker";
import decoder from "./decoder-worker";

export default class Decoder {
  decode(buffer) {
    return new Promise((resolve, reject) => {
      let worker = new InlineWorker(decoder, decoder.self);

      worker.onmessage = (e) => {
        if (e.data.type === "decoded") {
          let audioData = e.data.audioData;

          audioData.channelData = audioData.buffers.map((buffer) => {
            return new Float32Array(buffer);
          });

          return resolve(audioData);
        }
        return reject(new Error(e.data.message));
      };

      if (buffer && typeof buffer.length === "number") {
        buffer = new Uint8Array(buffer).buffer;
      }

      worker.postMessage({
        type: "decode",
        buffer: buffer
      }, [ buffer ]);
    });
  }
}
