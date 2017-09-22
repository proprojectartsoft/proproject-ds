dsApp.controller('SubcontractorsCtrl', [
    '$rootScope',
    '$stateParams',
    '$state',
    '$filter',
    '$ionicPopup',
    'SettingsService',
    'SubcontractorsService',
    'ConvertersService',
    function($rootScope, $stateParams, $state, $filter, $ionicPopup, SettingsService, SubcontractorsService, ConvertersService) {
        var vm = this;
        vm.settings = {};
        vm.local = {};
        vm.local.entityId = $stateParams.id;
        $rootScope.disableedit = true;
        SettingsService.put_settings('tabActive', 'subcontractors');
        $rootScope.routeback = {
            id: $stateParams.id,
            state: 'app.subcontractorrelated'
        }
        vm.local.data = $rootScope.currentSubcontr;
        vm.settings.subHeader = 'Subcontractor - ' + vm.local.data.last_name + ' ' + vm.local.data.first_name;
        //delete subcontractor.company_logo;

        vm.toggleEdit = function() {
            $rootScope.disableedit = false;
            vm.local.backup = angular.copy(vm.local.data);
        }
        vm.cancelEdit = function() {
            vm.local.data = vm.local.backup;
            $rootScope.disableedit = true;
        }

        vm.saveEdit = function() {
            $rootScope.disableedit = true;
            $rootScope.currentSubcontr.isModified = true;
            //go to main page and save the changes there
            vm.go('tab');

            // subcontr.isModified = true;
            // project.isModified = true;
        }

        vm.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
        vm.back = function() {
            $rootScope.disableedit = true;
            $rootScope.routeback = null;
            $state.go('app.tab')
        }
    }
]);
