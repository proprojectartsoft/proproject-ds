dsApp.controller('SubcontractorsCtrl', [
    '$rootScope',
    '$stateParams',
    '$state',
    'SettingsService',
    function($rootScope, $stateParams, $state, SettingsService) {
        var vm = this;
        vm.settings = {};
        vm.local = {};
        vm.local.entityId = $stateParams.id;
        SettingsService.put_settings('tabActive', 'subcontractors');
        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        $rootScope.routeback = {
            id: $stateParams.id,
            state: 'app.subcontractorrelated'
        }
        vm.local.data = $rootScope.currentSubcontr;
        vm.settings.subHeader = 'Subcontractor - ' + vm.local.data.last_name + ' ' + vm.local.data.first_name;

        vm.toggleEdit = function() {
            $rootScope.disableedit = !$rootScope.disableedit;
            if ($rootScope.disableedit == true) {
                vm.local.data = vm.local.backup;
            } else {
                vm.local.backup = angular.copy(vm.local.data);
            }
        }

        vm.saveEdit = function() {
            $rootScope.disableedit = true;
            $rootScope.currentSubcontr.isModified = true;
            $rootScope.currentSubcontr.modified = true;
            //go to main page and save the changes there
            $rootScope.go('app.tab');
        }

        vm.back = function() {
            $rootScope.disableedit = true;
            $rootScope.routeback = null;
            $rootScope.go('app.tab');
        }
    }
]);
