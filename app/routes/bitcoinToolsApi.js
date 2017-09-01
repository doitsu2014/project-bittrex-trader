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
		console.log("Somebody came middleware");
		var doitsuSecret = config.secret;
		var token = req.body.token || req.params.token || req.headers['x-access-token'];
		if (token) {
			console.log("Verifing Token");
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

	apiRouter.route('/markets')
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

	apiRouter.route('/markets/buylimit')
		.post(function (req, res) {
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			var reqRate = req.body.reqRate;
			console.log(`reqMarketName ${reqMarketName} --- reqQuantity ${reqQuantity} --- reqRate ${reqRate}`);
			bittrex.buylimit({
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

	apiRouter.route('/markets/selllimit')
		.post(function (req, res) {
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			var reqRate = req.body.reqRate;

			bittrex.selllimit({
				marmarket: reqMarketName,
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
	apiRouter.route('/me')
		.get(function (req, res) {
			res.send(req.decoded);
		});

	return apiRouter;
}