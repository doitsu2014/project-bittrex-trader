var bittrex = require('node.bittrex.api');
var config = require('../../config.js');
var jsonwebtoken = require('jsonwebtoken');
var asyncLoop = require('node-async-loop');
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
				expiresIn: 60 * 60 * 24 * 30
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

					return res.send(err);
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

					return res.send(err);
				}
				res.json(data);
			});
		});



	apiRouter.route('/markets/buylimit2')
		.post(function (req, res) {
			bittrex.options({
				'apikey': req.decoded.bittrexKey,
				'apisecret': req.decoded.bittrexSecret
			});
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			// var reqType = req.body.reqType;
			var reqType = "sell";
			// get orders book
			bittrex.getorderbook({
				market: reqMarketName,
				type: reqType
			}, function (data, err) {
				if (err) {
					return res.send(err);
				}
				// orders book here
				var ordersBook = data.result;
				var baseQuantity = Number.parseFloat(reqQuantity);
				if(baseQuantity <= 0) {
					return res.json({
						success: false,
						message: "You buy 0 so you buy nothing",
						totalSuccess: 0,
						totalFail: 0
					});
				}
				var resultMes = "";
				var totalSuccess = 0;
				var totalFail = 0;
				// count to know the end of loop before return res.json
				var countLoop = 0;
				asyncLoop(ordersBook, function (item, next) {
					// good quantity, you have to pay
					// base quantity in buy action is the left side of market, 
					// so we have to convert it to right side that action help us to pass a good quantity to action buy
					var goodQuantity =	baseQuantity / item.Rate;
					if (goodQuantity > 0) {
						if (goodQuantity <= item.Quantity) {
							// buy all good quantity
							bittrex.buylimit({
								market: reqMarketName,
								quantity: goodQuantity,
								rate: item.Rate
							}, function (data, err) {
								if (err) {
									// end of buy cycle you buy all base quantity
									resultMes += `Buy: q_${goodQuantity} --- r_${item.Rate} --- m_${err.message}\n`;
									totalFail+= baseQuantity;
									baseQuantity -= item.Quantity * item.Rate;
									return res.json({
										success: false,
										message: resultMes,
										totalSuccess: totalSuccess,
										totalFail: totalFail
									});
								} else {
									resultMes += `Buy: q_${goodQuantity} --- r_${item.Rate} --- m_Success\n`;
									totalSuccess += baseQuantity;									
									baseQuantity -= item.Quantity * item.Rate;
									return res.json({
										success: "true",
										message: resultMes,
										totalSuccess: totalSuccess,
										totalFail: totalFail										
									});
								}
							});
						} else {
							// buy all order Quantity
							bittrex.buylimit({
								market: reqMarketName,
								quantity: item.Quantity,
								rate: item.Rate
							}, function (data, err) {
								if (err) {
									// return res.json({success:false, message: err});
									resultMes += `Buy: q_${item.Quantity} --- r_${item.Rate} --- m_${err.message}\n`;
									totalFail += item.Quantity * item.Rate;									
									baseQuantity -= item.Quantity * item.Rate;
									//if end of loop => return directly
									if (countLoop === ordersBook.length-1) {
										return res.json({
											success: false,
											message: resultMes,
											totalSuccess: totalSuccess,
											totalFail: totalFail
										});
									} else {
										++countLoop;
										next();
									}
								} else {
									resultMes += `Buy: q_${item.Quantity} --- r_${item.Rate} --- m_Success}\n`;
									totalSuccess += item.Quantity * item.Rate;								
									baseQuantity -= item.Quantity * item.Rate;
									//if end of loop => return directly
									if (countLoop === ordersBook.length-1) {
										return res.json({
											success: true,
											message: resultMes,
											totalSuccess: totalSuccess,
											totalFail: totalFail
										});
									} else {
										++countLoop;
										next();
									}
								}
							});
						}
					}
				}, function (err) {

				});
			});
		});

	apiRouter.route('/markets/selllimit2')
		.post(function (req, res) {
			bittrex.options({
				'apikey': req.decoded.bittrexKey,
				'apisecret': req.decoded.bittrexSecret
			});
			var reqMarketName = req.body.reqMarketName;
			var reqQuantity = req.body.reqQuantity;
			var reqType = "buy";
			// get orders book
			bittrex.getorderbook({
				market: reqMarketName,
				type: reqType
			}, function (data, err) {
				if (err) {
					return res.send(err);
				}
				// orders book here
				var ordersBook = data.result;
				var baseQuantity = Number.parseFloat(reqQuantity);
				if(baseQuantity <= 0) {
					return res.json({
						success: false,
						message: "You sell 0 so you buy nothing",
						totalSuccess: 0,
						totalFail: 0
					});
				}
				var resultMes = "";
				var totalSuccess = 0;
				var totalFail = 0;
				// count to know the end of loop before return res.json
				var countLoop = 0;
				asyncLoop(ordersBook, function (item, next) {
					// good quantity, you have to pay 
					// var goodQuantity = Number.parseFloat(baseQuantity) / Number.parseFloat(item.Rate);
					if (baseQuantity > 0) {
						if (baseQuantity <= item.Quantity) {
							// sell all good quantity
							bittrex.selllimit({
								market: reqMarketName,
								quantity: baseQuantity,
								rate: item.Rate
							}, function (data, err) {
								if (err) {
									// baseQuantity -= Number.parseFloat(item.Rate) * goodQuantity;
									resultMes += `Sell: q_${baseQuantity} --- r_${item.Rate} --- m_${err.message}\n`;
									totalFail += baseQuantity;									
									baseQuantity -= item.Quantity;
									return res.json({
										success: false,
										message: resultMes,
										totalSuccess: totalSuccess,
										totalFail: totalFail
									});
								} else {
									resultMes += `Sell: q_${baseQuantity} --- r_${item.Rate} --- m_Success\n`;
									totalSuccess += item.Quantity;
									baseQuantity -= item.Quantity;
									return res.json({
										success: "true",
										message: resultMes,
										totalSuccess: totalSuccess,
										totalFail: totalFail										
									});
								}
							});
						} else {
							// sell all order Quantity
							bittrex.selllimit({
								market: reqMarketName,
								quantity: item.Quantity,
								rate: item.Rate
							}, function (data, err) {
								if (err) {
									// return res.json({success:false, message: err});
									resultMes += `Sell: q_${item.Quantity} --- r_${item.Rate} --- m_${err.message}\n`;
									totalFail += baseQuantity;
									baseQuantity -= item.Quantity;
									if (countLoop === ordersBook.length-1) {
										return res.json({
											success: false,
											message: resultMes,
											totalSuccess: totalSuccess,
											totalFail: totalFail
										});
									} else {
										++countLoop;
										next();
									}
								} else {
									resultMes += `Sell: q_${item.Quantity} --- r_${item.Rate} --- m_Success}\n`;
									totalSuccess += item.Quantity;									
									baseQuantity -= item.Quantity;
									if (countLoop === ordersBook.length-1) {
										return res.json({
											success: true,
											message: resultMes,
											totalSuccess: totalSuccess,
											totalFail: totalFail
										});
									} else {
										++countLoop;
										next();
									}
								}
							});
						}
					}

				}, function (err) {

				});
			});
		});

	apiRouter.route('/user/getbalance')
		.post(function (req, res) {
			bittrex.options({
				'apikey': req.decoded.bittrexKey,
				'apisecret': req.decoded.bittrexSecret
			});
			var reqCurrency = req.body.reqCurrency;
			bittrex.getbalance({
				currency: reqCurrency,
			}, function (data, err) {
				if (err) {
					return res.json({
						success: false,
						message: err
					});
				}
				res.json({
					balance: data.result
				});
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
					return res.json({
						success: false,
						message: "err"
					});
				}
				res.json({
					Orders: data.result
				});
			});
		});

	apiRouter.route('/me')
		.get(function (req, res) {
			res.send(req.decoded);
		});

	return apiRouter;
};