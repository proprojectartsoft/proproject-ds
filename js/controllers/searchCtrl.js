angular.module($APP.name).controller('AppCtrl', [
    '$rootScope', '$scope', 'AuthService', '$state', 'ProjectService', 'CacheFactory',
    function ($rootScope, $scope, AuthService, $state, ProjectService, CacheFactory) {
        $rootScope.searchText= '';
        
    }
]);