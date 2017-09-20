dsApp.controller('PhotoCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService) { //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.local = {};
        $scope.local.data = localStorage.getObject('dsphotoact');
        $scope.local.data.url_original = $APP.server + 'pub/defectPhotos/' + $scope.local.data.base_64_string.replace("resized", "original");
        $scope.back = function() {
            $state.go('app.tab')
        }
    }
]);
