dsApp.controller('_DrawingDetailsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    '$timeout',
    function($rootScope, $scope, $stateParams, $state, $timeout) {
        $scope.settings = {};
        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        $scope.settings.subHeader = 'Drawing - ' + $rootScope.currentDraw.title;
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.back = function() {
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }

    }
]);
