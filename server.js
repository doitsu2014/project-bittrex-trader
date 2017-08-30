var express = require('express');
var app = express();
var config = require('./config');
var path = require("path");
var bodyParser = require('body-parser');
var bitcoinToolsApi = require('./app/routes/bitcoinToolsApi') (app, express);
var morgan = require('morgan');
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');

	next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(express.static(__dirname + '/public'));

app.use('/api', bitcoinToolsApi);

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

var port = config.port;
app.listen(port, () => console.log(`Server start at PORT ${port}`));