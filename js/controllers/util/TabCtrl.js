dsApp.controller('TabCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$ionicPopup',
    'SubcontractorsService',
    '$timeout',
    'ColorService',
    'SyncService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, SubcontractorsService, $timeout, ColorService, SyncService) {
        var vm = this;
        console.log("enter ctrl");
        vm.tabSelect = tabSelect;
        vm.reload = reload;
        vm.goItem = goItem;
        vm.go = go;
        vm.showPopup = showPopup
        vm.settings = {};
        vm.settings.tabs = SettingsService.get_settings('tabs');
        // vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.inviteemail = '';
        $rootScope.routeback = null;
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams) {
                console.log("state changed");
                if (toState.name == 'app.tab') {
                    reload();
                }
            })
        tabSelect($rootScope.currentTab);

        function tabSelect(predicate) {
            angular.forEach(vm.settings.tabs, function(value, key) {
                vm.settings.tabs[key] = 'img/new/' + key + '.png';
            });
            vm.settings.tabs[predicate] = vm.settings.tabs[predicate].substr(0, vm.settings.tabs[predicate].lastIndexOf(".png")) + "_active" + vm.settings.tabs[predicate].substr(vm.settings.tabs[predicate].lastIndexOf(".png"));
            // vm.settings.tabActive = predicate;
            $rootScope.currentTab = predicate;
            SettingsService.set_settings(vm.settings)
            vm.reload();
        }

        function reload() {
            vm.settings.loaded = false;
            vm.list = [];
            //TODO: store modified items
            SyncService.getProject($rootScope.projId, function(project) {
                switch ($rootScope.currentTab) { //vm.settings.tabActive
                    case 'drawings':
                        vm.list = project.value.drawings;
                        vm.settings.loaded = true;
                        break;
                    case 'subcontractors':
                        ColorService.get_colors().then(function(colorList) {
                            var colorsLength = Object.keys(colorList).length;
                            angular.forEach(project.value.subcontractors, function(subcontr) {
                                //assign the collor corresponding to user id and customer id
                                var colorId = (parseInt(project.value.customer_id + "" + subcontr.id)) % colorsLength;
                                vm.list.push({
                                    id: subcontr.id,
                                    name: subcontr.last_name + " " + subcontr.first_name,
                                    description: subcontr.company,
                                    icon: SettingsService.get_initials(subcontr.last_name + " " + subcontr.first_name),
                                    backgroundColor: colorList[colorId].backColor,
                                    foregroundColor: colorList[colorId].foreColor,
                                    tasks: subcontr.completed_tasks + subcontr.contested_tasks + subcontr.delayed_tasks + subcontr.incomplete_tasks + subcontr.partially_completed_tasks + subcontr.closed_out_tasks
                                })
                            });
                        })
                        vm.settings.loaded = true;
                        break;
                    case 'defects':
                        vm.list = project.value.defects;
                        ColorService.get_colors().then(function(colorList) {
                            var colorsLength = Object.keys(colorList).length;
                            angular.forEach(vm.list, function(defect) {
                                defect.icon = SettingsService.get_initials(defect.assignee_name);
                                //assign the collor corresponding to user id and customer id
                                var colorId = (parseInt(project.value.customer_id + "" + defect.assignee_id)) % colorsLength;
                                defect.backgroundColor = colorList[colorId].backColor;
                                defect.foregroundColor = colorList[colorId].foreColor;
                            });
                        })
                        vm.settings.loaded = true;
                        break;
                }
            })
        }

        function goItem(item) {
            // vm.settings.subHeader = item.name;
            $rootScope.currentItem = item;
            $rootScope.backupItem = angular.copy($rootScope.currentItem);
            SettingsService.set_settings(vm.settings)
            $state.go('app.' + $rootScope.currentTab, {
                id: item.id
            })
        }

        function go(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }

        function showPopup() {
            if ($rootScope.currentTab === 'subcontractors') {
                $ionicPopup.show({
                    template: '',
                    title: 'Invite subcontractor',
                    scope: $scope,
                    templateUrl: 'templates/subcontractors/_create.html',
                    buttons: [{
                        text: 'Cancel',
                        onTap: function(e) {
                            return 'close';
                        }
                    }, {
                        text: 'Create',
                        onTap: function(e) {
                            if (vm.inviteemail) {
                                return vm.inviteemail;
                            } else {
                                e.preventDefault();
                            }
                        }
                    }]
                }).then(function(res) {
                    if (res !== 'close') {
                        SubcontractorsService.invite(res).then(function(result) {})
                    }
                }, function(err) {
                    console.log('Err:', err);
                }, function(msg) {
                    console.log('message:', msg);
                });
            };
            if ($rootScope.currentTab === 'defects') {
                vm.go('defects', 0);
            };
        }
    }
]);
