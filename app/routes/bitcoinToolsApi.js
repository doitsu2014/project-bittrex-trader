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
				return console.error(err);
			}
			res.json({
				markets: (data.result.filter(m => m.MarketName.includes(req.body.marketType)))
			});
		})
	});

	return apiRouter;
}