dsApp.controller('_DrawingRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$filter',
    'DrawingsService',
    'ColorService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $filter, DrawingsService, ColorService) {
        $scope.settings = {};
        $scope.settings.project = parseInt($rootScope.projId);
        $rootScope.routeback = {
            id: $stateParams.id,
            state: 'app.drawingrelated'
        }
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.local = {};
        $scope.local.loaded = false;
        $scope.settings.subHeader = 'Drawing - ' + $rootScope.currentDraw.title;
        $scope.local.list = $rootScope.currentDraw.defects;

        ColorService.get_colors().then(function(colorList) {
            $scope.local.loaded = true;
            var colorsLength = Object.keys(colorList).length;
            angular.forEach($scope.local.list, function(relTask) {
                // assign the collor corresponding to user id and customer id
                var colorId = (parseInt($rootScope.customer_id || 0 + "" + relTask.assignee_id)) % colorsLength; //TODO: get ids!!!!!
                relTask.backgroundColor = colorList[colorId].backColor;
                relTask.foregroundColor = colorList[colorId].foreColor;
            })
        })

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.title;
            SettingsService.set_settings($scope.settings);
            //store the new item (defect) to be displayed
            $rootScope.currentDefect = item;
            $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
            $state.go('app.defects', {
                id: item.id
            })
        }

        $scope.getInitials = function(str) {
            return SettingsService.get_initials(str);
        }

        $scope.back = function() {
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }
    }
]);
