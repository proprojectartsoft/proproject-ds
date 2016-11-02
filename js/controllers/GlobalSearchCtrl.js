angular.module($APP.name).controller('GlobalSearchCtrl', [
    'SweetAlert',
    '$scope',
    '$stateParams',   
    '$state',
    'DefectsService',
    'DrawingsService',
    function (SweetAlert, $scope, $stateParams,  $state, DefectsService, DrawingsService) {
        $scope.user = {};
        $scope.user.email = $stateParams.email;
        $scope.enterSearch = function (event) {
            if (event.keyCode === 13) {
                $scope.submitComment();
            }
        };
    }
]);
