angular.module('tradeCtrl', ['tradeService'])
	.constant('Constants', {
		TypeOfTrade: {
			buy: 1,
			sell: 2,
			doNothing: 3
		}
	})
	.controller('TradeController', function ($scope, $timeout, $interval, $location, $q, TradeService, Constants) {
		var vm = this;
		var tradeUrl = $location.path();

		(() => {
			TradeService.getBalance("USDT");
		})();

		TradeService.getMarkets(vm.marketType || 'USDT-')
			.then(function (data) {
				vm.Markets = data;
				return data;
			});

		vm.getMarket = function () {
			TradeService.getMarket(vm.marketName || 'USDT-BTC')
				.then(function (data) {
					try {
						vm.currentMarket = data ? data[0] : null;
						if ($location.path() === tradeUrl) {
							$timeout(vm.getMarket, 500);
						}
					} catch (err) {
						console.log(err);
						$timeout(vm.getMarket, 500);
					}

				}).catch(function (err) {
					console.log(err);
					$timeout(vm.getMarket, 500);
				});
		};
		vm.getMarket();


		vm.getBalance = () => {
			// get balance for sell method so you need the name of the left side
			var reqCurrency = vm.currentMarket ? vm.currentMarket.MarketName.split('-')[1] : "BTC";


			return $q((resolve, reject) => {
				TradeService.getBalance(reqCurrency)
					.then(data => {
						resolve(data.data.balance);
					});
			});
		};

		vm.isConfirm = false;
		vm.isStartAutos = false;
		vm.confirmMess = "";
		vm.countConfirm = 0;
		vm.setupAutoTrade = function () {
			vm.dangerFormAuto = validateFormAuto();
			if (!vm.dangerFormAuto) {
				var limitCoin2 = vm.currentMarket ? vm.currentMarket.MarketName.split('-')[0] : "USDT";

				// remove danger div if success confirm
				vm.dangerFormAuto = null;

				// update price informations
				vm.autoData.autoPriceBid = vm.currentMarket.Bid;
				vm.autoData.autoPriceAsk = vm.currentMarket.Ask;
				vm.autoData.autoBasePriceBid = vm.currentMarket.Bid;
				vm.autoData.autoBasePriceAsk = vm.currentMarket.Ask;

				// create success div if success confirm
				vm.confirmMess += `Market Name: ${vm.currentMarket.MarketName}<br/>Limit ${limitCoin2}: ${vm.autoData.autoLimitCoin2}<br/>Price Bid: ${vm.autoData.autoPriceBid}<br/>Base Price Bid: ${vm.autoData.autoBasePriceBid}<br/>Price Ask: ${vm.autoData.autoPriceAsk}<br/>Base Price Ask: ${vm.autoData.autoBasePriceAsk}<br/>T-Buy ${vm.autoData.autoTBuy}<br/>T-Sell ${vm.autoData.autoTSell}`;


				++vm.countConfirm;
				vm.isConfirm = true;
			}
		};

		vm.stopAutos = function () {
			if (vm.isConfirm) {
				vm.isStartAutos = false;
				vm.autoData.autoTempBalance = 0;
				vm.autoData.autoLimitCoin2 = 0;
				vm.confirmMess += "<br/><br/>Finished! Good luck!<br/><br/>";
				if (vm.countConfirm >= 5) {
					--vm.countConfirm;
					var indexOfCleanCFM = vm.confirmMess.indexOf("<br/><br/>Finished! Good luck!<br/><br/>", 4);
					var lastIndexOfClean = vm.confirmMess.length;
					vm.confirmMess = vm.confirmMess.slice(indexOfCleanCFM, lastIndexOfClean);
				}
				vm.isConfirm = false;
			}
		};

		vm.startAutos = function () {
			vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
			vm.autoData.basePriceTimeDelay = conTimeToTimeStamp(vm.autoData.basePriceTime);
			vm.autoData.autoPriceBid = vm.currentMarket.Bid;
			vm.autoData.autoPriceAsk = vm.currentMarket.Ask;
			vm.autoData.autoBasePriceBid = vm.currentMarket.Bid;
			vm.autoData.autoBasePriceAsk = vm.currentMarket.Ask;
			vm.isStartAutos = true;
			autoBasePrice();
			autoTrade();
		};

		vm.tradeLog = "";
		var autoTrade = () => {
			if (vm.isConfirm) {
				if (vm.isStartAutos) {
					try {
						if (vm.autoData.autoTradeTimeDelay != 0) {
							vm.autoData.autoTradeTimeDelay -= 1;
							$timeout(autoTrade, 1000);
						} else {
							vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
							// check temp balance
							var x = vm.autoData.autoLimitCoin2 - vm.autoData.autoTempBalance;
							var typeOfTrade, buyResult, sellResult;
							if (x > 0) {
								// check buy and sell 
								typeOfTrade = checkConditions();
								if (typeOfTrade === Constants.TypeOfTrade.buy && !vm.isDelayAfterSell) {
									// after buyLimit will setTimeout
									buyResult = buyLimit();
								} else if (typeOfTrade === Constants.TypeOfTrade.sell && !vm.isDelayAfterBuy) {
									// after sellLimit will setTimeout
									sellResult = sellLimit();
								} else {
									// otherwise
									$timeout(autoTrade, 1000);
								}
							} else {
								typeOfTrade = checkConditions();
								if (typeOfTrade === Constants.TypeOfTrade.sell && !vm.isDelayAfterBuy) {
									// after sellLimit will setTimeout								
									sellResult = sellLimit();
								} else {
									$timeout(autoTrade, 1000);
								}
							}
						}
					} catch (err) {
						console.log(`TradeController-AutoTrade: Error (${err})\n`);
						vm.autoData.autoTradeTimeDelay = conTimeToTimeStamp(vm.autoData.autoTradeTime);
						$timeout(autoTrade, 1000);
					}
				}
			}
		};

		var buyLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			var reqQuantity = vm.autoData.autoLimitCoin2 - vm.autoData.autoTempBalance;
			TradeService.buyLimit2(reqMarketName, reqQuantity)
				.then(function (data) {
					try {
						vm.autoData.autoTempBalance += data.data.totalSuccess;
						
						if (!vm.isDelayAfterBuy) {
							vm.autoData.autoAfterBuyTimeDelay = conTimeToTimeStamp(vm.autoData.autoAfterBuyTime);
							vm.isDelayAfterBuy=true;
							autoDelayAfterBuy();
						}
						
						vm.tradeLog += data.data.message;
						$timeout(autoTrade, 1000);
						return true;
					} catch (err) {
						console.log(`TradeController-BuyLimit: Error (${err})\n`);
						$timeout(autoTrade, 1000);
						return false;
					}
				}).catch(function (err) {
					console.log(`TradeController-BuyLimit: Error (${err})\n`);
					$timeout(autoTrade, 1000);
					return false;
				});
		};

		var sellLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			vm.getBalance()
				.then((data) => {
					var reqQuantity = data.Available;
					TradeService.sellLimit2(reqMarketName, reqQuantity)
						.then(function (data) {
							try {
								
								// Delay buy after you sell and your balance must be not 0
								if (reqQuantity > 0) {
									vm.autoData.autoTempBalance -= data.data.totalSuccess;
									if (vm.autoData.autoTempBalance < 0) {
										vm.autoData.autoTempBalance = 0;
									}
									if (data.data.success) {
										vm.autoData.autoAfterSellTimeDelay = conTimeToTimeStamp(vm.autoData.autoAfterSellTime);
										vm.isDelayAfterSell=true;
										autoDelayAfterSell();
									}
									vm.tradeLog += data.data.message;
								}

								$timeout(autoTrade, 1000);
								return true;
							} catch (err) {
								console.log(`TradeController-SellLimit: Error (${err})\n`);
								$timeout(autoTrade, 1000);
								return false;
							}
						}).catch(function (err) {
							console.log(`TradeController-SellLimit: Error (${err})\n`);
							$timeout(autoTrade, 1000);
							return false;
						});
				});
		};
		
		// this function will return type of trade
		var checkConditions = function () {
			var x = vm.autoData.autoPriceBid - vm.autoData.autoBasePriceBid;
			var y = vm.autoData.autoPriceAsk - vm.autoData.autoBasePriceAsk;
			if (y < 0) {
				if (y <= vm.autoData.autoTSell) {
					return Constants.TypeOfTrade.sell;
				}
			} else if (x > 0) {
				if (x > vm.autoData.autoTBuy) {
					return Constants.TypeOfTrade.buy;
				}
			} else {
				return Constants.TypeOfTrade.doNothing;
			}
		};

		var autoBasePrice = () => {
			if (vm.isConfirm) {
				if (vm.isStartAutos) {
					try {
						if (vm.autoData.basePriceTimeDelay > 0) {
							vm.autoData.basePriceTimeDelay -= 1;
							vm.autoData.autoPriceBid = vm.currentMarket.Bid;
							vm.autoData.autoPriceAsk = vm.currentMarket.Ask;
						} else {
							vm.autoData.autoPriceBid = vm.currentMarket.Bid;
							vm.autoData.autoPriceAsk = vm.currentMarket.Ask;
							vm.autoData.autoBasePriceBid = vm.currentMarket.Bid;
							vm.autoData.autoBasePriceAsk = vm.currentMarket.Ask;
							vm.autoData.basePriceTimeDelay = conTimeToTimeStamp(vm.autoData.basePriceTime);
						}
						$timeout(autoBasePrice, 1000);
					} catch (err) {
						console.log(`TradeController-AutoBasePrice: ${err}\n`);
						vm.autoData.basePriceTimeDelay -= 1;
						vm.autoData.basePriceTimeDelay = conTimeToTimeStamp(vm.autoData.basePriceTime);
						$timeout(autoBasePrice, 1000);
					}
				}
			}
		};

		vm.isDelayAfterSell = false;
		var autoDelayAfterSell = () => {
			if (vm.isConfirm) {
				if (vm.isDelayAfterSell) {
					try {
						if (vm.autoData.autoAfterSellTimeDelay > 0) {
							vm.autoData.autoAfterSellTimeDelay -= 1;
							$timeout(autoDelayAfterSell, 1000);
						} else {
							vm.isDelayAfterSell = false;
						}
					} catch (err) {
						console.log(`TradeController-AutoDelayAfterSell: ${err}\n`);
						vm.autoData.autoAfterSellTimeDelay = 0;
						vm.isDelayAfterSell = false;						
						$timeout(autoDelayAfterSell, 1000);
					}
				}
			}
		};

		vm.isDelayAfterBuy = false;
		var autoDelayAfterBuy = () => {
			if (vm.isConfirm) {
				if (vm.isDelayAfterBuy) {
					try {
						if (vm.autoData.autoAfterBuyTimeDelay > 0) {
							vm.autoData.autoAfterBuyTimeDelay -= 1;
							$timeout(autoDelayAfterBuy, 1000);
						} else {
							vm.isDelayAfterBuy = false;
						}
					} catch (err) {
						console.log(`TradeController-AutoDelayAfterBuy: ${err}\n`);
						vm.autoData.autoAfterBuyTimeDelay = 0;
						vm.isDelayAfterBuy = false;						
						$timeout(autoDelayAfterBuy, 1000);
					}
				}
			}
		};

		var serviceGetMarket = () => {
			TradeService.getMarket(vm.marketName || 'USDT-BTC')
				.then(function (data) {
					vm.currentMarket = data ? data[0] : null;
				});
		};

		var validateFormAuto = () => {
			var basePriceTimeRegExp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;
			var tradeTimeRegExp = /^[0-9]{2}:[0-9]{2}:[0-9]{2}$/;
			var result = "";
			result += basePriceTimeRegExp.test(vm.autoData.autoAfterSellTime) ? "" : "After Sell Delay is not valid<br/>";
			result += basePriceTimeRegExp.test(vm.autoData.autoAfterBuyTime) ? "" : "After Buy Delay is not valid<br/>";
			result += basePriceTimeRegExp.test(vm.autoData.basePriceTime) ? "" : "Base Price Time is not valid<br/>";
			result += tradeTimeRegExp.test(vm.autoData.autoTradeTime) ? "" : "Trade Time is not valid<br/>";
			result += Number.parseFloat(vm.autoData.autoTBuy) != 0 ? "" : "T-Buy should not 0<br/>";
			result += Number.parseFloat(vm.autoData.autoTSell) != 0 ? "" : "T-Sell should not 0<br/>";
			result += Number.parseFloat(vm.autoData.autoLimitCoin2) > 0 ? "" : "Limit Balance should bigger than 0<br/>";
			
			return result;
		};

		var conTimeToTimeStamp = (basicTime) => {
			try {
				var elements = basicTime.split(":");
				var result = parseInt(elements[0] * 3600) + parseInt(elements[1] * 60) + parseInt(elements[2]);
				return result;
			} catch (err) {
				console.log(`TradeController-conTimeToTimeStamp: ${err}`);
				return 5;
			}
		};

		vm.showLogsPopup = () => {
			var popup = angular.element(document.querySelector('.cd-tradelogs-popup'));
			popup.addClass('is-visible');
		};

		vm.stopLogsPopup = () => {
			var popup = angular.element(document.querySelector('.cd-tradelogs-popup'));
			popup.removeClass('is-visible');
		};
	});