angular.module('homeCtrl', ['homeService'])
	.controller('HomeController', function($scope, $timeout, HomeService) {
		var vm = this;

		vm.updateMarkets = function () {
			HomeService.getMarkets(vm.marketType ||'USDT-').then(function(data) {
				vm.Markets = data;
			});
		}

		vm.getMarkets = function() {
			HomeService.getMarkets(vm.marketType ||'USDT-').then(function(data) {
				vm.Markets = data;
			});
			$timeout(vm.getMarkets, 5000);
		};
		$timeout(vm.getMarkets);
	});