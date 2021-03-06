dsApp.controller('_DrawingDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    function($rootScope, $scope, $stateParams, $state) {
        $scope.settings = {};
        $scope.settings.subHeader = 'Drawing - ' + $rootScope.currentDraw.title;
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.back = function() {
            $rootScope.go('app.drawings', {
                id: $stateParams.id
            })
        }

    }
]);
