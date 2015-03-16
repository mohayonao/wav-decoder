(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WavDecoder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* jshint esnext: false */

/**
  CAUTION!!!!
  This file is used in WebWorker.
  So, must write with ES5, not use ES6.
  You need attention not to be traspiled by babel.
*/

var self = {};

function decoder() {
  self.onmessage = function (e) {
    switch (e.data.type) {
      case "decode":
        self.decode(e.data.buffer).then(function (audioData) {
          self.postMessage({
            type: "decoded",
            audioData: audioData
          }, [audioData.buffers]);
        })["catch"](function (err) {
          self.postMessage({
            type: "error",
            message: err.message
          });
        });
        break;
    }
  };

  var formats = {
    1: "lpcm"
  };

  self.decode = function (buffer) {
    return new Promise(function (resolve) {
      var reader = new BufferReader(buffer);

      if (reader.readString(4) !== "RIFF") {
        throw new Error("Invalid WAV file");
      }

      reader.readUint32(); // file length

      if (reader.readString(4) !== "WAVE") {
        throw new Error("Invalid WAV file");
      }

      var format = null;
      var audioData = null;

      do {
        var chunkType = reader.readString(4);
        var chunkSize = reader.readUint32();
        switch (chunkType) {
          case "fmt ":
            format = self.decodeFormat(reader, chunkSize);
            break;
          case "data":
            audioData = self.decodeData(reader, chunkSize, format);
            break;
          default:
            reader.skip(chunkSize);
            break;
        }
      } while (audioData === null);

      return resolve(audioData);
    });
  };

  self.decodeFormat = function (reader, chunkSize) {
    var formatId = reader.readUint16();

    if (!formats.hasOwnProperty(formatId)) {
      throw new Error("Unsupported format in WAV file");
    }

    var format = {
      formatId: formatId,
      numberOfChannels: reader.readUint16(),
      sampleRate: reader.readUint32(),
      byteRate: reader.readUint32(),
      blockSize: reader.readUint16(),
      bitsPerSample: reader.readUint16() };
    reader.skip(chunkSize - 16);

    return format;
  };

  self.decodeData = function (reader, chunkSize, format) {
    var length = Math.floor(chunkSize / format.blockSize);
    var channelData = new Array(format.numberOfChannels);

    for (var ch = 0; ch < format.numberOfChannels; ch++) {
      channelData[ch] = new Float32Array(length);
    }

    reader.readPCM(channelData, length, format);

    var buffers = channelData.map(function (data) {
      return data.buffer;
    });

    return {
      numberOfChannels: format.numberOfChannels,
      length: length,
      sampleRate: format.sampleRate,
      buffers: buffers
    };
  };

  function BufferReader(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.length = buffer.byteLength;
    this.pos = 0;
  }

  BufferReader.prototype.skip = function (n) {
    for (var i = 0; i < n; i++) {
      this.view.getUint8(this.pos++);
    }
  };

  BufferReader.prototype.readUint8 = function () {
    var data = this.view.getUint8(this.pos);
    this.pos += 1;
    return data;
  };

  BufferReader.prototype.readInt16 = function () {
    var data = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return data;
  };

  BufferReader.prototype.readUint16 = function () {
    var data = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return data;
  };

  BufferReader.prototype.readUint32 = function () {
    var data = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return data;
  };

  BufferReader.prototype.readString = function (len) {
    var data = "";
    for (var i = 0; i < len; i++) {
      data += String.fromCharCode(this.readUint8());
    }
    return data;
  };

  BufferReader.prototype.readPCM = function (channelData, length, format) {
    var numberOfChannels = format.numberOfChannels;
    var x = 0;
    for (var i = 0; i < length; i++) {
      for (var ch = 0; ch < numberOfChannels; ch++) {
        x = this.readInt16() / 32768;
        channelData[ch][i] = x;
      }
    }
  };
}

decoder.self = decoder.util = self;

module.exports = decoder;
},{}],2:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var InlineWorker = _interopRequire(require("inline-worker"));

var AudioData = _interopRequire(require("audiodata"));

var decoder = _interopRequire(require("./decoder-worker"));

var Decoder = (function () {
  function Decoder() {
    _classCallCheck(this, Decoder);
  }

  _createClass(Decoder, {
    decode: {
      value: function decode(buffer) {
        return new Promise(function (resolve, reject) {
          var worker = new InlineWorker(decoder, decoder.self);

          worker.onmessage = function (e) {
            if (e.data.type === "decoded") {
              var _e$data$audioData = e.data.audioData;
              var numberOfChannels = _e$data$audioData.numberOfChannels;
              var _length = _e$data$audioData.length;
              var sampleRate = _e$data$audioData.sampleRate;
              var buffers = _e$data$audioData.buffers;

              var audioData = new AudioData(numberOfChannels, _length, sampleRate);

              audioData.channelData = buffers.map(function (buffer) {
                return new Float32Array(buffer);
              });

              return resolve(audioData);
            }
            return reject(new Error(e.data.message));
          };

          worker.postMessage({
            type: "decode",
            buffer: buffer
          }, [buffer]);
        });
      }
    }
  }, {
    canProcess: {
      value: function canProcess(buffer) {
        var view = new DataView(buffer);

        var readString = function (length, offset) {
          var data = "";
          for (var i = 0; i < length; i++) {
            data += String.fromCharCode(view.getUint8(i + offset));
          }
          return data;
        };

        try {
          return readString(4, 0) === "RIFF" && readString(4, 8) === "WAVE";
        } catch (e) {}

        return false;
      }
    }
  });

  return Decoder;
})();

module.exports = Decoder;
},{"./decoder-worker":1,"audiodata":5,"inline-worker":6}],3:[function(require,module,exports){
"use strict";

module.exports = require("./decoder");
},{"./decoder":2}],4:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var installed = { decoder: [], encoder: [] };

var AudioData = (function () {
  function AudioData(numberOfChannels, length, sampleRate) {
    _classCallCheck(this, AudioData);

    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.duration = length / sampleRate;
    this.sampleRate = sampleRate;
    this.channelData = new Array(numberOfChannels);

    for (var ch = 0; ch < numberOfChannels; ch++) {
      this.channelData[ch] = new Float32Array(length);
    }
  }

  _createClass(AudioData, {
    getChannelData: {
      value: function getChannelData(ch) {
        return this.channelData[ch];
      }
    },
    toTransferable: {
      value: function toTransferable() {
        var _ref = this;

        var numberOfChannels = _ref.numberOfChannels;
        var length = _ref.length;
        var sampleRate = _ref.sampleRate;

        var buffers = this.channelData.map(function (data) {
          return data.buffer;
        });

        return { numberOfChannels: numberOfChannels, length: length, sampleRate: sampleRate, buffers: buffers };
      }
    }
  }, {
    install: {
      value: function install(klass) {
        if (typeof klass === "function") {
          if (klass.prototype.decode && typeof klass.canProcess === "function") {
            installed.decoder.push(klass);
          }
          if (klass.prototype.encode && typeof klass.canProcess === "function") {
            installed.encoder.push(klass);
          }
        }
        return AudioData;
      }
    },
    decode: {
      value: function decode(buffer) {
        if (buffer && typeof buffer.length === "number") {
          buffer = new Uint8Array(buffer).buffer;
        }
        if (!(buffer instanceof ArrayBuffer)) {
          return Promise.reject(new TypeError("invalid ArrayBuffer for decoding"));
        }

        return new Promise(function (resolve, reject) {
          var decoders = installed.decoder.filter(function (decoder) {
            return decoder.canProcess(buffer);
          });

          var decode = function () {
            var Decoder = decoders.shift();

            if (!Decoder) {
              return reject(new Error("failed to decode"));
            }

            new Decoder().decode(buffer).then(resolve, decode);
          };

          decode();
        });
      }
    },
    encode: {
      value: function encode(audioData, format) {
        if (!(audioData instanceof AudioData)) {
          return Promise.reject(new TypeError("invalid ArrayData for encoding"));
        }

        return new Promise(function (resolve, reject) {
          var encoders = installed.encoder.filter(function (encoder) {
            return encoder.canProcess(format);
          });

          var encode = function () {
            var Encoder = encoders.shift();

            if (!Encoder) {
              return reject(new Error("failed to encode"));
            }

            new Encoder().encode(audioData, format).then(resolve, encode);
          };

          encode();
        });
      }
    }
  });

  return AudioData;
})();

module.exports = AudioData;
},{}],5:[function(require,module,exports){
"use strict";

module.exports = require("./audio-data");
},{"./audio-data":4}],6:[function(require,module,exports){
"use strict";

module.exports = require("./inline-worker");
},{"./inline-worker":7}],7:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    if (WORKER_ENABLED) {
      var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
      var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = function (data) {
      setTimeout(function () {
        _this.onmessage({ data: data });
      }, 0);
    };

    setTimeout(function () {
      func.call(self);
    }, 0);
  }

  _createClass(InlineWorker, {
    postMessage: {
      value: function postMessage(data) {
        var _this = this;

        setTimeout(function () {
          _this.self.onmessage({ data: data });
        }, 0);
      }
    }
  });

  return InlineWorker;
})();

module.exports = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[3])(3)
});