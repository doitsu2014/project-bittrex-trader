angular.module('userApp', [
    'ngAnimate',
    'ngSanitize',
    'authService',
    'mainCtrl',
    'homeService',
    'homeCtrl',
    'tradeService',
    'tradeCtrl',
    'tradeVer2Ctrl',
    'app.routes'
  ])
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
  });