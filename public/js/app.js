(function (holder) {
  var app = {
    log: function () {
      console.log.apply(console, arguments);
    },

    toQueryString: function (obj) {
      var parts = [];
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
        }
      }
      return parts.join("&");
    },

    request: function (url, params) {
      var
        xhr = new XMLHttpRequest,
        dfd = new fApp.Deferred;

      params = params || {};

      xhr.open(params.type || 'GET', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            dfd.resolve(xhr.responseText, xhr);
          } else {
            dfd.reject(xhr.responseText, xhr);
          }
        }
      };
      xhr.send(params.data || null);
      return dfd;
    }
  };

  var _events = {};
  app.eventBus = {
    fire: function (event, params) {
      if (!_events[event]) {
        return this;
      }

      var subscribers = _events[event], i = subscribers.length;
      while (i--) {
        subscribers[i](params);
      }
      return this;
    },

    subscribeTo: function (event, fn) {
      _events[event] = _events[event] || [];
      _events[event].push(fn);
      return this;
    }
  };

  holder.fApp = app;
})(window);
