"use strict";

import InlineWorker from "inline-worker";
import AudioData from "audiodata";
import decoder from "./decoder-worker";

export default class Decoder {
  static canProcess(buffer) {
    let view = new DataView(buffer);

    let readString = (length, offset) => {
      let data = "";
      for (let i = 0; i < length; i++) {
        data += String.fromCharCode(view.getUint8(i + offset));
      }
      return data;
    };

    try {
      return readString(4, 0) === "RIFF" && readString(4, 8) === "WAVE";
    } catch (e) {}

    return false;
  }

  decode(buffer) {
    return new Promise((resolve, reject) => {
      let worker = new InlineWorker(decoder, decoder.self);

      worker.onmessage = (e) => {
        if (e.data.type === "decoded") {
          let { numberOfChannels, length, sampleRate, buffers } = e.data.audioData;
          let audioData = new AudioData(numberOfChannels, length, sampleRate);

          audioData.channelData = buffers.map(buffer => new Float32Array(buffer));

          return resolve(audioData);
        }
        return reject(new Error(e.data.message));
      };

      worker.postMessage({
        type: "decode",
        buffer: buffer
      }, [ buffer ]);
    });
  }
}
