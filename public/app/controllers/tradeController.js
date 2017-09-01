angular.module('tradeCtrl', ['tradeService'])
	.controller('TradeController', function ($scope, $timeout, $location, TradeService) {
		var vm = this;

		TradeService.getMarkets(vm.marketType ||'USDT-')
			.then(function(data) {
				vm.Markets = data;
				return data;
		});

		vm.buyLimit = function () {
			TradeService.buyLimit(vm.marketName, vm.quantity, vm.rate)
				.then(function (data) {
					if (!data.data.success) {
						vm.warning = data.data.message;
					} else {
						vm.warning = false;
					}
					$location.path('/trading');
					return data;
				})

		};

		vm.sellLimit = function () {
			TradeService.sellLimit(vm.marketName, vm.quantity, vm.rate)
				.then(function (data) {
					if (!data.data.success) {
						vm.warning = data.data.message;
					} else {
						vm.warning = false;
					}
					$location.path('/trading');
					return data;
				})
		};

	})