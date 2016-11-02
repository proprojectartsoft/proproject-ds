angular.module($APP.name).controller('_SelectDrawingCtrl', [
    '$rootScope', '$scope', 'DrawingsService', 'SweetAlert',
    function ($rootScope, $scope, DrawingsService, SweetAlert) {
        $scope.radioDrawing = {};
        DrawingsService.list_light($rootScope.project.id).then(function (result) {
            $scope.drawings = result;
        });
        $scope.selectDrawings = function () {
            $rootScope.select = {};           
            if ($scope.radioDrawing.id) {                
                $rootScope.select = {
                    id: $scope.radioDrawing.id.id,
                    title: $scope.radioDrawing.id.title,
                    path: $scope.radioDrawing.id.path
                }
                $scope.$modalCancel();
            }
            else{
                window.onkeydown = null;
                window.onfocus = null;
                SweetAlert.swal("Error!", "Please select a drawing to add", "error");
            }

        };
    }
]);
