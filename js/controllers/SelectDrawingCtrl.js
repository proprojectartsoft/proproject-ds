angular.module($APP.name).controller('SelectDrawingCtrl', [
    '$rootScope', '$scope', 'NgTableParams',
    function ($rootScope, $scope, NgTableParams) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.drawings = $scope.$title;

        $scope.selectThis = function (item) {
            angular.forEach($scope.drawings, function (drw) {
                drw.selected = false;
            });
            item.selected = !item.selected;
        }

    }
]);