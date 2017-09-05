angular.module('tradeCtrl', ['tradeService'])
	.constant('Constants', {
		TypeOfTrade: {
			buy: 1,
			sell: 2,
			doNothing: 3
		}
	})
	.controller('TradeController', function ($scope, $timeout, $interval, $location, TradeService, Constants) {
		var vm = this;
		var tradeUrl = $location.path();
		TradeService.getMarkets(vm.marketType || 'USDT-')
			.then(function (data) {
				vm.Markets = data;
				return data;
			});

		vm.getMarket = function () {
			TradeService.getMarket(vm.marketName || 'USDT-BTC')
				.then(function (data) {
					vm.currentMarket = data ? data[0] : null;
					if ($location.path() === tradeUrl) {
						$timeout(vm.getMarket, 500);
					}
				});
		};
		vm.getMarket();

		var buyLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			var reqQuantity = vm.autoData.autoLimitCoin1;
			// var typeOfCoin1 = vm.currentMarket.MarketName.split('-')[0];
			buyFunction(reqMarketName, reqQuantity);
		};

		var buyFunction = function (reqMarketName, reqQuantity) {
			console.log('Buy Function');
			// get list order book 
			TradeService.getOrdersBook(reqMarketName, 'buy')
				.then(function (data) {
					if (data) {
						analystBuyFunction(data.data.Orders, reqQuantity);
					}
				});
		};

		var analystBuyFunction = function (ordersBook, reqQuantity) {
			console.log('analyst buy function');
			// return list of Key, Value (quantity, rate)
			var baseQuantity = reqQuantity;
			var result = [];
			for (var i = 0; i < ordersBook.length; ++i) {
				var goodQuantity = Number.parseFloat(baseQuantity) / Number.parseFloat(ordersBook[i].Rate);
				if (goodQuantity > 0) {
					if (goodQuantity <= ordersBook[i].Quantity) {
						// buy all good quantity
						TradeService.buyLimit(vm.currentMarket.MarketName, goodQuantity, ordersBook[i].Rate)
							.then(function (data) {
									vm.tradeLog += `Buy: q_${goodQuantity} --- r_${ordersBook[i].Rate} --- m_${data.data.message}\n`;
							});
						baseQuantity -= Number.parseFloat(ordersBook[i].Rate) * goodQuantity;
						return;
					} else {
						// buy all order Quantity
						TradeService.buyLimit(vm.currentMarket.MarketName, ordersBook[i].Quantity, ordersBook[i].Rate)
							.then(function (data) {
								vm.tradeLog += `Buy: q_${ordersBook[i].Quantity} --- r_${ordersBook[i].Rate} --- m_${data.data.message}\n`;								
							});
						baseQuantity -= Number.parseFloat(ordersBook[i].Rate) * Number.parseFloat(ordersBook[i].Quantity);
					}
				}
			}
		};

		var sellLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			var reqQuantity = vm.autoData.autoLimitCoin2;
			// var typeOfCoin1 = vm.currentMarket.MarketName.split('-')[0];
			sellFunction(reqMarketName, reqQuantity);
		};

		var sellFunction = function (reqMarketName, reqQuantity) {
			console.log('Sell Function');
			// get list order book 
			TradeService.getOrdersBook(reqMarketName, 'sell')
				.then(function (data) {
					if (data) {
						analystSellFunction(data.data.Orders, reqQuantity);
					}
				});
		};

		var analystSellFunction = function (ordersBook, reqQuantity) {
			console.log('analyst sell function');
			// return list of Key, Value (quantity, rate)
			var baseQuantity = reqQuantity;
			var result = [];
			for (var i = 0; i < ordersBook.length; ++i) {
				var goodQuantity = baseQuantity;
				if (goodQuantity > 0) {
					if (goodQuantity <= ordersBook[i].Quantity) {
						// buy all good quantity

						TradeService.sellLimit( vm.currentMarket.MarketName, goodQuantity, ordersBook[i].Rate)
							.then(function (data) {
								vm.tradeLog += `Sell: q_${goodQuantity} --- r_${ordersBook[i].Rate} --- m_${data.data.message}\n`;								
							});
						baseQuantity -= goodQuantity;
						return;
					} else {
						// buy all order Quantity
						TradeService.sellLimit( vm.currentMarket.MarketName, ordersBook[i].Quantity, ordersBook[i].Rate)
							.then(function (data) {
								vm.tradeLog += `Sell: q_${ordersBook[i].Quantity} --- r_${ordersBook[i].Rate} --- m_${data.data.message}\n`;								
							});
						baseQuantity -= Number.parseFloat(ordersBook[i].Quantity);
					}
				}
			}
		};

		vm.isConfirm = false;
		vm.isStartAutos = false;
		vm.setupAutoTrade = function () {
			vm.dangerFormAuto = validateFormAuto();
			if (!vm.dangerFormAuto) {
				alert(`
				-- Market Name: ${vm.marketName} 
				-- Amount: ${vm.autoData.amount} 
				-- Base Price Time ${vm.autoData.basePriceTime} 
				-- T-Buy ${vm.autoData.autoTBuy} 
				-- T-Sell ${vm.autoData.autoTSell}
				`);

				vm.isConfirm = true;
			}
		};

		vm.stopAutos = function () {
			if (vm.isConfirm) {
				if (vm.isStartAutos) {
					vm.isStartAutos = false;
					vm.isConfirm = false;
				}
			}
		};

		vm.startAutos = function () {
			vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
			vm.autoData.basePriceTimeDelay = conTimeToTimeStamp(vm.autoData.basePriceTime);
			vm.autoData.autoPrice = vm.currentMarket.Bid;
			vm.autoData.autoBasePrice = vm.currentMarket.Bid;
			vm.isStartAutos = true;
			autoBasePrice();
			autoTrade();
		};

		vm.tradeLog = "";
		var autoTrade = () => {
			if (vm.isConfirm) {
				if (vm.isStartAutos) {
					if (vm.autoData.autoTradeTimeDelay != 0) {
						vm.autoData.autoTradeTimeDelay -= 1;
					} else {
						vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
						var typeOfTrade = checkConditions();
						if (typeOfTrade === Constants.TypeOfTrade.buy) {
							buyLimit();
						} else if (typeOfTrade === Constants.TypeOfTrade.sell) {
							sellLimit();							
						} else {
							vm.tradeLog += "Do nothing\n";
						}
					}
					$timeout(autoTrade, 1000);
				}
			}
		};

		// this function will return type of trade
		var checkConditions = function () {
			var x = vm.autoData.autoPrice - vm.autoData.autoBasePrice;
			if (x > 0) {
				if (x > vm.autoData.autoTBuy) {
					return Constants.TypeOfTrade.buy;
				} else {
					return Constants.TypeOfTrade.doNothing;
				}
			} else {
				if (x <= vm.autoData.autoTSell) {
					return Constants.TypeOfTrade.sell;
				} else {
					return Constants.TypeOfTrade.doNothing;
				}
			}
		}

		var autoBasePrice = () => {
			if (vm.isConfirm) {
				if (vm.isStartAutos) {
					if (vm.autoData.basePriceTimeDelay != 0) {
						vm.autoData.basePriceTimeDelay -= 1;
						vm.autoData.autoPrice = vm.currentMarket.Bid;
					} else {
						vm.autoData.autoPrice = vm.currentMarket.Bid;
						vm.autoData.autoBasePrice = vm.currentMarket.Bid;
						vm.autoData.basePriceTimeDelay = conTimeToTimeStamp(vm.autoData.basePriceTime);
					}
					$timeout(autoBasePrice, 1000);
				}
			}
		}

		var serviceGetMarket = () => {
			TradeService.getMarket(vm.marketName || 'USDT-BTC')
				.then(function (data) {
					vm.currentMarket = data ? data[0] : null;
				});
		}

		var validateFormAuto = () => {
			var basePriceTimeRegExp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;
			var tradeTimeRegExp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;
			var result = "";
			result += basePriceTimeRegExp.test(vm.autoData.basePriceTime) ? "" : "Base Price Time is not valid--";
			result += tradeTimeRegExp.test(vm.autoData.autoTradeTime) ? "" : "Trade Time is not valid";
			return result;
		};

		var conTimeToTimeStamp = (basicTime) => {
			var elements = basicTime.split(":");
			var result = parseInt(elements[0] * 3600) + parseInt(elements[1] * 60) + parseInt(elements[2]);
			return result;
		};
	});