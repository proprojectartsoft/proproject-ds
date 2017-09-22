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

        function saveChanges(project) {
            if ($rootScope.currentDefect && $rootScope.currentDefect.isNew) {
                storeNewDefect(project.value);
                delete $rootScope.currentDefect.isNew;
            }

            if ($rootScope.currentDefect && $rootScope.currentDefect.isModified) {
                storeModifiedDefect(project.value);
                delete $rootScope.currentDefect.isModified;
            }

            if ($rootScope.currentSubcontr && $rootScope.currentSubcontr.isModified) {
                //do changes for subcontractor
                storeModifiedSubcontractor(project.value);
                delete $rootScope.currentSubcontr.isModified;
            }
        }

        function storeNewDefect(project) {
            var newDef = $rootScope.currentDefect;
            // assign an id
            var nextId = "new" + project.defects.length;
            newDef.id = nextId;
            project.defects.push(newDef);
            var subcontr = $filter('filter')(project.subcontractors, {
                id: newDef.assignee_id
            })[0];
            if (subcontr) {
                subcontr.tasks.push(newDef);
                ConvertersService.increase_nr_tasks(subcontr, newDef.status_name);
            }

            if (newDef.drawing) {
                var drawing = $filter('filter')(project.drawings, {
                    id: newDef.drawing.id
                })[0];
                drawing.nr_of_defects++;
                var aux = {};
                if (newDef.drawing.markers && newDef.drawing.markers.length) {
                    aux = angular.copy(newDef.drawing.markers[0])
                    aux.defect_id = nextId + 1;
                    aux.drawing_id = vm.local.drawing.id;
                    aux.position_x = aux.xInit;
                    aux.position_y = aux.yInit;
                    drawing.markers.push(aux);
                    // aux.status = localStorredDef.status_name;
                }
                //
                // localStorredDef.draw = drawing;
                // localStorredDef.completeInfo.drawing = ConvertersService.save_local(drawing);
                // if (vm.local.drawing.markers) {
                //     localStorredDef.completeInfo.drawing.markers.push(aux);
                // }
                //add defect in the related defects list of the corresponding drawing
                // var drawForDefect = $filter('filter')(project.drawings, {
                //     id: localStorredDef.draw.id
                // })[0];
                // if (drawForDefect) {
                //     var relDefect = {};
                //     relDefect.id = localStorredDef.id;
                //     relDefect.assignee_name = localStorredDef.assignee_name;
                //     relDefect.date = localStorredDef.date;
                //     relDefect.due_date = localStorredDef.due_date;
                //     relDefect.number_of_comments = 0;
                //     relDefect.number_of_photos = 0;
                //     relDefect.priority_name = localStorredDef.priority_name;
                //     relDefect.severity_name = localStorredDef.severity_name;
                //     relDefect.status_name = localStorredDef.status_name;
                //     relDefect.title = localStorredDef.title;
                //     drawForDefect.relatedDefects.push(relDefect);
                // }
            }
        }

        function storeModifiedDefect(project) {
            //TODO: indicate modifications to be synced
            var defect = $rootScope.currentDefect;
            // assignee changes
            if (defect.assignee_id != $rootScope.backupDefect.assignee_id) {
                //get the old asignee if it is a subconstractor
                var subcontr = $filter('filter')(project.subcontractors, {
                    id: $rootScope.backupDefect.assignee_id
                })[0]
                if (subcontr) {
                    //get the defect from the related tasks list of the old assignee
                    var rel = $filter('filter')(subcontr.related, {
                        id: defect.id
                    })[0];
                    // remove from old assignee related list
                    subcontr.tasks = $filter('filter')(subcontr.related, {
                        id: ('!' + rel.id)
                    });
                    ConvertersService.decrease_nr_tasks(subcontr, defect.status_name);
                }
                //get the current assignee if it is a subconstractor
                var newSubcontr = $filter('filter')(project.subcontractors, {
                    id: defect.assignee_id
                })[0];
                if (newSubcontr) {
                    //add the defect to new assignee related list
                    newSubcontr.tasks.push(defect);
                    ConvertersService.increase_nr_tasks(newSubcontr, defect.status_name);
                }
            } else {
                //get the current assignee if it is a subconstractor
                var subcontr = $filter('filter')(project.subcontractors, {
                    id: defect.assignee_id
                })[0];
                if (subcontr) {
                    //add the defect to new assignee related list
                    subcontr.related = $filter('filter')(subcontr.related, {
                        id: ('!' + defect.id)
                    });
                    subcontr.related.push(defect);
                }
            }

            //TODO: change the drawings with new markers
            // if (vm.defect.drawing) {
            //     var drawForDefect = $filter('filter')(project.drawings, {
            //         id: defect.completeInfo.drawing.id
            //     })[0];
            //     if (drawForDefect) {
            //         if (drawForDefect.markers && drawForDefect.markers.length != 0) {
            //             $filter('filter')(drawForDefect.markers, {
            //                 defect_id: defect.id
            //             })[0].status = defect.completeInfo.drawing.markers[0].status;
            //         }
            //         if (drawForDefect.relatedDefects && drawForDefect.relatedDefects.length != 0) {
            //             var relDefect = $filter('filter')(drawForDefect.relatedDefects, {
            //                 id: defect.id
            //             })[0];
            //             relDefect.assignee_name = defect.assignee_name;
            //             relDefect.date = defect.date;
            //             relDefect.due_date = defect.due_date;
            //             relDefect.number_of_comments = defect.number_of_comments;
            //             relDefect.number_of_photos = defect.number_of_photos;
            //             relDefect.priority_name = defect.priority_name;
            //             relDefect.severity_name = defect.severity_name;
            //             relDefect.status_name = defect.status_name;
            //             relDefect.title = defect.title;
            //         }
            //     }
            // }
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
                defect.assignee_id = $rootScope.currentSubcontr.id;
                defect.assignee_name = $rootScope.currentSubcontr.name;
                // var related = $rootScope.currentSubcontr.tasks;
                for (var i = 0; i < project.subcontractors.length; i++) {
                    //remove the task from the list of the old subcontractor
                    if ($filter('filter')(project.subcontractors[i].tasks, {
                            id: related.id
                        }).length != 0) {
                        project.subcontractors[i].tasks = $filter('filter')(project.subcontractors[i].tasks, {
                            id: ('!' + related.id)
                        });
                        ConvertersService.decrease_nr_tasks(project.subcontractors[i], related.status_name);
                        i = project.subcontractors.length;
                    }
                }
            })

            //TODO: indicate all modifications performed
            // if (typeof defect.isNew == 'undefined')
            //     defect.isModified = true;
            // project.isModified = true;
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
