(function (app) {
  var
    BYTES_PER_CHUNK     = 1024 * 1024,
    UPLOAD_URL          = '/transfer_chunk/',
    REGISTER_FILE_URL   = '/register_file/',
    UNREGISTER_FILE_URL = '/unregister_file/',
    SEND_INTERVAL = 500,

    fileForTransfer, timerId, stopTransfer = false;

  var fileUploader = {
    BYTES_PER_CHUNK:   BYTES_PER_CHUNK,

    register: function (rawFile) {
      if (fileForTransfer) {
        stopTransfer = false;
        this.unregister(fileForTransfer);
      }

      fileForTransfer = new app.File(rawFile);

      var dfd = new app.Deferred;
      app.request(REGISTER_FILE_URL + fileForTransfer.getId(), {
        type: "POST",
        data: objectToFormData(fileForTransfer.getDetails())
      }).done(function (response) {
        dfd.resolve(fileForTransfer, response);
      });
      return dfd;
    },

    unregister: function (file) {
      return app.request(UNREGISTER_FILE_URL + file.getId(), { type: 'POST' });
    },

    process: function (connectionIds) {
      if (fileForTransfer) {
        for (var i = 0, count = connectionIds.length; i < count; i++) {
          this.sendInChunks(fileForTransfer, connectionIds[i]);
        }
      }
    },

    sendInChunks: function (file, connId) {
      var chunksCount = Math.ceil(file.getSize() / BYTES_PER_CHUNK);
      var index = 0;

      setTimeout(function sendChunks() {
        var limit = index + 5;
        if (limit > chunksCount) {
          limit = chunksCount;
        }
        for (; !stopTransfer && index < limit; index++) {
          sendChunkTo(connId, file, index * BYTES_PER_CHUNK, BYTES_PER_CHUNK);
        }
        if (!stopTransfer && index < chunksCount) {
          setTimeout(sendChunks, SEND_INTERVAL);
        } else {
          app.eventBus.fire(stopTransfer ? 'file:transfer_canceled' : 'file:transfered', { file: file, connId: connId });
          stopTransfer = false;
        }
      }, SEND_INTERVAL);
      return this;
    }
  };

  function sendChunkTo(connId, file, offset, length) {
    var
      blob = file.slice(offset, offset + length),
      url  = UPLOAD_URL + file.getId() + '/' + connId;

    return app.request(url, { type: 'POST', data: blob }).done(function (response) {
      var response = JSON.parse(response);
      if (response.stop_transfer) {
        stopTransfer = true;
      } else {
        app.eventBus.fire('file:chunk_transfered', { chunk: blob, file: file.getFile(), connId: connId });
      }
    }).fail(function () {
      app.log("Failed to send chunk: ", [file.getId(), offset, length, file.getName()].join(' | '));
    });
  }

  function objectToFormData(object) {
    var data = new FormData();
    for (var prop in object) {
      if (object.hasOwnProperty(prop)) {
        data.append(prop, object[prop]);
      }
    }
    return data;
  }

  app.fileUploader = fileUploader;
})(fApp);
