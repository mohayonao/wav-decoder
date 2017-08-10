const assert = require("assert");
const wavEncoder = require("wav-encoder");
const wavDecoder = require("..");

const testSpec = [
  {
    opts: { bitDepth: 8 },
    rawData: new Uint8Array([ 0, 1, 64, 128, 192, 255 ]),
    expected: new Float32Array([ -1, -0.9921875, -0.5, 0, 0.5039370059967041, 1 ]),
  },
  {
    opts: { bitDepth: 8, symmetric: true },
    rawData: new Uint8Array([ 0, 1, 64, 128, 192, 255 ]),
    expected: new Float32Array([ -1, -0.9921568632125854, -0.49803921580314636, 0.003921568859368563, 0.5058823823928833, 1 ]),
  },
  {
    opts: { bitDepth: 16 },
    rawData: new Int16Array([ -32768, -32767, -16384, 0, 16384, 32767 ]),
    expected: new Float32Array([ -1, -0.999969482421875, -0.5, 0, 0.5000152587890625, 1 ]),
  },
  {
    opts: { bitDepth: 16, symmetric: true },
    rawData: new Int16Array([ -32768, -32767, -16384, 0, 16384, 32767 ]),
    expected: new Float32Array([ -1, -0.999969482421875, -0.5, 0, 0.5, 0.999969482421875 ]),
  },
  {
    opts: { bitDepth: 32 },
    rawData: new Int32Array([ -2147483648, -2147483647, -1073741824, 0, 1073741824, 2147483647 ]),
    expected: new Float32Array([ -1, -1, -0.5, 0, 0.5, 1 ]),
  },
  {
    opts: { bitDepth: 32, symmetric: true },
    rawData: new Int32Array([ -2147483648, -2147483647, -1073741824, 0, 1073741824, 2147483647 ]),
    expected: new Float32Array([ -1, -1, -0.5, 0, 0.5, 1 ]),
  },
  {
    opts: { bitDepth: 32, float: true },
    rawData: new Float32Array([ -1, -0.5, 0, 0.5, 1 ]),
    expected: new Float32Array([ -1, -0.5, 0, 0.5, 1 ]),
  }
];

describe("decoding", () => {
  testSpec.forEach(({ opts, rawData, expected }) => {
    it(JSON.stringify(opts), () => {
      const audioData = {
        channelData: [ new Float32Array(rawData.length) ],
        sampleRate: 44100,
      }
      const encoded = wavEncoder.encode.sync(audioData, opts);
      const view = new rawData.constructor(encoded, 44);

      view.set(rawData);

      const decoded = wavDecoder.decode.sync(encoded, opts);
      const actual = decoded.channelData[0];

      assert.deepEqual(actual, expected);
    });
  });
});
