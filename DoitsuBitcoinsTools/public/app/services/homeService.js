angular.module('homeService', [])
	.factory('HomeService', function($http, $q) {
		var homeFactory = {};

		homeFactory.getMarketNames = function() {
			return $http.get('/marketNames')
				.then(function (data) {
					console.log(data);
					return data;
				})
				.catch(error => console.log(`HomeService-getMarketName________ERROR: ${error}`));
		};
		
		return homeFactory;
	});