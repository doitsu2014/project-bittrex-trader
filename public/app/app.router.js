angular.module('app.routes', ['ngRoute'])
  .config(($routeProvider, $locationProvider) => {
    $routeProvider
      .when('/', {
        templateUrl: 'app/views/pages/home.html',
        controller: 'HomeController',
        controllerAs: 'home'
      })

    $locationProvider.html5Mode(true);
  })
;