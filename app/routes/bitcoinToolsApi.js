var bittrex = require('node.bittrex.api');
var config = require('../../config.js');

bittrex.options({
	'apikey': config.apikey,
	'apisecret': config.apisecret
});

module.exports = function(app, express) {
	var apiRouter = express.Router();
	apiRouter.post('/markets', function(req, res) {
		bittrex.getmarketsummaries(function(data, err) {
			if (err) {
				return res.json(
					{
						success: false,
						message: err
					})
			}
			res.json({
				markets: (data.result.filter(m => m.MarketName.includes(req.body.marketType)))
			});
		})
	});

	apiRouter.post('/markets/buylimit', function(req, res) {
		var reqMarketName = req.body.reqMarketName;
		var reqQuantity = req.body.reqQuantity;
		var reqRate = req.body.reqRate;
		console.log(`reqMarketName ${reqMarketName} --- reqQuantity ${reqQuantity} --- reqRate ${reqRate}`);
		bittrex.buylimit({market: reqMarketName, quantity: reqQuantity, rate: reqRate}, function(data, err) {
			if (err) {
				res.status(200).send(err);
			}
			res.json(data);
		});
	});

	apiRouter.post('/markets/selllimit', function(req, res) {
		var reqMarketName = req.body.reqMarketName;
		var reqQuantity = req.body.reqQuantity;
		var reqRate = req.body.reqRate;

		bittrex.selllimit({marmarket: reqMarketName, quantity: reqQuantity, rate: reqRate}, function(data, err) {
			if (err) {
				res.send(err);				
			}
			res.json(data);
		});
	});
	return apiRouter;
}