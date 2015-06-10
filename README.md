# wav-decoder
[![Build Status](http://img.shields.io/travis/mohayonao/wav-decoder.svg?style=flat-square)](https://travis-ci.org/mohayonao/wav-decoder)
[![NPM Version](http://img.shields.io/npm/v/wav-decoder.svg?style=flat-square)](https://www.npmjs.org/package/wav-decoder)
[![Bower](http://img.shields.io/bower/v/wav-decoder.svg?style=flat-square)](http://bower.io/search/?q=wav-decoder)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> isomorphic wav data decoder

## Installation

npm:

```
npm install wav-decoder
```

bower:

```
bower install wav-decoder
```

downloads:

- [wav-decoder.js](https://raw.githubusercontent.com/mohayonao/wav-decoder/master/build/wav-decoder.js)
- [wav-decoder.min.js](https://raw.githubusercontent.com/mohayonao/wav-decoder/master/build/wav-decoder.min.js)

## API
### WavDecoder
- `constructor()`

#### Class methods
- `decode(src: ArrayBuffer|Buffer): Promise<AudioData>`

#### Instance methods
- `decode(src: ArrayBuffer|Buffer): Promise<AudioData>`

##### Returns

[`AudioData`](https://github.com/mohayonao/audiodata) is defined below.

```js
interface AudioData {
  sampleRate: number;
  channelData: Float32Array[];
}
```

## Usage

#### node.js

```js
var fs = require("fs");
var WavDecoder = require("wav-decoder");

var readFile = function(filepath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, function(err, buffer) {
      if (err) {
        return reject(err);
      }
      return resolve(buffer);
    });
  });
};

readFile("foobar.wav").then(function(buffer) {
  return WavDecoder.decode(buffer); // buffer is an instance of Buffer
}).then(function(audioData) {
  console.log(audioData.sampleRate);
  console.log(audioData.channelData[0]); // Float32Array
  console.log(audioData.channelData[1]); // Float32Array
});
```

#### browser

```html
<script src="/path/to/wav-decoder.js"></script>
```

```js
fetch("foobar.wav").then(function(res) {
  return res.arraybuffer();
}).then(function(buffer) {
  return WavDecoder.decode(buffer); // buffer is an instance of ArrayBuffer
}).then(function(audioData) {
  console.log(audioData.sampleRate);
  console.log(audioData.channelData[0]); // Float32Array
  console.log(audioData.channelData[1]); // Float32Array
});
```

## License
MIT
