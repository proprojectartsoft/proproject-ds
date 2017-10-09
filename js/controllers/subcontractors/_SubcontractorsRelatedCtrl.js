dsApp.controller('_SubcontractorsRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicModal',
    '$filter',
    'ConvertersService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $ionicModal, $filter, ConvertersService) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.project = $rootScope.projId;
        vm.settings.state = 'related';
        vm.local = {};
        vm.subcontractor = $rootScope.currentSubcontr;
        vm.local.entityId = $stateParams.id;
        vm.settings.subHeader = 'Subcontractor - ' + vm.subcontractor.last_name + ' ' + vm.subcontractor.first_name;

        vm.local.list = vm.subcontractor.tasks || [];
        vm.local.poplist = [];
        //fill the list of possible related defects
        angular.forEach($rootScope.defects, function(def) {
            if (!$filter('filter')(vm.local.list, {
                    id: def.id
                }).length) {
                vm.local.poplist.push(def);
            }
        })
        //get the colors from json
        SettingsService.get_colors().then(function(colorList) {
            var colorsLength = Object.keys(colorList).length;
            angular.forEach(vm.local.list, function(relTask) {
                //assign the collor corresponding to user id and customer id
                var colorId = (parseInt($rootScope.customer_id + "" + relTask.assignee_id)) % colorsLength;
                relTask.backgroundColor = colorList[colorId].backColor;
                relTask.foregroundColor = colorList[colorId].foreColor;
            });
        })

        vm.goItem = function(item) {
            vm.settings.subHeader = item.name;
            SettingsService.set_settings(vm.settings);
            $rootScope.currentDefect = item;
            $rootScope.currentDraw = item.drawing;
            $state.go('app.defects', {
                id: item.id
            })
        }
        vm.getInitials = function(str) {
            return SettingsService.get_initials(str);
        }
        vm.back = function() {
            $state.go('app.subcontractors', {
                id: $stateParams.id
            })
        }
        $ionicModal.fromTemplateUrl('templates/defects/_popover.html', {
            scope: $scope
        }).then(function(modal) {
            vm.modal = modal;
        });
        // Triggered in the login modal to close it
        vm.closePopup = function() {
            vm.modal.hide();
        };
        // Open the login modal
        vm.related = function() {
            vm.modal.show();
        };

        vm.addRelated = function(related) {
            vm.modal.hide();
            $rootScope.currentSubcontr.isModified = true;
            $rootScope.currentSubcontr.modified = true;
            $rootScope.currentSubcontr.nr_of_defects++;
            related.assignee_id = vm.subcontractor.id;
            related.assignee_name = vm.subcontractor.first_name + " " + vm.subcontractor.last_name;
            SettingsService.get_colors().then(function(colorList) {
                var colorsLength = Object.keys(colorList).length;
                //assign the collor corresponding to user id and customer id
                var colorId = (parseInt($rootScope.customer_id + "" + related.assignee_id)) % colorsLength;
                related.backgroundColor = colorList[colorId].backColor;
                related.foregroundColor = colorList[colorId].foreColor;
                //add the task to the list of the new subcontractor
                $rootScope.currentSubcontr.newTasks = $rootScope.currentSubcontr.newTasks || [];
                $rootScope.currentSubcontr.newTasks.push(related);
                vm.local.list.push(related);
                ConvertersService.increase_nr_tasks($rootScope.currentSubcontr, related.status_name);
                $state.go('app.tab');
            })
        }
    }
]);

dsApp.filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
