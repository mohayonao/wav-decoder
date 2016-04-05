const test = require("ava");
const { readFile, readAudioData, deepEqual, deepCloseTo } = require("./_util");
const decoder = require("..");

test("works", t => {
  const wavFile = new Buffer([
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
  const buffer = wavFile; // .buffer;

  return decoder.decode(buffer).then((audioData) => {
    t.ok(audioData.sampleRate === 44100);
    t.ok(deepCloseTo(audioData.channelData[0], [ -0.5, 1.0 ], 1e-4));
    t.ok(deepCloseTo(audioData.channelData[1], [ -1.0, 0.5 ], 1e-4));
  });
});

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
