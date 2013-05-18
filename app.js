var
  express = require('express'),
  http = require('http'),
  path = require('path'),
  controller = require('./controllers/main');

var app = express();

app.configure(function () {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.multipart());
  app.use(express.logger('dev'));
  app.use(app.router);
});

app.get('/', controller.index);
app.get('/download/:file_id', controller.beginDownload);
app.get('/details/:file_id', controller.fileDetails);
app.get('/pending_connections/:file_id', controller.pendingClients);

app.post('/register_file/:file_id', controller.registerFile);
app.post('/unregister_file/:file_id', controller.unregisterFile);
app.post('/transfer_chunk/:file_id/:conn_id', controller.transferChunk);

app.listen(3000);
console.log('listening on port 3000\n');