"use strict";

const fs = require("fs");
const assert = require("assert");

function readFile(filepath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    })
  });
}

function readAudioData(filepath) {
  return readFile(filepath).then((buffer) => {
    buffer = buffer.buffer;

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
  });
}

function deepEqual(a, b) {
  return deepCloseTo(a, b, 0);
}

function deepCloseTo(a, b, delta) {
  assert(a.length === b.length);

  for (let i = 0, imax = a.length; i < imax; i++) {
    assert(Math.abs(a[i] - b[i]) <= delta, `a[${i}]=${a[i]}, b[${i}]=${b[i]}`);
  }

  return true;
}

module.exports = { readFile, readAudioData, deepEqual, deepCloseTo };
