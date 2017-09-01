angular.module($APP.name).controller('_DrawingRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$indexedDB',
    '$filter',
    'DrawingsService',
    'ColorService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $filter, DrawingsService, ColorService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = parseInt(localStorage.getObject('dsproject'));
        localStorage.setObject('ds.defect.back', {
            id: $stateParams.id,
            state: 'app.drawingrelated'
        })
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.local = {};
        $scope.local.loaded = false;
        $scope.local.data = localStorage.getObject('dsdrwact');
        $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;

        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject')).then(function(res) {
                $scope.local.list = $filter('filter')(res.drawings, {
                    id: $stateParams.id
                })[0].relatedDefects;
                $scope.local.loaded = true;
                ColorService.get_colors().then(function(colorList) {
                    var colorsLength = Object.keys(colorList).length;
                    angular.forEach($scope.local.list, function(relTask) {
                        //get from defects list the current defect
                        var def = $filter('filter')(res.defects, {
                            id: relTask.id
                        })[0];
                        //assign the collor corresponding to user id and customer id
                        var colorId = (parseInt(res.customer_id + "" + def.completeInfo.assignee_id)) % colorsLength;
                        relTask.backgroundColor = colorList[colorId].backColor;
                        relTask.foregroundColor = colorList[colorId].foreColor;
                    })
                })
            })
        })

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.title;
            SettingsService.set_settings($scope.settings)
            $state.go('app.defects', {
                id: item.id
            })
        }

        $scope.getInitials = function(str) {
            if (str) {
                var aux = str.split(" ");
                return (aux[0][0] + aux[1][0]).toUpperCase();
            }
            return "";
        }

        $scope.back = function() {
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }
    }
]);
