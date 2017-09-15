angular.module('authService', [])
    .factory('Auth', function ($http, $q, AuthToken) {
        var authFactory = {};
        authFactory.login = function (reqUserKey, reqUserSecret) {
            console.log(reqUserKey )
            return $http.post('/api/authenticate', {
                    "userKey": reqUserKey,
                    "userSecret": reqUserSecret
                })
                .then(function (data) {
                    AuthToken.setToken(data.data.token);
                    return data;
                })
                .catch(error => console.log(`Auth.login---Error:${error}`));
        }

        // handle logout
        authFactory.logout = () => {
            AuthToken.setToken();
        };
        // check if user is logged in
        authFactory.isLoggedIn = function () {
            if (AuthToken.getToken()) return true;
            else return false;
        };
        // get the user infor
        authFactory.getUser = function () {
            if (AuthToken.getToken()) {
                return $http.get(`api/me`, {
                    cache: true
                });
            } else {
                return $q.reject({
                    message: 'User has no token.'
                });
            }
        };

        // return factory
        return authFactory;
    })
    .factory('AuthToken', ($window) => {
        var authTokenFactory = {};

        // get the token
        authTokenFactory.getToken = function () {
            var token = $window.localStorage.getItem('token');
            return token;
        };

        // set the token or clear token
        authTokenFactory.setToken = function (token) {
            if (token) {
                $window.localStorage.setItem('token', token);
            } else {
                $window.localStorage.removeItem('token');
            }
        };
        return authTokenFactory;
    })
    .factory('AuthInterceptor', ($q, $location, AuthToken) => {
        var interceptorFactory = {};
        //attach the token to every request
        interceptorFactory.request = (config) => {
            // grab the token
            var token = AuthToken.getToken();
            //if the token is existed, add it to header as x-access-token
            if (token) {
                config.headers['x-access-token'] = token;
            }
            return config;
        };
        //redirect if a token doesn't authenticated
        interceptorFactory.responseError = (response) => {
            if (response.status === 403) {
                AuthToken.setToken();
                $location.path('/');
            }
            return $q.reject(response);
        };

        return interceptorFactory;
    });