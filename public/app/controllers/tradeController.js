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
					vm.currentMarket = data ? data[0] : null;
					if ($location.path() === tradeUrl) {
						$timeout(vm.getMarket, 500);
					}
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
					}
				}
			}
		};

		var buyLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			var reqQuantity = vm.autoData.autoLimitCoin2 - vm.autoData.autoTempBalance;
			TradeService.buyLimit2(reqMarketName, reqQuantity)
				.then(function (data) {
					vm.autoData.autoTempBalance += data.data.totalSuccess;
					vm.tradeLog += data.data.message;
					$timeout(autoTrade, 1000);
				});
		};

		var sellLimit = function () {
			var reqMarketName = vm.currentMarket.MarketName;
			vm.getBalance()
				.then((data) => {
					var reqQuantity = data.Available;
					TradeService.sellLimit2(reqMarketName, reqQuantity)
						.then(function (data) {
							vm.autoData.autoTempBalance -= data.data.totalSuccess;
							if(vm.autoData.autoTempBalance < 0) {
								vm.autoData.autoTempBalance = 0;
							}
							vm.tradeLog += data.data.message;
							$timeout(autoTrade, 1000);
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
					if (vm.autoData.basePriceTimeDelay != 0) {
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
			result += basePriceTimeRegExp.test(vm.autoData.basePriceTime) ? "" : "Base Price Time is not valid<br/>";
			result += tradeTimeRegExp.test(vm.autoData.autoTradeTime) ? "" : "Trade Time is not valid<br/>";
			result += Number.parseFloat(vm.autoData.autoTBuy) != 0 ? "" : "T-Buy should not 0<br/>";
			result += Number.parseFloat(vm.autoData.autoTSell) != 0 ? "" : "T-Sell should not 0<br/>";
			result += Number.parseFloat(vm.autoData.autoTempBalance) > 0 ? "" : "Temp Balance should not bigger than 0<br/>";
			return result;
		};

		var conTimeToTimeStamp = (basicTime) => {
			var elements = basicTime.split(":");
			var result = parseInt(elements[0] * 3600) + parseInt(elements[1] * 60) + parseInt(elements[2]);
			return result;
		};


		vm.showLogsPopup = () => {
			var popup = angular.element( document.querySelector( '.cd-tradelogs-popup' ) );
			popup.addClass('is-visible');
		}

		vm.stopLogsPopup = () => {
			var popup = angular.element( document.querySelector( '.cd-tradelogs-popup' ) );
			popup.removeClass('is-visible');
		}
	});