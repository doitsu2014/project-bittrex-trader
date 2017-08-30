angular.module('tradeCtrl', ['tradeService'])
	.controller('TradeController', function ($scope, $timeout, $q, TradeService) {
		var vm = this;

		vm._init(function () {
			return TradeService.getMarkets(vm.marketType ||'USDT-')
									.then(function(data) {
										vm.Markets = data;
										return data;
									});
		});

	})