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
    '$q',
    'PostService',
    'orderByFilter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $ionicPopup, $timeout, SyncService, ConvertersService, $filter, $q, PostService, orderBy) {
        var vm = this;
        vm.tabSelect = tabSelect;
        vm.reload = reload;
        vm.goItem = goItem;
        vm.go = go;
        vm.showPopup = showPopup
        vm.settings = {};
        vm.settings.tabs = SettingsService.get_settings('tabs');
        $rootScope.disableedit = true;
        // vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.inviteemail = '';
        $rootScope.routeback = null;
        var initOnce = false;

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

        function updateDraw(draw) {
            var d = $q.defer();
            if (!draw) {
                d.resolve();
                return d.promise;
            }
            PostService.post({
                method: 'PUT',
                url: 'drawing',
                data: ConvertersService.get_drawing_for_update(draw)
            }, function(res) {
                d.resolve();
            }, function(err) {
                d.resolve();
            })
            return d.promise;
        }

        function setReporterId(defect) {
            var def = $q.defer();
            if (defect.reporter_id && defect.assignee_id)
                def.resolve();
            //get the new created defect from server and store in local db some required information: the reporter and assignee ids
            PostService.post({
                method: 'GET',
                url: 'defect',
                params: {
                    id: defect.id
                }
            }, function(result) {
                defect.reporter_id = defect.reporter_id || result.data.reporter_id;
                defect.assignee_id = defect.assignee_id || result.data.assignee_id;
                defect.defect_no = defect.defect_no || result.data.defect_no;
                def.resolve();
            }, function(err) {
                def.resolve();
            })
            return def.promise;
        }

        function storeModifiedDraw(proj, drawing) {
            //store the modified drawing
            for (var i = 0; i < proj.drawings.length; i++) {
                if (proj.drawings[i].id == drawing.id) {
                    proj.drawings[i] = drawing;
                    return;
                }
            }
        }

        function storeNewDefect(proj, newDef) {
            var prm = $q.defer(),
                drawToUpdate = null;
            proj.subcontractors = ConvertersService.add_task_for_subcontractor(newDef, proj.subcontractors) || [];

            // set the new id of the added defect as defect_id for all its new attachments
            angular.forEach(newDef.photos.pictures, function(pic) {
                pic.defect_id = newDef.id;
            })

            // set the new id of the added defect as defect_id for all its new comments
            angular.forEach(newDef.comments, function(comm) {
                comm.defect_id = newDef.id;
            })

            if (newDef.drawing) {
                //get the drawing of the new added defect from the array of drawings
                var drawing = $filter('filter')(proj.drawings, {
                    id: newDef.drawing.id
                });
                if (drawing && drawing.length) {
                    if ($rootScope.offlineData)
                        drawing[0].isModified = true;
                    //store the new defect in drawing's defects list
                    drawing[0].defects.push(newDef);
                    drawing[0].nr_of_defects++;
                    var aux = {};
                    //store the marker for the new defect
                    if (newDef.drawing.markers && newDef.drawing.markers.length) {
                        aux = angular.copy(newDef.drawing.markers[0])
                        aux.defect_id = newDef.id;
                        aux.position_x = aux.xInit;
                        aux.position_y = aux.yInit;
                        drawing[0].markers.push(aux);
                    }
                    drawToUpdate = drawing[0];
                }
            }

            if (!$rootScope.offlineData) {
                var attachments = {};
                attachments.toAdd = newDef.photos.pictures || [];
                attachments.toUpd = [];
                attachments.toDelete = [];
                var subcontrPrm = SyncService.syncSubcontractors(proj.subcontractors),
                    attachPrm = SyncService.syncAttachments(attachments),
                    drawPrm = updateDraw(drawToUpdate),
                    commPrm = SyncService.syncComments(newDef.comments);

                Promise.all([attachPrm, drawPrm, subcontrPrm, commPrm]).then(function(res) {
                    //get from server the new created defect and add it locally
                    PostService.post({
                        method: 'GET',
                        url: 'defect',
                        params: {
                            id: newDef.id
                        }
                    }, function(result) {
                        var storedDefect = result.data;
                        //set pdfPath fro drawing
                        if (storedDefect.drawing) {
                            var drawing = $filter('filter')(proj.drawings, {
                                id: storedDefect.drawing.id
                            });
                            storedDefect.drawing.pdfPath = drawing && drawing[0].pdfPath || null;
                        }
                        //get comments
                        var commentsPrm = PostService.post({
                                method: 'GET',
                                url: 'defectcomment',
                                params: {
                                    defectId: newDef.id
                                }
                            }, function(result) {
                                storedDefect.comments = result.data;
                            }, function(err) {
                                storedDefect.comments = [];
                            }),
                            //get attachments
                            photosPrm = PostService.post({
                                method: 'GET',
                                url: 'defectphoto/defect',
                                params: {
                                    defectId: newDef.id
                                }
                            }, function(result) {
                                storedDefect.photos = result.data;
                            }, function(err) {
                                storedDefect.photos = [];
                            });

                        Promise.all([commentsPrm, photosPrm]).then(function(succ) {
                            proj.defects.push(storedDefect);
                            prm.resolve();
                        })
                    }, function(err) {
                        prm.resolve();
                    })
                })
            } else {
                proj.defects.push(newDef);
                //set project's status to modified for later sync
                proj.isModified = true;
                prm.resolve();
            }
            return prm.promise;
        }

        function storeModifiedDefect(proj, defect) {
            var subc = null,
                drawToUpdate = null,
                prm = $q.defer();
            if (defect.assignee_id != $rootScope.backupDefect.assignee_id) {
                // assignee changes
                subc = ConvertersService.remove_task_for_subcontractor(defect, proj.subcontractors, $rootScope.backupDefect.assignee_id);
                subc = ConvertersService.add_task_for_subcontractor(defect, proj.subcontractors);
            } else {
                //no initial assignee
                subc = ConvertersService.add_task_for_subcontractor(defect, proj.subcontractors);
            }
            proj.subcontractors = subc || [];

            if (defect.drawing) {
                //get the drawing for the new defect
                var drawing = $filter('filter')(proj.drawings, {
                    id: defect.drawing.id
                });
                if (drawing && drawing.length) {
                    if ($rootScope.offlineData)
                        drawing[0].isModified = true;
                    //change the status for marker
                    if (drawing[0].markers && drawing[0].markers.length != 0) {
                        var marker = $filter('filter')(drawing[0].markers, {
                            defect_id: defect.id
                        });
                        if (marker && marker.length) {
                            //change status and position for the modified defect's marker
                            marker[0].status = defect.drawing.markers[0].status;
                            marker[0].position_x = defect.drawing.markers[0].position_x;
                            marker[0].position_y = defect.drawing.markers[0].position_y;
                        }
                    }
                    //change details for drawing's defect
                    for (var i = 0; i < drawing[0].defects.length; i++) {
                        if (drawing[0].defects[i].id == defect.id) {
                            drawing[0].defects[i] = defect;
                            i = drawing[0].defects.length;
                        }
                    }
                    drawToUpdate = drawing[0];
                }
            }

            if (!$rootScope.offlineData) {
                var commentsToAdd = [],
                    attachments = {
                        toAdd: []
                    };
                //store new comments for the defect
                angular.forEach(defect.comments, function(comment) {
                    //store new comments to be synced
                    if (typeof comment.isNew != 'undefined') {
                        delete comment.isNew;
                        commentsToAdd.push(comment);
                    }
                })

                //store new attachments
                angular.forEach(defect.photos.pictures, function(pic) {
                    //store new attachments to be synced
                    if (!pic.id) {
                        attachments.toAdd.push(pic);
                    }
                })

                attachments.toUpd = defect.photos.toBeUpdated || [];
                attachments.toDelete = defect.photos.toBeDeleted || [];

                var subcontrPrm = SyncService.syncSubcontractors(proj.subcontractors),
                    commPrm = SyncService.syncComments(commentsToAdd),
                    attachPrm = SyncService.syncAttachments(attachments),
                    drawPrm = updateDraw(drawToUpdate);

                Promise.all([attachPrm, drawPrm, subcontrPrm]).then(function(res) {
                    //get from server the new created defect and add it locally
                    PostService.post({
                        method: 'GET',
                        url: 'defect',
                        params: {
                            id: defect.id
                        }
                    }, function(result) {
                        var storedDefect = result.data;
                        //set pdfPath fro drawing
                        if (storedDefect.drawing) {
                            var drawing = $filter('filter')(proj.drawings, {
                                id: storedDefect.drawing.id
                            });
                            storedDefect.drawing.pdfPath = drawing && drawing[0].pdfPath || null;
                        }
                        //get comments
                        var commentsPrm = PostService.post({
                                method: 'GET',
                                url: 'defectcomment',
                                params: {
                                    defectId: defect.id
                                }
                            }, function(result) {
                                storedDefect.comments = result.data;
                            }, function(err) {
                                storedDefect.comments = [];
                            }),
                            //get attachments
                            photosPrm = PostService.post({
                                method: 'GET',
                                url: 'defectphoto/defect',
                                params: {
                                    defectId: defect.id
                                }
                            }, function(result) {
                                storedDefect.photos = result.data;
                            }, function(err) {
                                storedDefect.photos = [];
                            });

                        Promise.all([commentsPrm, photosPrm]).then(function(succ) {
                            //store the modified defect
                            for (var i = 0; i < proj.defects.length; i++) {
                                if (proj.defects[i].id == defect.id) {
                                    proj.defects[i] = storedDefect;
                                    i = proj.defects.length;
                                }
                            }
                            prm.resolve();
                        })
                    }, function(err) {
                        delete defect.photos.toBeUpdated;
                        delete defect.photos.toBeDeleted;
                        //store the modified defect
                        for (var i = 0; i < proj.defects.length; i++) {
                            if (proj.defects[i].id == defect.id) {
                                proj.defects[i] = defect;
                                i = proj.defects.length;
                            }
                        }
                        prm.resolve();
                    })
                })
            } else {
                //store the modified defect
                for (var i = 0; i < proj.defects.length; i++) {
                    if (proj.defects[i].id == defect.id) {
                        proj.defects[i] = defect;
                        i = proj.defects.length;
                    }
                }
                //set project's status to modified for later sync
                proj.isModified = true;
                prm.resolve();
            }
            return prm.promise;
        }

        function storeModifiedSubcontractor(proj, subcontr) {
            var prm = $q.defer(),
                cnt = 0;
            if (!subcontr.newTasks || subcontr.newTasks && !subcontr.newTasks.length) {
                prm.resolve();
            }

            var replaceSubcontractor = function(subcontractors, subcontr) {
                //store the modified subcontractor
                for (var i = 0; i < subcontractors.length; i++) {
                    if (subcontractors[i].id == subcontr.id) {
                        subcontractors[i] = subcontr;
                        i = subcontractors.length;
                    }
                }
            }
            //add to local db the new tasks added as related to current subcontractor
            angular.forEach(subcontr.newTasks, function(related) {
                //change the assignee for the defect
                var defect = $filter('filter')(proj.defects, {
                    id: related.id
                })[0];
                //remember old assignee and use it to remove the task from his list
                var oldAssignee = $rootScope.backupDefect.assignee_id;
                if (related.assignee_id != oldAssignee) {
                    //remove task from old assignee's list
                    proj.subcontractors = ConvertersService.remove_task_for_subcontractor(related, proj.subcontractors, oldAssignee);
                }
                //call updateDefect
                if (!$rootScope.offlineData) {
                    setReporterId(defect).then(function(succ) {
                        PostService.post({
                            method: 'PUT',
                            url: 'defect',
                            data: ConvertersService.get_defect_for_update(defect)
                        }, function(res) {
                            cnt++;
                            if (cnt >= subcontr.newTasks.length) {
                                subcontr.newTasks = [];
                                replaceSubcontractor(proj.subcontractors, subcontr);
                                prm.resolve();
                            }
                        }, function(err) {
                            cnt++;
                            if (cnt >= subcontr.newTasks.length) {
                                subcontr.newTasks = [];
                                replaceSubcontractor(proj.subcontractors, subcontr);
                                prm.resolve();
                            }
                        })
                    })
                } else {
                    cnt++;
                    if (cnt >= subcontr.newTasks.length) {
                        if (!defect.isNew)
                            defect.isModified = true;
                        subcontr.newTasks = [];
                        replaceSubcontractor(proj.subcontractors, subcontr);
                        proj.isModified = true;
                        prm.resolve();
                    }
                }
            })
            return prm.promise;
        }

        function init() {
            if (!initOnce) {
                initOnce = true;
                SyncService.getProject($rootScope.projId, function(result) {
                    var drawPrm = '',
                        newDefectPrm = '',
                        updDefectPrm = '',
                        subcontrPrm = '',
                        syncPopup = null;

                    //if there are any changes, submit them
                    for (var key in $rootScope) {
                        if (key.indexOf('current') != -1) {
                            if ($rootScope[key] && ($rootScope[key].hasOwnProperty('modified') || $rootScope[key].hasOwnProperty('new'))) {
                                SettingsService.close_all_popups();
                                syncPopup = SettingsService.show_loading_popup("Submitting");
                            }
                        }
                    }

                    //store drawing's changes
                    if ($rootScope.currentDraw && $rootScope.currentDraw.modified) {
                        delete $rootScope.currentDraw.modified;
                        if ($rootScope.offlineData) {
                            storeModifiedDraw(result.value, $rootScope.currentDraw);
                        } else {
                            var syncedDraw = ConvertersService.get_drawing_for_update($rootScope.currentDraw);
                            drawPrm = PostService.post({
                                method: 'PUT',
                                url: 'drawing',
                                data: syncedDraw
                            }, function(res) {
                                delete $rootScope.currentDraw.isModified;
                                storeModifiedDraw(result.value, $rootScope.currentDraw);
                            }, function(err) {
                                $rootScope.offlineData = true;
                                storeModifiedDraw(result.value, $rootScope.currentDraw);
                                result.value.isModified = true;
                            })
                        }
                    }

                    //store new defect
                    if ($rootScope.currentDefect && $rootScope.currentDefect.new) {
                        delete $rootScope.currentDefect.new;
                        if ($rootScope.offlineData) {
                            //set id for local use
                            $rootScope.currentDefect.id = "new" + result.value.defects.length;
                            storeNewDefect(result.value, $rootScope.currentDefect);
                        } else {
                            var newDef = $rootScope.currentDefect,
                                syncedDefect = ConvertersService.get_defect_for_create($rootScope.currentDefect);
                            var addNew = function() {
                                var d = $q.defer();
                                PostService.post({
                                    method: 'POST',
                                    url: 'defect',
                                    data: syncedDefect
                                }, function(res) {
                                    newDef.id = res.data;
                                    delete newDef.isNew;
                                    setReporterId(newDef).then(function(data) {
                                        storeNewDefect(result.value, newDef).then(function(res) {
                                            d.resolve();
                                        })
                                    })
                                }, function(err) {
                                    $rootScope.offlineData = true;
                                    //set id for local use
                                    newDef.id = "new" + result.value.defects.length;
                                    storeNewDefect(result.value, newDef).then(function(res) {
                                        d.resolve();
                                    })
                                })
                                return d.promise;
                            }
                            newDefectPrm = addNew();
                        }
                    }

                    //store defect's changes
                    if ($rootScope.currentDefect && $rootScope.currentDefect.modified) {
                        delete $rootScope.currentDefect.modified;
                        if ($rootScope.offlineData) {
                            storeModifiedDefect(result.value, $rootScope.currentDefect);
                        } else {
                            var syncedDefect = ConvertersService.get_defect_for_update($rootScope.currentDefect);
                            var update = function() {
                                var d = $q.defer();
                                setReporterId(syncedDefect).then(function(succ) {
                                    PostService.post({
                                        method: 'PUT',
                                        url: 'defect',
                                        data: syncedDefect
                                    }, function(res) {
                                        delete $rootScope.currentDefect.isModified;
                                        storeModifiedDefect(result.value, $rootScope.currentDefect).then(function(res) {
                                            d.resolve();
                                        })
                                    }, function(err) {
                                        $rootScope.offlineData = true;
                                        storeModifiedDefect(result.value, $rootScope.currentDefect).then(function(res) {
                                            d.resolve();
                                        })
                                    })
                                })
                                return d.promise;
                            }
                            updDefectPrm = update();
                        }
                    }

                    //store subcontractor's changes
                    if ($rootScope.currentSubcontr && $rootScope.currentSubcontr.modified) {
                        delete $rootScope.currentSubcontr.modified;
                        if ($rootScope.offlineData) {
                            storeModifiedSubcontractor(result.value, $rootScope.currentSubcontr);
                        } else {
                            var updSubcontr = function() {
                                var d = $q.defer();
                                PostService.post({
                                    method: 'PUT',
                                    url: 'subcontractor',
                                    data: $rootScope.currentSubcontr
                                }, function(res) {
                                    delete $rootScope.currentSubcontr.isModified;
                                    storeModifiedSubcontractor(result.value, $rootScope.currentSubcontr).then(function(res) {
                                        d.resolve();
                                    })
                                }, function(error) {
                                    result.value.isModified = true;
                                    $rootScope.offlineData = true;
                                    storeModifiedSubcontractor(result.value, $rootScope.currentSubcontr).then(function(res) {
                                        d.resolve();
                                    })
                                })
                                return d.promise;
                            }
                            subcontrPrm = updSubcontr();
                        }
                    }

                    //only some data is modified in online mode
                    Promise.all([drawPrm, newDefectPrm, updDefectPrm, subcontrPrm]).then(function(res) {
                        if (navigator.onLine && $rootScope.offlineData && syncPopup) {
                            //data needs to be synced
                            $rootScope.offlineData = false;

                            SyncService.syncData().then(function(res) {
                                SyncService.sync().then(function(res) {
                                    $timeout(function() {
                                        syncPopup.close();
                                    }, 10);
                                    if (res.error) {
                                        $timeout(function() {
                                            SettingsService.close_all_popups();
                                            SettingsService.show_message_popup(res.error, res.message);
                                        }, 10)
                                    }
                                    $rootScope.go('app.projects');
                                }, function(reason) {
                                    $timeout(function() {
                                        syncPopup.close();
                                    }, 10);
                                    $timeout(function() {
                                        SettingsService.close_all_popups();
                                        SettingsService.show_message_popup("Error", reason);
                                    }, 100);
                                })
                            }, function(reason) {
                                $timeout(function() {
                                    syncPopup.close();
                                }, 10);
                                $timeout(function() {
                                    SettingsService.close_all_popups();
                                    SettingsService.show_message_popup("Error", reason);
                                }, 100);
                            })
                        } else {
                            if (syncPopup) {
                                $timeout(function() {
                                    syncPopup.close();
                                }, 10);
                                if ($rootScope.offlineData)
                                    $timeout(function() {
                                        SettingsService.close_all_popups();
                                        SettingsService.show_message_popup("You are offline", "Sync when online to update data to server.");
                                    }, 10);
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
                        }
                    })
                })
            }
        }

        function reload() {
            vm.settings.loaded = false;
            vm.list = [];
            switch ($rootScope.currentTab) {
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
                            subcontr.name = subcontr.first_name + " " + subcontr.last_name;
                            subcontr.description = subcontr.company;
                            subcontr.icon = SettingsService.get_initials(subcontr.name);
                            subcontr.backgroundColor = colorList[colorId].backColor;
                            subcontr.foregroundColor = colorList[colorId].foreColor;
                            subcontr.nr_of_defects = subcontr.completed_tasks + subcontr.contested_tasks + subcontr.delayed_tasks + subcontr.incomplete_tasks + subcontr.partially_completed_tasks + subcontr.closed_out_tasks;
                            vm.list.push(subcontr);
                        });
                    })
                    vm.settings.loaded = true;
                    break;
                case 'defects':
                    vm.list = orderBy($rootScope.defects, 'date', true);
                    vm.settings.loaded = true;
                    break;
            }
        }

        function tabSelect(predicate) {
            angular.forEach(vm.settings.tabs, function(value, key) {
                vm.settings.tabs[key] = 'img/new/' + key + '.png';
            });
            vm.settings.tabs[predicate] = vm.settings.tabs[predicate].substr(0, vm.settings.tabs[predicate].lastIndexOf(".png")) + "_active" + vm.settings.tabs[predicate].substr(vm.settings.tabs[predicate].lastIndexOf(".png"));
            $rootScope.currentTab = predicate;
            SettingsService.set_settings(vm.settings);
            //no updates were made, so just reload data
            vm.reload();
        }

        function goItem(item) {
            switch ($rootScope.currentTab) {
                case 'defects':
                    //copy all attachments into pictures field
                    if (item.photos && !item.photos.pictures)
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
            $rootScope.go('app.' + $rootScope.currentTab, {
                id: item.id
            })
        }

        function go(predicate, item) {
            $rootScope.go('app.' + predicate, {
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
                        var popup = SettingsService.show_loading_popup("Inviting subcontractor");
                        PostService.post({
                            method: 'POST',
                            url: 'invite/subcontractor',
                            params: {
                                email: res,
                                projectId: $rootScope.projId
                            }
                        }, function(succ) {
                            $timeout(function() {
                                popup.close();
                            }, 10);
                            $timeout(function() {
                                SettingsService.show_message_popup('Success', 'Subcontractor invited');

                            }, 10);
                        }, function(err) {
                            $timeout(function() {
                                popup.close();
                            }, 10);
                            if (err.data.status == 422)
                                $timeout(function() {
                                    SettingsService.show_message_popup('Error', 'User with email ' + res + ' already exists.');
                                }, 10);
                        })
                    }
                }, function(err) {
                    console.log('Err:', err);
                }, function(msg) {
                    console.log('message:', msg);
                });
            };
            if ($rootScope.currentTab === 'defects') {
                $rootScope.currentDefect = ConvertersService.getEmptyDefect();
                $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                vm.go('defects', 0);
            };
        }
    }
]);
