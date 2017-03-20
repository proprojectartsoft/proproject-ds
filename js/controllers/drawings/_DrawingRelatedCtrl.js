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
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $filter, DrawingsService) { //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = parseInt(localStorage.getObject('dsproject'));
        localStorage.setObject('ds.defect.back', {
            id: $stateParams.id,
            state: 'app.drawingrelated'
        })

        $scope.local = {};
        $scope.local.loaded = false;
        $scope.local.data = localStorage.getObject('dsdrwact');
        $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;

        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject').id).then(function(res) {
                $scope.local.list = $filter('filter')(res.drawings, {
                    id: $stateParams.id
                })[0].relatedDefects;
                $scope.local.loaded = true;
            })
        })

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.name;
            SettingsService.set_settings($scope.settings)
            $state.go('app.defects', {
                id: item
            })
        }

        $scope.getInitials = function(str) {
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }

        $scope.back = function() {
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }
    }
]);
