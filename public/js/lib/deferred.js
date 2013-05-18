(function (app) {

  function Deferred () {
    if (this == window) {
      return new Deferred();
    }
    this._callbacks = { done: [], fail: [], allways: [] };
    this._state = null;
  };

  Deferred.prototype = {
    resolve: function () {
      this._state = true;
      iterator.call(this, 'done', arguments);
      iterator.call(this, 'allways', arguments);
    },

    reject: function () {
      this._state = false;
      iterator.call(this, 'fail', arguments);
      iterator.call(this, 'allways', arguments);
    },

    isOk: function () {
      return this._state === true
    },

    isErr: function () {
      return this._state === false
    },

    isProcessed: function () {
      return this._state !== null
    }
  };

  function iterator(type, args) {
    var
      methods = this._callbacks[type],
      i = methods.length;

    while(i--) {
      methods[i].apply(this, args);
    }
  }


  ['done', 'fail', 'allways'].forEach(function (method) {
    Deferred.prototype[method] = function (fn) {
      this._callbacks[method].push(fn);
      return this;
    };
  });

  app.Deferred = Deferred;
})(fApp);
