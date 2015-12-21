"use strict";

const assert = require("assert");
const Decoder = require("../lib/Decoder");

let closeTo = (actual, expected, delta) => Math.abs(actual - expected) <= delta;

let wavFile = new Buffer([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x2c, 0x00, 0x00, 0x00, // file size
  0x57, 0x41, 0x56, 0x45, // "WAVE"
  0x66, 0x6d, 0x74, 0x20, // "fmt "
  0x10, 0x00, 0x00, 0x00, // 16bit
  0x01, 0x00, 0x02, 0x00, // stereo
  0x44, 0xac, 0x00, 0x00, // 44.1kHz
  0x10, 0xb1, 0x02, 0x00, // data speed
  0x04, 0x00, 0x10, 0x00, // block size, bit/sample
  0x64, 0x61, 0x74, 0x61, // "data"
  0x08, 0x00, 0x00, 0x00, // data size
  0x00, 0xc0, 0x00, 0x80,
  0xff, 0x7f, 0x00, 0x40,
]);

describe("Decoder", function() {
  describe(".decode(buffer: ArrayBuffer|Buffer): Promise<AudioData>", function() {
    it("works with ArrayBuffer", function() {
      let buffer = new Uint8Array(wavFile).buffer;

      return Decoder.decode(buffer).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
    it("works with Buffer", function() {
      let buffer = wavFile;

      return Decoder.decode(buffer).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
  });
  describe("#decode(buffer: ArrayBuffer|Buffer): Promise<AudioData>", function() {
    it("works with ArrayBuffer", function() {
      let buffer = new Uint8Array(wavFile).buffer;
      let decoder = new Decoder();

      return decoder.decode(buffer).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
    it("works with Buffer", function() {
      let buffer = wavFile;
      let decoder = new Decoder();

      return decoder.decode(buffer).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
  });
});
