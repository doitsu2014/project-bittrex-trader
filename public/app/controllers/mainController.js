angular.module('mainCtrl', ['authService'])
    .controller('MainController', function ($scope, $location,$window, Auth) {
        var vm = this;
        $scope.$on('$routeChangeStart', function () {
            vm.loggedIn = Auth.isLoggedIn();
            Auth.getUser()
                .then(function (data) {
                    vm.user = data.data.bittrexKey;
                })
                .catch(error => console.log(`MainController.login---Error: {error.message}`));
        });
        vm.doLogin = function () {
            vm.error = '';
            Auth.login(vm.dataLogin.userKey, vm.dataLogin.userSecret)
                .then(function (data) {
                    if (data.data.success) {
                        $window.location.reload();
                        $location.path('/trading');
                    } else {
                        vm.error = data.data.message;
                    }
                })
                .catch(error => console.log(error))
        }

        vm.doLogout = function () {
            Auth.logout();
            vm.user = null;
            $window.location.reload();
            $location.path('/');
        };
        return vm;
    })