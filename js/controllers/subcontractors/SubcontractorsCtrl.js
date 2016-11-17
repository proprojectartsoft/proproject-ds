angular.module($APP.name).controller('SubcontractorsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    'SubcontractorsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, SubcontractorsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.tabActive = 'subcontractors'
        $scope.local = {};
        $scope.local.entityId = $stateParams.id;
        $rootScope.disableedit = true;
        SettingsService.put_settings('tabActive', 'subcontractors');
        localStorage.setObject('ds.defect.back', {id:$stateParams.id, state:'app.subcontractorrelated'})
        localStorage.removeItem('ds.reloadevent');

        if (!localStorage.getObject('dsscact') || localStorage.getObject('dsscact').id !== parseInt($stateParams.id)) {
            SubcontractorsService.get($stateParams.id).then(function(result) {
                delete result.company_logo;
                localStorage.setObject('dsscact', result)
                $scope.local.data = result;
                $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
            })
        } else {
            $scope.local.data = localStorage.getObject('dsscact');
            $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;
        }

        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
            $scope.local.backup = angular.copy($scope.local.data);
        }
        $scope.cancelEdit = function() {
            $scope.local.data = $scope.local.backup;
            $rootScope.disableedit = true;
        }
        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            SubcontractorsService.update($scope.local.data).then(function(result) {
                localStorage.setObject('dsscact', $scope.local.data)
                localStorage.setObject('ds.reloadevent', {value: true});
            })
        }

        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });

        }
        $scope.back = function() {
            $rootScope.disableedit = true;
            localStorage.removeItem('ds.defect.back');
            $state.go('app.tab')
        }
    }
]);
