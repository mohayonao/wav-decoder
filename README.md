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
- `canProcess(format: string): boolean`
- `decode(buffer: ArrayBuffer): Promise<object>`

#### Instance methods
- `canProcess(format: string): boolean`
- `decode(buffer: ArrayBuffer): Promise<object>`

## Usage

#### node.js

```js
var fs = require("fs");
var WavDecoder = require("wav-decoder");

var buffer = fs.readFileSync("foobar.wav");

WavDecoder.decode(buffer).then(function(audioData) {
  console.log(audioData.numberOfChannels);
  console.log(audioData.length);
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
  return WavDecoder.decode(buffer);
}).then(function(audioData) {
  console.log(audioData.numberOfChannels);
  console.log(audioData.length);
  console.log(audioData.sampleRate);
  console.log(audioData.channelData[0]); // Float32Array
  console.log(audioData.channelData[1]); // Float32Array
});
```

## License
MIT
