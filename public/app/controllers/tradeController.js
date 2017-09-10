angular.module('tradeCtrl', ['tradeService'])
	.constant('Constants', {
		TypeOfTrade: {
			buy: 1,
			sell: 2,
			doNothing: 3
		}
	})
	.controller('TradeController', function ($scope, $timeout, $interval, $location,$q, TradeService, Constants) {
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

		
		vm.getBalance = () => {
			var reqCurrency = vm.currentMarket? vm.currentMarket.MarketName.split('-')[1] : "BTC";
			return $q((resolve, reject) => {
				TradeService.getBalance(reqCurrency)
					.then(data => {
						resolve(data.data.balance);
					});
			}); 
		};
		
		vm.isConfirm = false;
		vm.isStartAutos = false;
		vm.setupAutoTrade = function () {
			vm.dangerFormAuto = validateFormAuto();
			if (!vm.dangerFormAuto) {
				alert(`
				-- Market Name: ${vm.currentMarket.MarketName} 
				-- Limit Coin 1: ${vm.autoData.autoLimitCoin1} 
				-- Limit Coin 2: ${vm.autoData.autoLimitCoin1} 
				-- Base Price Time ${vm.autoData.basePriceTime} 
				-- T-Buy ${vm.autoData.autoTBuy} 
				-- T-Sell ${vm.autoData.autoTSell}
				`);

				vm.isConfirm = true;
			}
		};

		vm.stopAutos = function () {
			if (vm.isConfirm) {
					vm.isStartAutos = false;
					vm.isConfirm = false;
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
						$timeout(autoTrade, 1000);						
					} else {
						vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
						// check temp balance
						var x = vm.autoData.autoLimitCoin2 - vm.autoData.autoTempBalance;
						var typeOfTrade;
						if (x > 0) {
							// check buy and sell 
							typeOfTrade = checkConditions();						
							if (typeOfTrade === Constants.TypeOfTrade.buy) {
								// after buyLimit will setTimeout
								buyLimit();
							} else if (typeOfTrade === Constants.TypeOfTrade.sell) {
								// after sellLimit will setTimeout
								sellLimit();
							} else {
								// otherwise
								$timeout(autoTrade, 1000);
							}
						} else {
							typeOfTrade = checkConditions();
							if (typeOfTrade === Constants.TypeOfTrade.sell) {
								// after sellLimit will setTimeout								
								sellLimit();
							} else {
								$timeout(autoTrade, 1000);
							}
						}

						// var typeOfTrade = checkConditions();
						// if (typeOfTrade === Constants.TypeOfTrade.buy) {
						// 	buyLimit();
						// } else if (typeOfTrade === Constants.TypeOfTrade.sell) {
						// 	sellLimit();
						// } else {
						// 	$timeout(autoTrade, 1000);
						// }
					}
			
				}
			}
		};

		
		var buyLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			var reqQuantity = vm.autoData.autoLimitCoin2;
			TradeService.buyLimit2(reqMarketName,reqQuantity)
				.then(function (data) {
					vm.autoData.autoTempBalance += data.data.totalSuccess;
					vm.tradeLog += data.data.message;
					$timeout(autoTrade, 1000);
				});
		};

		vm._testSellLimit = function () {
			sellLimit();
		}
		var sellLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			vm.getBalance()
				.then((data) => {
					var reqQuantity = data.Available;
					TradeService.sellLimit2(reqMarketName, reqQuantity)
						.then(function (data) {
							vm.autoData.autoTempBalance -= data.data.totalSuccess;
							vm.tradeLog += data.data.message;
							$timeout(autoTrade, 1000);
						});
				});
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