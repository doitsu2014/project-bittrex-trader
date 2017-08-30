angular.module('app.routes', ['ngRoute'])
  .config(($routeProvider, $locationProvider) => {
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/pages/home.html',
        controller: 'HomeController',
        controllerAs: 'home'
      })
      .when('/trading', {
      	templateUrl: 'app/views/pages/trading/trading.html',
      	controller: 'TradeController',
      	controllerAs: 'trade'
      })
    $locationProvider.html5Mode(true);
  })
;