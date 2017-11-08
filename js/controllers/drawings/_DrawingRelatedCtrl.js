dsApp.controller('_DrawingRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$filter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $filter) {
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

        SettingsService.get_colors().then(function(colorList) {
            $scope.local.loaded = true;
            var colorsLength = Object.keys(colorList).length;
            angular.forEach($scope.local.list, function(relTask) {
                // assign the collor corresponding to user id and customer id
                var colorId = (parseInt(($rootScope.customer_id || 0) + "" + relTask.assignee_id)) % colorsLength;
                relTask.backgroundColor = colorList[colorId].backColor;
                relTask.foregroundColor = colorList[colorId].foreColor;
            })
        })

        //go to a defect
        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.title;
            SettingsService.set_settings($scope.settings);
            //store the new item (defect) to be displayed
            item.drawing = $rootScope.currentDraw;
            item.photos = [];
            item.comments = [];
            item.related_tasks = [];
            $rootScope.currentDefect = $filter('filter')($rootScope.defects, {
                id: item.id
            })[0];
            $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
            $rootScope.go('app.defects', {
                id: item.id
            })
        }

        //launch fullscreen
        $scope.getFullscreen = function() {
            $rootScope.disableedit = !$rootScope.disableedit;
            if ($rootScope.disableedit)
                $rootScope.currentDraw = angular.copy($rootScope.backupDraw);
            $scope.goToFullscreen('fullscreen', $stateParams.id);
        }

        $scope.goToFullscreen = function(predicate, item) {
            if (predicate == 'back') {
                $rootScope.routeback = null;
                $rootScope.disableedit = true;
                $rootScope.go('app.tab');
            } else {
                $rootScope.currentDefect = $filter('filter')($rootScope.defects, {
                    id: item
                })[0];
                $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                $rootScope.go('app.' + predicate, {
                    id: item
                });
            }
        }

        $scope.getInitials = function(str) {
            return SettingsService.get_initials(str);
        }
    }
]);
