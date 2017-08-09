const fs = require("fs");
const path = require("path");
const assert = require("assert");
const decoder = require("..");

const testSpec = [
  { opts: { bitDepth:  8 }, delta: 1e-1, filename: "amen_pcm8.wav" },
  { opts: { bitDepth: 16 }, delta: 1e-4, filename: "amen_pcm16.wav" },
  { opts: { bitDepth: 24 }, delta: 1e-6, filename: "amen_pcm24.wav" },
  { opts: { bitDepth: 32 }, delta: 1e-8, filename: "amen_pcm32.wav" },
  { opts: { float:  true }, delta: 0.00, filename: "amen_pcm32f.wav" }
];

function readFile(filename) {
  return fs.readFileSync(path.join(__dirname, "fixtures", filename));
}

function readAudioData(filename) {
  const buffer = readFile(filename).buffer;

  const uint32 = new Uint32Array(buffer, 4);
  const float32 = new Float32Array(buffer, 16);

  const numberOfChannels = uint32[0];
  const length = uint32[1];
  const sampleRate = uint32[2];
  const channelData = new Array(numberOfChannels).fill().map((_, ch) => {
    return float32.subarray(ch * length, (ch + 1) * length);
  });

  return {
    numberOfChannels: numberOfChannels,
    length: length,
    sampleRate: sampleRate,
    channelData: channelData
  };
}

function deepCloseTo(a, b, delta) {
  assert(a.length === b.length);

  for (let i = 0, imax = a.length; i < imax; i++) {
    assert(Math.abs(a[i] - b[i]) <= delta, `a[${i}]=${a[i]}, b[${i}]=${b[i]}`);
  }

  return true;
}

describe("decode(audioData, opts)", () => {
  const expected = readAudioData("amen.dat");

  testSpec.forEach(({ opts, delta, filename }) => {
    it(filename, () => {
      const wavData = readFile(filename);

      return decoder.decode(wavData).then((actual) => {
        assert(actual.numberOfChannels === expected.numberOfChannels);
        assert(actual.length === expected.length);
        assert(actual.sampleRate === expected.sampleRate);
        assert(deepCloseTo(actual.channelData[0], expected.channelData[0], delta));
        assert(deepCloseTo(actual.channelData[1], expected.channelData[1], delta));
      });
    });
  });
});
