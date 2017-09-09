var bittrex = require('node.bittrex.api');
var config = require('../../config.js');
var jsonwebtoken = require('jsonwebtoken');

module.exports = function (app, express) {
	var apiRouter = express.Router();

	apiRouter.post('/authenticate', function (req, res) {
		var userKey = req.body.userKey;
		var userSecret = req.body.userSecret;
		var doitsuSecret = config.secret;
		if (userKey && userSecret) {
			bittrex.options({
				'apikey': userKey,
				'apisecret': userSecret
			});
			var token = jsonwebtoken.sign({
				bittrexKey: userKey,
				bittrexSecret: userSecret
			}, doitsuSecret, {
				expiresIn: 60 * 60 * 48
			});
			res.json({
				success: true,
				message: 'Enjoy your token!',
				token: token
			});
		} else {
			res.json({
				success: false,
				message: 'Have to write Key and Secret'
			});
		}
	});

	apiRouter.use(function (req, res, next) {
		var doitsuSecret = config.secret;
		var token = req.body.token || req.params.token || req.headers['x-access-token'];
		if (token) {
			jsonwebtoken.verify(token, doitsuSecret, function (err, decoded) {
				if (err) {
					return res.json({
						success: false,
						message: 'failed to authenticate token'
					});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			console.log("Bad Token");
			return res.status(403).send({
				success: false,
				message: 'No token provided'
			});
		}
	});

	apiRouter.route('/marketsummaries')
		.post(function (req, res) {
			bittrex.getmarketsummaries(function (data, err) {
				if (err) {
					return res.json({
						success: false,
						message: err
					})
				}
				res.json({
					markets: (data.result.filter(m => m.MarketName.includes(req.body.marketType)))
				});
			})
		});

	apiRouter.route('/marketsummary')
		.post(function (req, res) {
			bittrex.getmarketsummary({
				market: req.body.marketName
			}, function (data, err) {
				if (err) {
					console.log("Response Err: ");
					return res.json({
						success: false,
						message: err
					});
				}
				res.json({
					market: data.result
				});
			});
		});

	apiRouter.route('/markets/buylimit')
		.post(function (req, res) {
			bittrex.options({
				'apikey': req.decoded.bittrexKey,
				'apisecret': req.decoded.bittrexSecret
			});
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			var reqRate = req.body.reqRate;
			bittrex.buylimit({
				market: reqMarketName,
				quantity: reqQuantity,
				rate: reqRate
			}, function (data, err) {
				if (err) {
					res.send(err);
					return console.log(err);
				}
				console.log(data);
				res.json(data);
			});
		});

	apiRouter.route('/markets/selllimit')
		.post(function (req, res) {
			bittrex.options({
				'apikey': req.decoded.bittrexKey,
				'apisecret': req.decoded.bittrexSecret
			});
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			var reqRate = req.body.reqRate;
			bittrex.selllimit({
				market: reqMarketName,
				quantity: reqQuantity,
				rate: reqRate
			}, function (data, err) {
				if (err) {
					res.send(err);
					return console.log(err);
				}
				res.json(data);
			});
		});

	apiRouter.route('/markets/getordersbook')
		.post(function (req, res) {
			
			var reqMarketName = req.body.reqMarketName;
			var reqType = req.body.reqType;

			bittrex.getorderbook({
				market: reqMarketName,
				type: reqType
			}, function (data, err) {
				if (err) {
					return res.send(err);
				}
				res.json({Orders: data.result});
			});
		});
		
	apiRouter.route('/me')
		.get(function (req, res) {
			res.send(req.decoded);
		});

	return apiRouter;
};

