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
		
		return tradeFactory;
	});