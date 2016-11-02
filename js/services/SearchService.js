angular.module($APP.name).factory('SearchService', [
    '$http', '$rootScope',
    function ($http, $rootScope) {
        return {
            get: function (category, input) {
                return $http.get($APP.server + '/api/searchds', {
                    params: {category: category, input: input},
                }).then(function (payload) {
                    return payload.data;
                });
            }
        };
    }
]);