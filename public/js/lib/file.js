(function (app) {
  var File = function (blob) {
    var id = Math.random().toString(36).substr(5);

    this.getFile = function () { return blob };
    this.getId   = function () { return id   };
  };

  File.prototype = {
    slice: function () {
      var file = this.getFile();
      return (file.slice || file.webkitSlice || file.mozSlice).apply(file, arguments);
    },

    getSize: function () {
      return this.getFile().size;
    },

    getType: function () {
      return this.getFile().type;
    },

    getName: function () {
      return this.getFile().name;
    },

    getDetails: function () {
      return {
        name: this.getName(),
        size: this.getSize(),
        type: this.getType(),
        id:   this.getId()
      };
    }
  };

  fApp.File = File;
})(fApp);
