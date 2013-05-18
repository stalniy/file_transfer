(function (app) {
  var
    FILE_DETAILS_URL  = '/details/',
    FILE_DOWNLOAD_URL = '/download/',

    uploader   = app.fileUploader,
    connection = app.connection;

  app.eventBus.subscribeTo('connections:exists', function (params) {
    var progressBars = params.connections.map(function (id) {
      return app.template('tmpl-progress-bar', { connId: id });
    });

    document.getElementById('file-upload-progress').innerHTML = progressBars.join('');
    uploader.process(params.connections);
    connection.markAsProcessing(params.connections);
  });

  app.eventBus.subscribeTo("file:chunk_transfered", function (params) {
    var
      barNodes  = View.progressBarFor(params.connId),
      chunkProgress   =  params.chunk.size / params.file.size * 100,
      currentProgress = parseFloat(barNodes[0].style.width) || 0,
      progress  = currentProgress + chunkProgress
    ;
    if (progress > 100) {
      progress = 100;
    }
    barNodes[0].style.width = progress.toFixed(2) + '%';
    barNodes[1].innerHTML = progress.toFixed(2) + '%';
  });

  app.eventBus.subscribeTo("file:transfered", function (params) {
    var barNodes = View.progressBarFor(params.connId)
    barNodes[0].style.width = '100%';
    barNodes[1].innerHTML = '100%';
    connection.destroy(params.connId);
    app.log("transfered: ", params)
  });

  app.eventBus.subscribeTo("file:transfer_canceled", function (params) {
    app.log("cancel by: ", params)
    connection.destroy(params.connId);
  });


  var View = {
    fileDetailsNode: function () {
      return document.getElementById('file-details');
    },

    formatSize: function (bytes) {
      var size = bytes / (1024 * 1024);
      return size.toFixed(2) + 'M';
    },

    renderFile: function (file) {
      var details = file.getDetails();
      details.url = location.protocol + '//' + location.host + FILE_DETAILS_URL + file.getId();
      details.size = View.formatSize(details.size);
      View.fileDetailsNode().innerHTML = app.template('tmpl-file-info', details);
    },

    progressBarFor: function (connId) {
      return this.progressBarNode().querySelectorAll('.progress-bar[data-conn-id="' + connId + '"] span');
    },

    progressBarNode: function () {
      return document.querySelector('#file-upload-progress');
    },

    handleFileChange: function () {
      var formNode = document.forms.file_upload;
      if (!formNode) {
        return;
      }
      formNode.file.addEventListener('change', function () {
        if (this.files[0]) {
          View.progressBarNode().innerHTML = '';
          uploader.register(this.files[0])
            .done(View.renderFile)
            .done(function (file) { connection.waitForClients(file) })
        } else {
          View.fileDetailsNode().innerHTML = '';
        }
      }, false);
    },

    renderFileDetails: function () {
      var downloadLink = document.getElementById('file-download');
      if (downloadLink) {
        app.request(location.href + '?with_details=1').done(function (response) {
          var details = JSON.parse(response);
          details.size = View.formatSize(details.size);
          View.fileDetailsNode().innerHTML = app.template('tmpl-file-info', details);
          downloadLink.setAttribute('href', location.protocol + '//' + location.host + FILE_DOWNLOAD_URL + details.id);
        });
      }
    }
  };

  document.addEventListener("DOMContentLoaded", View.handleFileChange, false);
  document.addEventListener("DOMContentLoaded", View.renderFileDetails, false);

})(fApp);
