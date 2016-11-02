angular.module($APP.name).controller('_EditDrawingCtrl', [
    '$rootScope', '$scope', 'DrawingsService',
    function ($rootScope, $scope, DrawingsService) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.filter = {};

//        $scope.drawing = angular.copy($rootScope.editDrawing);
        DrawingsService.get($rootScope.editDrawing.id).then(function (result) {
            $scope.drawing = result;
            if ($scope.drawing.drawing_date) {
                $scope.drawing.date_obj = new Date($scope.drawing.drawing_date);
            }
        })


        $scope.update = function () {
            var aux = angular.copy($scope.drawing);
            if (aux.date_obj) {
                aux.drawing_date = aux.date_obj.getTime();
            }
            DrawingsService.update(aux).then(function (result) {
                $rootScope.editDrawing.title = $scope.drawing.title;
                $rootScope.editDrawing.code = $scope.drawing.code;
                $rootScope.editDrawing.revision = $scope.drawing.revision;
                $rootScope.editDrawing.drawing_date = $scope.drawing.drawing_date;
                $scope.$modalCancel();
            });

        }

    }
]);