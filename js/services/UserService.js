angular.module($APP.name).service('UserService', [
    '$http',
    '$rootScope',
    '$location',
    'SweetAlert',
    function ($http, $rootScope, $location, SweetAlert) {
        return {
            update: function (dataIn) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/user',
                    data: dataIn
                }).then(function (response) {
                    return response;
                });
            },
            update_free: function (dataIn) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/user/share',
                    data: dataIn
                }).then(function (response) {
                    return response;
                });
            },
            create: function (dataIn) {
                dataIn.active = true;
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/user',
                    data: dataIn
                }).then(function (response) {
//                    if (response == -1) {
//                        SweetAlert.swal("Error!", "User already exist.", "error");
//                    }
                    return response.data;
                });
            },
            signUp: function (dataIn) {
                dataIn.customer_id = parseInt(dataIn.customer_id)
                return $http({
                    method: 'POST',
                    url: $APP.server + '/pub/signup',
                    data: dataIn
                }).success(function (response) {
                    return response
                }).error(function (response, status) {
                    return status
                });
            },
            list: function () {
                return $http.get($APP.server + '/api/user').then(
                        function (payload) {
                            return payload.data;
                        });
            },
            get: function (id) {
                return $http.get($APP.server + '/api/user', {
                    params: {id: id},
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            list_customer: function (customer_id) {
                return $http.get($APP.server + '/api/user/company', {
                    params: {customer_id: customer_id},
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            list_impersonate: function () {
                return $http.get($APP.server + '/api/user/list').then(
                        function (payload) {
                            return payload.data;
                        }
                );
            }


        };
    }
]);