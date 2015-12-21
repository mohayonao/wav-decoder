var InlineWorker = require("inline-worker");
var DecoderWorker = require("./DecoderWorker");
var instance = null;

function Decoder() {
  var _this = this;

  this._worker = new InlineWorker(DecoderWorker, DecoderWorker.self);
  this._worker.onmessage = function(e) {
    var data = e.data;
    var callback = _this._callbacks[data.callbackId];

    if (callback) {
      if (data.type === "decoded") {
        callback.resolve({
          sampleRate: data.audioData.sampleRate,
          channelData: data.audioData.buffers.map(function(buffer) {
            return new Float32Array(buffer);
          }),
        });
      } else {
        callback.reject(new Error(data.message));
      }
    }

    _this._callbacks[data.callbackId] = null;
  };
  this._callbacks = [];
}

Decoder.decode = function decode(buffer) {
  if (instance === null) {
    instance = new Decoder();
  }
  return instance.decode(buffer);
};

Decoder.prototype.decode = function decode(buffer) {
  var _this = this;

  return new Promise(function(resolve, reject) {
    var callbackId = _this._callbacks.length;

    _this._callbacks.push({ resolve: resolve, reject: reject });

    if (buffer && buffer.buffer instanceof ArrayBuffer) {
      if (!buffer.readUInt8) {
        buffer = buffer.buffer;
      }
    }

    _this._worker.postMessage({
      type: "decode", buffer: buffer, callbackId: callbackId,
    }, [ buffer ]);
  });
}

module.exports = Decoder;
