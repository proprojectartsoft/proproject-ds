angular.module($APP.name).controller('_DefectAttachmentsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$indexedDB',
    '$filter',
    'DefectsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $filter, DefectsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.entityId = $stateParams.id;
        $scope.local = {};
        $scope.local.loaded = false;
        $scope.local.data = localStorage.getObject('ds.defect.active.data');

        if ($stateParams.id === '0') {
            $scope.settings.subHeader = 'New defect'
        } else {
            $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
        }

        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject').id).then(function(res) {
                var defect = $filter('filter')(res.defects, {
                    id: $stateParams.id
                })[0];
                $scope.local.loaded = true;
                $scope.local.list = [];
                angular.forEach(defect.attachements, function(value) {
                    value.url = $APP.server + 'pub/defectPhotos/' + value.base_64_string;
                    $scope.local.list.push(value);
                });
                $timeout(function() {
                    $('.ds-attachments').find('img').each(function() {
                        var aux = {};
                        var imgStyle = (this.width / this.height > 1) ? 'height' : 'width';
                        aux[imgStyle] = '100%'
                        $(this).css(aux);
                    })
                });
            })
        })

        $scope.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }
        $scope.go = function(item) {
            localStorage.setObject('dsphotoact', item)
            $state.go('app.photo', {
                id: $stateParams.id,
                photo: item.id
            });
        }


    }
]);
