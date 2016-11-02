angular.module($APP.name).controller('_DrawingDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout) { //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }

        $scope.local = {};
        $scope.local.data = localStorage.getObject('dsdrwact')
        $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;

        $scope.back = function() {
            if (!$rootScope.disableedit) {
                localStorage.setObject('dsdrwact', $scope.local.data)
            }
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }

    }
]);
