angular.module('homeCtrl', ['homeService'])
	.controller('HomeController', function(HomeService) {
		var vm = this;
		HomeService.getMarketNames().then(function (data) {
			vm.MarketNames = data;
		});
	});