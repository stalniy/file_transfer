(function (app) {
  var
    PING_URL  = '/pending_connections/',
    PING_TIME = 3000,

    timerId, pendingConnections = {};

  var connection = {
    waitForClients: function (file) {
      var self = this;

      self.stopWaiting();
      timerId = setInterval(function(){ self.pingClients(file) }, PING_TIME);
      return timerId;
    },

    stopWaiting: function () {
      clearInterval(timerId);
    },

    pingClients: function (file) {
      app.request(PING_URL + file.getId()).done(function (response) {
        var connections = (JSON.parse(response) || []).filter(function (id) {
          return !(id in pendingConnections)
        });

        if (connections.length) {
          app.eventBus.fire('connections:exists', {
            file: file,
            connections: connections
          });
        }
      }).fail(function (response) {
        app.log("Failed to ping server:", response);
      });
    },

    markAsProcessing: function (connectionIds) {
      var i = connectionIds.length;
      while (i--) {
        pendingConnections[connectionIds[i]] = true;
      }
    },

    destroy: function (connId) {
      delete pendingConnections[connId];
    }
  };

  app.connection = connection;
})(fApp);
