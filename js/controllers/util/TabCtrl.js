dsApp.controller('TabCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$ionicPopup',
    '$timeout',
    'SyncService',
    'ConvertersService',
    '$filter',
    'PostService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, $timeout, SyncService, ConvertersService, $filter, PostService) {
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
                    //possible changes were made, so initializa and store changes
                    init();
                }
            })
        //initialize data if not initialized yet
        if (!vm.project) {
            angular.forEach(vm.settings.tabs, function(value, key) {
                vm.settings.tabs[key] = 'img/new/' + key + '.png';
            });
            vm.settings.tabs[$rootScope.currentTab] = vm.settings.tabs[$rootScope.currentTab].substr(0, vm.settings.tabs[$rootScope.currentTab].lastIndexOf(".png")) + "_active" + vm.settings.tabs[$rootScope.currentTab].substr(vm.settings.tabs[$rootScope.currentTab].lastIndexOf(".png"));
            // vm.settings.tabActive = predicate;
            $rootScope.currentTab = $rootScope.currentTab;
            SettingsService.set_settings(vm.settings);
            init();
        } else
            tabSelect($rootScope.currentTab);

        function storeModifiedDraw(proj) {
            proj.isModified = true;
            //store the modified drawing
            for (var i = 0; i < proj.drawings.length; i++) {
                if (proj.drawings[i].id == $rootScope.currentDraw.id) {
                    proj.drawings[i] = $rootScope.currentDraw;
                    return;
                }
            }
        }

        function storeNewDefect(proj) {
            var newDef = $rootScope.currentDefect;
            proj.defects.push(newDef);
            proj.isModified = true;
            ConvertersService.add_task_for_subcontractor(newDef, proj.subcontractors);
            if (newDef.drawing) {
                //get the drawing for the new defect
                var drawing = $filter('filter')(proj.drawings, {
                    id: newDef.drawing.id
                })[0];
                drawing.isModified = true;
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

        function storeModifiedDefect(proj) {
            var defect = $rootScope.currentDefect;
            var subc = null;
            if (defect.assignee_id != $rootScope.backupDefect.assignee_id) {
                // assignee changes
                subc = ConvertersService.remove_task_for_subcontractor(defect, proj.subcontractors, $rootScope.backupDefect.assignee_id);
                subc = ConvertersService.add_task_for_subcontractor(defect, proj.subcontractors);
            } else {
                //no initial assignee
                subc = ConvertersService.add_task_for_subcontractor(defect, proj.subcontractors);
            }
            proj.subcontractors = subc;

            if (defect.drawing) {
                //get the drawing for the new defect
                var drawing = $filter('filter')(proj.drawings, {
                    id: defect.drawing.id
                })[0];
                drawing.isModified = true;
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
            proj.isModified = true;
            //store the modified defect
            for (var i = 0; i < proj.defects.length; i++) {
                if (proj.defects[i].id == defect.id) {
                    proj.defects[i] = defect;
                    return;
                }
            }
        }

        function storeModifiedSubcontractor(proj) {
            //add to local db the new tasks added as related to current subcontractor
            angular.forEach($rootScope.currentSubcontr.newTasks, function(related) {
                //change the assignee for the defect
                var defect = $filter('filter')(proj.defects, {
                    id: related.id
                })[0];
                //remember old assignee and use it to remove the task from his list
                var oldAssignee = defect.assignee_id;
                //store new assignee for defect
                defect.assignee_id = $rootScope.currentSubcontr.id;
                defect.assignee_name = $rootScope.currentSubcontr.name;
                defect.isModified = true;
                //remove task from old assignee's list
                ConvertersService.remove_task_for_subcontractor(related, proj.subcontractors, oldAssignee);
            })
            proj.isModified = true;
            //store the modified subcontractor
            for (var i = 0; i < proj.subcontractors.length; i++) {
                if (proj.subcontractors[i].id == $rootScope.currentSubcontr.id) {
                    proj.subcontractors[i] = $rootScope.currentSubcontr;
                    return;
                }
            }
        }

        function init() {
            SyncService.getProject($rootScope.projId, function(result) {
                //store defect's changes
                if ($rootScope.currentDraw && $rootScope.currentDraw.modified) {
                    storeModifiedDraw(result.value);
                    delete $rootScope.modified;
                }
                //store new defect
                if ($rootScope.currentDefect && $rootScope.currentDefect.new) {
                    storeNewDefect(result.value);
                    delete $rootScope.currentDefect.new;
                }
                //store defect's changes
                if ($rootScope.currentDefect && $rootScope.currentDefect.modified) {
                    storeModifiedDefect(result.value);
                    delete $rootScope.currentDefect.modified;
                }
                //store subcontractor's changes
                if ($rootScope.currentSubcontr && $rootScope.currentSubcontr.modified) {
                    storeModifiedSubcontractor(result.value);
                    delete $rootScope.currentSubcontr.modified;
                }
                //store changes to lacal db
                SyncService.setProjects([result], function() {
                    //store local project
                    vm.project = result;
                    $rootScope.users = result.value.users;
                    $rootScope.defects = result.value.defects;
                    SettingsService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach($rootScope.defects, function(defect) {
                            defect.icon = SettingsService.get_initials(defect.assignee_name);
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(result.value.customer_id + "" + defect.assignee_id)) % colorsLength;
                            defect.backgroundColor = colorList[colorId].backColor;
                            defect.foregroundColor = colorList[colorId].foreColor;
                        });
                        //load page for the active tab
                        vm.reload();
                    })
                })
            })
        }

        function reload() {
            vm.settings.loaded = false;
            vm.list = [];
            switch ($rootScope.currentTab) { //vm.settings.tabActive
                case 'drawings':
                    vm.list = vm.project.value.drawings;
                    vm.settings.loaded = true;
                    break;
                case 'subcontractors':
                    SettingsService.get_colors().then(function(colorList) {
                        var colorsLength = Object.keys(colorList).length;
                        angular.forEach(vm.project.value.subcontractors, function(subcontr) {
                            //assign the collor corresponding to user id and customer id
                            var colorId = (parseInt(vm.project.value.customer_id + "" + subcontr.id)) % colorsLength;
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
        }

        function tabSelect(predicate) {
            angular.forEach(vm.settings.tabs, function(value, key) {
                vm.settings.tabs[key] = 'img/new/' + key + '.png';
            });
            vm.settings.tabs[predicate] = vm.settings.tabs[predicate].substr(0, vm.settings.tabs[predicate].lastIndexOf(".png")) + "_active" + vm.settings.tabs[predicate].substr(vm.settings.tabs[predicate].lastIndexOf(".png"));
            // vm.settings.tabActive = predicate;
            $rootScope.currentTab = predicate;
            SettingsService.set_settings(vm.settings);
            //no updates were made, so just reload data
            vm.reload();
        }

        function goItem(item) {
            // vm.settings.subHeader = item.name;
            switch ($rootScope.currentTab) {
                case 'defects':
                    //copy all attachments into pictures field
                    if (!item.photos.pictures)
                        item.photos.pictures = angular.copy(item.photos);
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
                        PostService.post({
                            method: 'POST',
                            url: 'invite/subcontractor',
                            params: {
                                email: res,
                                projectId: $rootScope.projId
                            }
                        }, function(succ) {}, function(error) {})
                    }
                }, function(err) {
                    console.log('Err:', err);
                }, function(msg) {
                    console.log('message:', msg);
                });
            };
            if ($rootScope.currentTab === 'defects') {
                $rootScope.currentDefect = ConvertersService.getEmptyDefect("new" + vm.project.value.defects.length);
                vm.go('defects', 0);
            };
        }
    }
]);
