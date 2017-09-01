angular.module('app.routes', ['ngRoute'])
  .config(($routeProvider, $locationProvider) => {
    $routeProvider
      .when('/login', {
        templateUrl: 'app/views/pages/login.html',
        controller: 'MainController',
        controllerAs: 'login'
      })
      .when('/', {
        templateUrl: 'app/views/pages/home/home.html',
        controller: 'HomeController',
        controllerAs: 'home'
      })
      .when('/aboutme', {
        templateUrl: 'app/views/pages/home/aboutme.html',
        controller: 'MainController',
        controllerAs: 'aboutme'
      })
      .when('/trading', {
        templateUrl: 'app/views/pages/trading/trading.html',
        controller: 'TradeController',
        controllerAs: 'trade'
      })

    $locationProvider.html5Mode(true);
  });