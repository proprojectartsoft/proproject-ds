angular.module($APP.name).factory('ProjectService', [
    '$http',
    '$rootScope',
    function ($http, $rootScope) {
        return {
            list: function () {
                return $http.get($APP.server + 'api/project/defects', {}).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            users: function (customerId) {                
                return $http.get($APP.server + 'api/user/ds', {
                    params: {projectId: customerId}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            get: function (customerId, projectId) {
                return $http.get($APP.server + '/api/project', {
                    params: {customerId: customerId, projectId: projectId},
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            create: function (dataIn) {
                return $http({
                    method: 'POST',
                    url: $APP.server + '/api/project',
                    data: dataIn
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            }
        };
    }
]);