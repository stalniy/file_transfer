var fileRegister = {
  files: {},

  addFile: function (id, params) {
    params.connections = {};
    params.id = id;
    this.files[id] = params;
  },

  removeFile: function (id) {
    delete this.files[id];
  },

  detailsOf: function (fileId) {
    details = extend({}, this.files[fileId]);
    delete details.connections;
    return details;
  },

  connection: function (fileId, connId) {
    return this.files[fileId] ? this.files[fileId].connections[connId] : null;
  },

  connectionsOf: function (fileId) {
    return this.files[fileId] ? Object.keys(this.files[fileId].connections) : null;
  },

  addConnection: function (fileId, params) {
    if (!this.files[fileId]) {
      return null;
    }

    var connId = Math.random().toString(36).substr(5);
    this.files[fileId].connections[connId] = params;
    return connId;
  },

  removeConnection: function (fileId, connId) {
    if (!this.files[fileId]) {
      return false;
    }

    var connections = this.files[fileId].connections;
    if (connections[connId]) {
      connections[connId].client.end();
      delete connections[connId];
    }
  }
};


var controller = {
  index: function (req, res) {
    res.sendfile('public/upload.html');
  },

  registerFile: function (req, res) {
    fileRegister.addFile(req.params.file_id, {
      name: req.body.name,
      type: req.body.type,
      size: req.body.size
    });
    controller.renderSuccess(res);
  },

  unregisterFile: function (req, res) {
    fileRegister.removeFile(req.params.file_id);
    controller.renderSuccess(res);
  },

  pendingClients: function (req, res) {
    var connections = fileRegister.connectionsOf(req.params.file_id);
    if (!connections) {
      return controller.renderError(res);
    }
    res.send(connections);
  },

  beginDownload: function (req, res) {
    var connId = fileRegister.addConnection(req.params.file_id, {
      ip: req.connection.remoteAddress,
      client: res
    });

    if (connId) {
      var conn = fileRegister.connection(req.params.file_id, connId);
      controller.sendAttachment(req.params.file_id, res);
    } else {
      controller.renderError(res);
    }
  },

  transferChunk: function (req, res) {
    var conn = fileRegister.connection(req.params.file_id, req.params.conn_id);

    req.on('data', function (file_chunk) {
      if (conn) {
        conn.client.write(file_chunk);
      } else {
        res.send({ status: "canceled", stop_transfer: true });
      }
    });
    req.on('end', function () {
      controller.renderSuccess(res);
    });
    req.on('drain', function () {
      controller.renderSuccess(res);
    });

    if (conn && !conn.isProcessing) {
      conn.isProcessing = true;
      conn.client.on('close', function () {
        // TODO: looks like it's possible to restore connection
        fileRegister.removeConnection(req.params.file_id, req.params.conn_id);
      });
    }
  },

  fileDetails: function (req, res) {
    var details = fileRegister.detailsOf(req.params.file_id);

    if (details) {
      if (req.query.with_details) {
        res.send(details);
      } else {
        res.sendfile('public/download.html');
      }
    } else {
      res.send(404);
    }
  },

  renderError: function (response) {
    response.send({ status: "error", message: "Unable to process operation" });
  },

  renderSuccess: function (response) {
    response.send({ status: "success", message: "Operation has been succesfully done" });
  },

  sendAttachment: function (fileId, response) {
    var details = fileRegister.detailsOf(fileId);
    response.writeHead(200, {
      'Content-Type': details.type,
      'Content-Disposition': 'attachment; filename="' +  details.name + '"',
      'Content-length': details.size
    });
  }
};

function extend(to, from) {
  for (var prop in from) {
    if (from.hasOwnProperty(prop)) {
      to[prop] = from[prop];
    }
  }
  return to;
}

module.exports = controller;
