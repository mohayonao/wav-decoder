import assert from "power-assert";
import AudioData from "audiodata";
import Decoder from "../src/decoder";

let closeTo = (actual, expected, delta) => Math.abs(actual - expected) <= delta;

let wavFile = new Uint8Array([
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
]).buffer;

describe("Decoder", function() {
  describe(".canProcess(format: string): boolean", function() {
    it("works", function() {
      assert(Decoder.canProcess(new Uint8Array(100).buffer) === "maybe");
      assert(Decoder.canProcess(null) === "");
    });
  });
  describe(".decode(buffer: ArrayBuffer): Promise<AudioData>", function() {
    it("works", function() {
      return Decoder.decode(wavFile).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(audioData.numberOfChannels === 2);
        assert(audioData.length === 2);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
  });
  describe("#decode(buffer: ArrayBuffer): Promise<AudioData>", function() {
    it("works", function() {
      let decoder = new Decoder();

      return decoder.decode(wavFile).then((audioData) => {
        assert(audioData.sampleRate === 44100);
        assert(audioData.numberOfChannels === 2);
        assert(audioData.length === 2);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
  });
  describe("#canProcess(format: string): boolean", function() {
    it("works", function() {
      let decoder = new Decoder();

      assert(decoder.canProcess(new Uint8Array(100).buffer) === "maybe");
      assert(decoder.canProcess(null) === "");
    });
  });
});
describe("AudioData", function() {
  describe(".decode(buffer: ArrayBuffer): Promise<AudioData>", function() {
    it("works", function() {
      AudioData.install(Decoder);

      return AudioData.decode(wavFile).then((audioData) => {
        assert(audioData instanceof AudioData);
        assert(audioData.sampleRate === 44100);
        assert(audioData.numberOfChannels === 2);
        assert(audioData.length === 2);
        assert(closeTo(audioData.channelData[0][0], -0.5, 1e-4));
        assert(closeTo(audioData.channelData[0][1],  1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][0], -1.0, 1e-4));
        assert(closeTo(audioData.channelData[1][1],  0.5, 1e-4));
      });
    });
  });
});
