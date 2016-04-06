const test = require("ava");
const { readFile, readAudioData, deepEqual, deepCloseTo } = require("./_util");
const decoder = require("..");

const testSpec = [
  { opts: { bitDepth:  8 }, delta: 1e-1, filename: "amen_pcm8.wav" },
  { opts: { bitDepth: 16 }, delta: 1e-4, filename: "amen_pcm16.wav" },
  { opts: { bitDepth: 24 }, delta: 1e-6, filename: "amen_pcm24.wav" },
  { opts: { bitDepth: 32 }, delta: 1e-8, filename: "amen_pcm32.wav" },
  { opts: { float:  true }, delta: 0.00, filename: "amen_pcm32f.wav" }
];

test("decoding", async t => {
  const expected = await readAudioData("./fixtures/amen.dat");

  return Promise.all(testSpec.map(async spec => {
    const wavData = await readFile(`./fixtures/${ spec.filename }`);
    const actual = await decoder.decode(wavData);

    t.ok(actual.numberOfChannels === expected.numberOfChannels);
    t.ok(actual.length === expected.length);
    t.ok(actual.sampleRate === expected.sampleRate);
    t.ok(deepCloseTo(actual.channelData[0], expected.channelData[0], spec.delta));
    t.ok(deepCloseTo(actual.channelData[1], expected.channelData[1], spec.delta));
  }));
});
