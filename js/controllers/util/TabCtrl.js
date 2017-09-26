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
    'ConvertersService',
    '$filter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, SubcontractorsService, $timeout, ColorService, SyncService, ConvertersService, $filter) {
        var vm = this;
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

        function saveChanges(project) {
            //store new defect
            if ($rootScope.currentDefect && $rootScope.currentDefect.new) {
                storeNewDefect(project.value);
                delete $rootScope.currentDefect.new;
            }
            //store defect's changes
            if ($rootScope.currentDefect && $rootScope.currentDefect.modified) {
                storeModifiedDefect(project.value);
                delete $rootScope.currentDefect.modified;
            }
            //store subcontractor's changes
            if ($rootScope.currentSubcontr && $rootScope.currentSubcontr.modified) {
                storeModifiedSubcontractor(project.value);
                delete $rootScope.currentSubcontr.modified;
            }
        }

        function storeNewDefect(project) {
            var newDef = $rootScope.currentDefect;
            // assign an id
            var nextId = "new" + project.defects.length;
            newDef.id = nextId;
            project.defects.push(newDef);
            project.isModified = true;
            ConvertersService.add_task_for_subcontractor(newDef, project.subcontractors);
            if (newDef.drawing) {
                //get the drawing for the new defect
                var drawing = $filter('filter')(project.drawings, {
                    id: newDef.drawing.id
                })[0];
                //store the new defect in drawing's defects list
                drawing.defects.push(newDef);
                drawing.nr_of_defects++;
                var aux = {};
                //store the marker for the new defect
                if (newDef.drawing.markers && newDef.drawing.markers.length) {
                    aux = angular.copy(newDef.drawing.markers[0])
                    aux.defect_id = nextId + 1;
                    aux.position_x = aux.xInit;
                    aux.position_y = aux.yInit;
                    drawing.markers.push(aux);
                }
            }
        }

        function storeModifiedDefect(project) {
            var defect = $rootScope.currentDefect;
            if (defect.assignee_id != $rootScope.backupDefect.assignee_id) {
                // assignee changes
                ConvertersService.remove_task_for_subcontractor(defect, project.subcontractors, $rootScope.backupDefect.assignee_id);
                ConvertersService.add_task_for_subcontractor(defect, project.subcontractors);
            } else {
                //no initial assignee
                ConvertersService.add_task_for_subcontractor(defect, project.subcontractors);
            }

            if (defect.drawing) {
                //get the drawing for the new defect
                var drawing = $filter('filter')(project.drawings, {
                    id: defect.drawing.id
                })[0];
                //change the status for marker
                if (drawing.markers && drawing.markers.length != 0) {
                    $filter('filter')(drawing.markers, {
                        defect_id: defect.id
                    })[0].status = defect.drawing.markers[0].status;

                }
                //change details for drawing's defect
                for (var i = 0; i < drawing.defects.length; i++) {
                    if (drawing.defects[i].id == defect.id) {
                        drawing.defects[i] = defect;
                        i = drawing.defects.length;
                    }
                }
            }
            project.isModified = true;
            //store the modified defect
            for (var i = 0; i < project.defects.length; i++) {
                if (project.defects[i].id == defect.id) {
                    project.defects[i] = defect;
                    return;
                }
            }
        }

        function storeModifiedSubcontractor(project) {
            //add to local db the new tasks added as related to current subcontractor
            angular.forEach($rootScope.currentSubcontr.newTasks, function(related) {
                //change the assignee for the defect
                var defect = $filter('filter')(project.defects, {
                    id: related.id
                })[0];
                //remember old assignee and use it to remove the task from his list
                var oldAssignee = defect.assignee_id;
                //store new assignee for defect
                defect.assignee_id = $rootScope.currentSubcontr.id;
                defect.assignee_name = $rootScope.currentSubcontr.name;
                //remove task from old assignee's list
                ConvertersService.remove_task_for_subcontractor(related, project.subcontractors, oldAssignee);
            })
            project.isModified = true;
            //store the modified subcontractor
            for (var i = 0; i < project.subcontractors.length; i++) {
                if (project.subcontractors[i].id == $rootScope.currentSubcontr.id) {
                    project.subcontractors[i].tasks = $rootScope.currentSubcontr.tasks;
                    return;
                }
            }
        }

        function reload() {
            vm.settings.loaded = false;
            vm.list = [];
            SyncService.getProject($rootScope.projId, function(project) {
                saveChanges(project);
                SyncService.setProjects([project], function() {
                    $rootScope.users = project.value.users;
                    $rootScope.defects = project.value.defects;
                    //TODO: store drawings for defects select
                    ColorService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach($rootScope.defects, function(defect) {
                            defect.icon = SettingsService.get_initials(defect.assignee_name);
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(project.value.customer_id + "" + defect.assignee_id)) % colorsLength;
                            defect.backgroundColor = colorList[colorId].backColor;
                            defect.foregroundColor = colorList[colorId].foreColor;
                        });
                    })

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
                                    subcontr.name = subcontr.last_name + " " + subcontr.first_name;
                                    subcontr.description = subcontr.company;
                                    subcontr.icon = SettingsService.get_initials(subcontr.last_name + " " + subcontr.first_name);
                                    subcontr.backgroundColor = colorList[colorId].backColor;
                                    subcontr.foregroundColor = colorList[colorId].foreColor;
                                    subcontr.nr_of_defects = subcontr.completed_tasks + subcontr.contested_tasks + subcontr.delayed_tasks + subcontr.incomplete_tasks + subcontr.partially_completed_tasks + subcontr.closed_out_tasks;
                                    vm.list.push(subcontr);
                                });
                            })
                            vm.settings.loaded = true;
                            break;
                        case 'defects':
                            vm.list = $rootScope.defects;
                            vm.settings.loaded = true;
                            break;
                    }
                });
            })
        }

        function goItem(item) {
            // vm.settings.subHeader = item.name;
            switch ($rootScope.currentTab) {
                case 'defects':
                    $rootScope.currentDefect = item;
                    $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                    break;
                case 'drawings':
                    $rootScope.currentDraw = item;
                    $rootScope.backupDraw = angular.copy($rootScope.currentDraw);
                    break;
                case 'subcontractors':
                    $rootScope.currentSubcontr = item;
                    break;
                default:
            }
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
                $rootScope.currentDefect = ConvertersService.getEmptyDefect();
                vm.go('defects', 0);
            };
        }
    }
]);
