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
  self.onmessage = function(e) {
    switch (e.data.type) {
      case "decode":
        self.decode(e.data.buffer).then(function(audioData) {
          self.postMessage({
            type: "decoded",
            audioData: audioData
          }, [ audioData.buffers ]);
        }).catch(function(err) {
          self.postMessage({
            type: "error",
            message: err.message
          });
        });
        break;
    }
  };

  var formats = {
    0x0001: "lpcm",
    0x0003: "lpcm",
  };

  self.decode = function(buffer) {
    return new Promise(function(resolve) {
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

  self.decodeFormat = function(reader, chunkSize) {
    var formatId = reader.readUint16();

    if (!formats.hasOwnProperty(formatId)) {
      throw new Error("Unsupported format in WAV file");
    }

    var format = {
      formatId: formatId,
      floatingPoint: formatId === 0x0003,
      numberOfChannels: reader.readUint16(),
      sampleRate: reader.readUint32(),
      byteRate: reader.readUint32(),
      blockSize: reader.readUint16(),
      bitsPerSample: reader.readUint16(),
    };
    reader.skip(chunkSize - 16);

    return format;
  };

  self.decodeData = function(reader, chunkSize, format) {
    var length = Math.floor(chunkSize / format.blockSize);
    var channelData = new Array(format.numberOfChannels);

    for (var ch = 0; ch < format.numberOfChannels; ch++) {
      channelData[ch] = new Float32Array(length);
    }

    reader.readPCM(channelData, length, format);

    var buffers = channelData.map(function(data) {
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

  BufferReader.prototype.skip = function(n) {
    for (var i = 0; i < n; i++) {
      this.view.getUint8(this.pos++);
    }
  };

  BufferReader.prototype.readUint8 = function() {
    var data = this.view.getUint8(this.pos);
    this.pos += 1;
    return data;
  };

  BufferReader.prototype.readInt16 = function() {
    var data = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return data;
  };

  BufferReader.prototype.readUint16 = function() {
    var data = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return data;
  };

  BufferReader.prototype.readUint32 = function() {
    var data = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return data;
  };

  BufferReader.prototype.readString = function(len) {
    var data = "";
    for (var i = 0; i < len; i++) {
      data += String.fromCharCode(this.readUint8());
    }
    return data;
  };

  BufferReader.prototype.readPCM = function(channelData, length, format) {
    var numberOfChannels = format.numberOfChannels;
    var uint8 = new Uint8Array(this.view.buffer, this.pos);
    var viewLength = length * numberOfChannels;
    var bytes = format.bitsPerSample >> 3;
    var byteOffset = Math.ceil(uint8.byteOffset / bytes) * bytes;
    var view, dx = 1;

    if (format.floatingPoint) {
      switch (format.bitsPerSample) {
        case 32:
          view = new Float32Array(uint8.buffer, byteOffset, viewLength);
          break;
        case 64:
          view = new Float64Array(uint8.buffer, byteOffset, viewLength);
          break;
      }
    } else {
      switch (format.bitsPerSample) {
        case 8:
          view = new Int8Array(uint8.buffer, byteOffset, viewLength);
          dx = 128;
          break;
        case 16:
          view = new Int16Array(uint8.buffer, byteOffset, viewLength);
          dx = 32768;
          break;
        case 24:
          view = convert24to32(uint8, uint8.byteOffset, viewLength * 3);
          dx = 8388608;
          break;
        case 32:
          view = new Int32Array(uint8.buffer, byteOffset, viewLength);
          dx = 2147483648;
          break;
      }
    }

    if (!view) {
      throw new Error("not suppoerted bit depth " + format.bitsPerSample);
    }

    for (var i = 0; i < length; i++) {
      for (var ch = 0; ch < numberOfChannels; ch++) {
        channelData[ch][i] = view[i * numberOfChannels + ch] / dx;
      }
    }

    this.pos += length;
  };

  function convert24to32(int8, byteOffset, viewLength) {
    var uint8 = new Uint8Array(int8.buffer, byteOffset, viewLength);
    var int32 = new Int32Array(uint8.length / 3);

    for (var i = 0, imax = int32.length; i < imax; i++) {
      var x0 = uint8[i * 3 + 0];
      var x1 = uint8[i * 3 + 1];
      var x2 = uint8[i * 3 + 2];
      var xx = x0 + (x1 << 8) + (x2  << 16);

      int32[i] = (xx & 0x800000) ? xx - 16777216 : xx;
    }

    return int32;
  }
}

decoder.self = decoder.util = self;

module.exports = decoder;
