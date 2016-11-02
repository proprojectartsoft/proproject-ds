angular.module($APP.name).controller('_createProjectCtrl', [
    '$rootScope', '$scope', 'SelectDrawingService','ProjectService', 'createDialog', 'DrawingsService', 'SettingsService', '$timeout',
    function ($rootScope, $scope, SelectDrawingService, ProjectService, createDialog, DrawingsService, SettingsService, $timeout) {
        $scope.dataPreview = {};
        $scope.create = function(){           
            ProjectService.create($scope.dataPreview).then(function (result) {
                            $rootScope.$broadcast('scanner-started');
                            $scope.$modalCancel();
                        });
        }
    }]);