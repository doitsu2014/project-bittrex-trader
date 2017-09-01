angular.module('homeCtrl', ['homeService'])
	.controller('HomeController', function($scope, $timeout, $location, HomeService) {
		var vm = this;
		var homeURL = $location.path();


		vm.updateMarkets = function () {
			HomeService.getMarkets(vm.marketType ||'USDT-').then(function(data) {
				vm.Markets = data;
			});
		}

		vm.getMarkets = function() {
			HomeService.getMarkets(vm.marketType ||'USDT-').then(function(data) {
				vm.Markets = data;
			});
			if($location.path() === homeURL) {
				$timeout(vm.getMarkets, 5000);
			}
		};
		$timeout(vm.getMarkets);
	});