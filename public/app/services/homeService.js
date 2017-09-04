angular.module('homeService', [])
	.factory('HomeService', function($http, $q) {
		var homeFactory = {};
		
		homeFactory.getMarkets = function(reqMarketType) {
			return $http.post('api/marketsummaries', {marketType: reqMarketType})
				.then(function (response) {
					return response.data.markets;
				})
				.catch(error => console.log(`HomeService-getMarketName________ERROR: ${error}`));
		};
		
		return homeFactory;
	});