angular.module('tradeService', [])
	.factory('TradeService', function($http, $q) {
		var tradeFactory = {};
		
		tradeFactory.getMarkets = function(reqMarketType) {
			return $http.post('api/marketsummaries', {marketType: reqMarketType})
				.then(function (response) {
					return response.data.markets;
				})
				.catch(error => console.log(`Trade Service-getMarkets________ERROR: ${error}`));
		};
		
		tradeFactory.getMarket = function(reqMarketName) {
			return $http.post('api/marketsummary', {marketName: reqMarketName})
				.then(function (response) {
					return response.data.market;
				})
				.catch(error => console.log(`Trade Service-getMarket________ERROR: ${error}`));
		};

		tradeFactory.buyLimit = function (reqMarketName, reqQuantity, reqRate) {
			return $http.post('api/markets/buylimit2', 
				{   
					reqMarketName: reqMarketName,
					reqQuantity: reqQuantity,
					reqRate: reqRate
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-buyLimit-ERROR:`); console.log(error)});
		};

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
				.catch(error => {console.log(`Trade Service-sellLimit-ERROR:`); console.log(error)});
		};

		tradeFactory.buyLimit2 = function (reqMarketName, reqQuantity) {
			return $http.post('api/markets/buylimit2', 
				{   
					reqMarketName: reqMarketName,
					reqQuantity: reqQuantity,
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-buyLimit-ERROR:`); console.log(error)});
		};

		tradeFactory.sellLimit2 = function (reqMarketName, reqQuantity) {
			return $http.post('api/markets/selllimit2', 
				{
					reqMarketName: reqMarketName,
					reqQuantity: reqQuantity
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-sellLimit-ERROR:`); console.log(error)});
		};

		tradeFactory.getBalance = function (reqCurrency) {
			console.log("Trade Service Get Order");
			return $http.post('api/user/getbalance', 
				{   
					reqCurrency: reqCurrency
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-Get Order-ERROR:`); console.log(error)});
		};

		tradeFactory.getOrdersBook = function (reqMarketName, reqType) {
			console.log("Trade Service Get Order");
			return $http.post('api/markets/getordersbook', 
				{   
					reqMarketName: reqMarketName,
					reqType: reqType
				})
				.then(function (response) {
					return response;
				})
				.catch(error => {console.log(`Trade Service-Get Order-ERROR:`); console.log(error)});
		};

		return tradeFactory;
	});