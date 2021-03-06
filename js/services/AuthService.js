dsApp.factory('AuthService', [
    '$http',
    function($http) {
        return {
            forgotpassword_submit: function(email, password) {
                return $http.put($APP.server + '/pub/forgetpassword', '', {
                    params: {
                        'email': email,
                        'password': password
                    }
                }).then(function(payload) {
                    return payload.data;
                });
            },
            forgotpassword: function(email, thisBoolean) {
                var url = $APP.server + '/pub/forgetpassword?email=' + email + '&ds=' + thisBoolean;
                return $http.post(url).then(function(payload) {
                    return payload.data;
                });
            },
            login: function(user) {
                return $http({
                    method: 'POST',
                    url: $APP.server + '/pub/login',
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json;odata=verbose'
                    },
                    transformRequest: function(obj) {
                        return 'login.user.name=' + user.username + '&login.user.password=' + user.password + '&user=true' + '&login.user.gmt=' + user.gmt;
                    },
                    data: user
                }).success(function(data) {
                    sessionStorage.setObject('isLoggedIn', true);
                }).error(function errorCallback(response, status) {})
            },
            logout: function() {
                return $http.post($APP.server + '/pub/logout', {
                    withCredentials: true
                }).then(function(result) {
                    sessionStorage.removeItem('isLoggedIn');
                    return result;
                });
            }
        };
    }
]);
