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
          var data = {
            type: "decoded",
            callbackId: e.data.callbackId,
            audioData: audioData
          };
          self.postMessage(data, [audioData.buffers]);
        }, function (err) {
          var data = {
            type: "error",
            callbackId: e.data.callbackId,
            message: err.message
          };
          self.postMessage(data);
        });
        break;
    }
  };

  var formats = {
    1: "lpcm",
    3: "lpcm" };

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
      floatingPoint: formatId === 3,
      numberOfChannels: reader.readUint16(),
      sampleRate: reader.readUint32(),
      byteRate: reader.readUint32(),
      blockSize: reader.readUint16(),
      bitDepth: reader.readUint16() };
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

  BufferReader.prototype.readPCM8 = function () {
    var data = (this.view.getUint8(this.pos) - 128) / 128;
    this.pos += 1;
    return data;
  };

  BufferReader.prototype.readPCM16 = function () {
    var data = this.view.getInt16(this.pos, true) / 32768;
    this.pos += 2;
    return data;
  };

  BufferReader.prototype.readPCM24 = function () {
    var x0 = this.view.getUint8(this.pos + 0);
    var x1 = this.view.getUint8(this.pos + 1);
    var x2 = this.view.getUint8(this.pos + 2);
    var xx = x0 + (x1 << 8) + (x2 << 16);
    var data = (xx & 8388608 ? xx - 16777216 : xx) / 8388608;
    this.pos += 3;
    return data;
  };

  BufferReader.prototype.readPCM32 = function () {
    var data = this.view.getInt32(this.pos, true) / 2147483648;
    this.pos += 4;
    return data;
  };

  BufferReader.prototype.readPCM32F = function () {
    var data = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return data;
  };

  BufferReader.prototype.readPCM64F = function () {
    var data = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return data;
  };

  BufferReader.prototype.readPCM = function (channelData, length, format) {
    var numberOfChannels = format.numberOfChannels;
    var method = "readPCM" + format.bitDepth;

    if (format.floatingPoint) {
      method += "F";
    }

    if (!this[method]) {
      throw new Error("not suppoerted bit depth " + format.bitDepth);
    }

    for (var i = 0; i < length; i++) {
      for (var ch = 0; ch < numberOfChannels; ch++) {
        channelData[ch][i] = this[method]();
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

var decoder = _interopRequire(require("./decoder-worker"));

var Decoder = (function () {
  function Decoder() {
    var _this = this;

    _classCallCheck(this, Decoder);

    this._worker = new InlineWorker(decoder, decoder.self);
    this._worker.onmessage = function (e) {
      var callback = _this._callbacks[e.data.callbackId];

      if (callback) {
        if (e.data.type === "decoded") {
          var audioData = e.data.audioData;

          audioData.channelData = audioData.buffers.map(function (buffer) {
            return new Float32Array(buffer);
          });

          callback.resolve(audioData);
        } else {
          callback.reject(new Error(e.data.message));
        }
      }

      _this._callbacks[e.data.callbackId] = null;
    };
    this._callbacks = [];
  }

  _createClass(Decoder, {
    canProcess: {
      value: function canProcess(format) {
        return Decoder.canProcess(format);
      }
    },
    decode: {
      value: function decode(buffer) {
        var _this = this;

        return new Promise(function (resolve, reject) {
          var callbackId = _this._callbacks.length;

          _this._callbacks.push({ resolve: resolve, reject: reject });

          if (buffer && typeof buffer.length === "number") {
            buffer = new Uint8Array(buffer).buffer;
          }

          _this._worker.postMessage({
            type: "decode", buffer: buffer, callbackId: callbackId
          }, [buffer]);
        });
      }
    }
  }, {
    canProcess: {
      value: function canProcess(format) {
        return format === "wav";
      }
    },
    decode: {
      value: function decode(buffer) {
        return new Decoder().decode(buffer);
      }
    }
  });

  return Decoder;
})();

module.exports = Decoder;
},{"./decoder-worker":1,"inline-worker":4}],3:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Decoder = _interopRequire(require("./decoder"));

module.exports = Decoder;
},{"./decoder":2}],4:[function(require,module,exports){
"use strict";

module.exports = require("./inline-worker");
},{"./inline-worker":5}],5:[function(require,module,exports){
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