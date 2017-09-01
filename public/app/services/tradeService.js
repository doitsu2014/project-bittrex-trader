angular.module('tradeService', [])
	.factory('TradeService', function($http, $q) {
		var tradeFactory = {};
		
		tradeFactory.getMarkets = function(reqMarketType) {
			return $http.post('api/markets', {marketType: reqMarketType})
				.then(function (response) {
					return response.data.markets;
				})
				.catch(error => console.log(`Trade Service-getMarketName________ERROR: ${error}`));
		};
		
		tradeFactory.buyLimit = function (reqMarketName, reqQuantity, reqRate) {
			return $http.post('api/markets/buylimit', 
				{   
					reqMarketName: reqMarketName,
					reqQuantity: reqQuantity,
					reqRate: reqRate
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-getMarketName-ERROR:`); console.log(error)});
		}

		tradeFactory.sellLimit = function (reqMarketName, reqQuantity, reqRate) {
			return $http.post('api/markets/selllimit', 
				{   
					reqMarketName: reqMarketName,
					reqQuantity: reqQuantity,
					reqRate: reqRate
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-getMarketName-ERROR:`); console.log(error)});
		}

		return tradeFactory;
	});