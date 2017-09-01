angular.module($APP.name).controller('DefectsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$filter',
    'DefectsService',
    'ConvertersService',
    '$ionicViewSwitcher',
    '$ionicModal',
    '$indexedDB',
    'DrawingsService',
    '$ionicPopup',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $filter, DefectsService, ConvertersService, $ionicViewSwitcher, $ionicModal, $indexedDB, DrawingsService, $ionicPopup) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        $scope.local = {};
        $scope.local.entityId = $stateParams.id;
        localStorage.setObject('ds.fullscreen.back', {
            id: $stateParams.id,
            state: 'app.defects'
        })
        localStorage.removeItem('ds.reloadevent');
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $ionicModal.fromTemplateUrl('templates/defects/_drawings.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        var setPdf = function(url) {
            $timeout(function() {
                PDFJS.getDocument(url).then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
                        var widthToBe = 480;
                        var viewport = page.getViewport(1);
                        var scale = widthToBe / viewport.width;
                        var usedViewport = page.getViewport(scale);
                        var canvas = document.getElementById('defectPreviewCanvas');
                        var context = canvas.getContext('2d');
                        canvas.height = usedViewport.height;
                        canvas.width = usedViewport.width;
                        canvas.onclick = function(event) {}
                        var renderContext = {
                            canvasContext: context,
                            viewport: usedViewport
                        };
                        page.render(renderContext).then(function() {
                            var width = $("#defectPreviewCanvas").width();
                            $scope.perc = width / 12;
                            if ($scope.local.drawing && $scope.local.drawing.markers && $scope.local.drawing.markers.length) {
                                $scope.$apply(function() {
                                    $scope.local.marker = {};
                                    $scope.local.marker.id = $scope.local.drawing.markers[0].id;
                                    $scope.local.marker.x = $scope.local.drawing.markers[0].position_x * ($scope.perc / 100) - 6;
                                    $scope.local.marker.y = $scope.local.drawing.markers[0].position_y * ($scope.perc / 100) - 6;
                                    $scope.local.marker.status = $scope.local.drawing.markers[0].status;
                                })
                            }
                        })
                    });
                });
            });
        }
        var showEmpty = function() {
            $timeout(function() {
                var canvas = document.getElementById('defectPreviewCanvas');
                var ctx = canvas.getContext('2d');
                ctx.font = "14px 'Roboto Condensed'";
                var x = canvas.width / 2;
                ctx.textAlign = "center";
                ctx.fillText("No Drawing Available", x, 80);
            });
        };
        var addDrawing = function() {
            $timeout(function() {
                var canvas = document.getElementById('defectPreviewCanvas');
                var ctx = canvas.getContext('2d');
                ctx.font = "14px 'Roboto Condensed'";
                var x = canvas.width / 2;
                ctx.textAlign = "center";
                ctx.fillText("Click to select a drawing.", x, 80);
                canvas.onclick = function(event) {
                    modalDrawing();
                }
            });
        };
        var modalDrawing = function() {
            $indexedDB.openStore('projects', function(store) {
                store.find($scope.settings.project).then(function(proj) {
                    $scope.local.drawingsLight = proj.light_drawings;
                })
            })
            $scope.modal.show();
        }
        $scope.closePopup = function() {
            $scope.modal.hide();
        };
        $scope.selectDrawing = function(data) {
            $scope.local.drawing = data;
            localStorage.setObject('ds.defect.drawing', data);
            $scope.go('fullscreen', $scope.local.drawing.id);
            $scope.modal.hide();
        }
        $scope.getFullscreen = function() {
            if ($stateParams.id !== "0") {
                $scope.go('fullscreen', $scope.local.data.drawing.id);
            } else {
                $scope.go('fullscreen', $scope.local.drawing.id);
            }
        }

        function newDefect() {
            $rootScope.disableedit = false;
            $rootScope.thiscreate = true;
            if (localStorage.getObject('ds.drawing.defect') && !localStorage.getObject('ds.defect.drawing')) {
                $scope.local.drawing = localStorage.getObject('ds.drawing.defect')
                localStorage.setObject('ds.defect.drawing', $scope.local.drawing)
            } else {
                $scope.local.drawing = localStorage.getObject('ds.defect.drawing');
            }
            if ($scope.local.drawing && $scope.local.drawing.path) {
                setPdf($scope.local.drawing.path)
            } else {
                addDrawing()
            }
            if (!localStorage.getObject('ds.defect.new.data')) {
                $scope.local.data = {};
                $scope.local.data.id = 0;
                $scope.local.data.active = true;
                $scope.local.data.project_id = $scope.settings.project;
                $scope.local.data.defect_id = 0;
                $scope.local.data.related_tasks = [];
                $scope.local.data.due_date = 0;
                $scope.local.data.status_obj = {
                    id: 0,
                    name: 'Incomplete'
                };
                $scope.local.data.severity_obj = {
                    id: 0,
                    name: 'None'
                };
                $scope.local.data.priority_obj = {
                    id: 0,
                    name: 'None'
                };
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject')).then(function(project) {
                        var user = "";
                        if (project.users && project.users.length != 0) {
                            user = $filter('filter')(project.users, {
                                login_name: localStorage.getObject('ds.user') && localStorage.getObject('ds.user').name
                            })[0];
                            if (user) {
                                $scope.local.data.assignee_name = user.first_name + " " + user.last_name;
                                $scope.local.data.assignee_id = user.id;
                            }
                        } else {
                            $scope.local.data.assignee_name = "";
                            $scope.local.data.assignee_id = 0;
                        }
                        localStorage.setObject('ds.defect.new.data', $scope.local.data);
                    })
                })
            } else {
                $scope.local.data = localStorage.getObject('ds.defect.new.data');
            }
            $scope.settings.subHeader = 'New defect'
            localStorage.removeItem('ds.defect.active.data')
        }

        function existingDefect() {
            if ($rootScope.disableedit === undefined) {
                $rootScope.disableedit = true;
            }
            $rootScope.thiscreate = false;
            if (!localStorage.getObject('ds.defect.active.data') || localStorage.getObject('ds.defect.active.data').id !== parseInt($stateParams.id)) {
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject')).then(function(res) {
                        $scope.local.data = ConvertersService.init_defect($filter('filter')(res.defects, {
                            id: $stateParams.id
                        })[0].completeInfo);
                        localStorage.setObject('ds.defect.active.data', $scope.local.data)
                        $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                        if ($scope.local.data.drawing && $scope.local.data.drawing.pdfPath) {
                            $scope.local.data.drawing.path = $scope.local.data.drawing.pdfPath;
                            $scope.local.drawing = $scope.local.data.drawing;
                            localStorage.setObject('ds.defect.drawing', $scope.local.data.drawing);
                            setPdf($scope.local.data.drawing.pdfPath);
                        } else {
                            showEmpty()
                        }
                    })
                })
            } else {
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject')).then(function(res) {
                        $scope.local.data = ConvertersService.init_defect(localStorage.getObject('ds.defect.active.data'));
                        $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                        crtDef = $filter('filter')(res.defects, {
                            id: $scope.local.data.id
                        })[0];
                        crtDef.assignee_name = $scope.local.data.assignee_name;
                        saveChanges(res);
                        if ($scope.local.data.drawing && $scope.local.data.drawing.pdfPath) {
                            $scope.local.data.drawing.path = $scope.local.data.drawing.pdfPath;
                            $scope.local.drawing = localStorage.getObject('ds.defect.drawing');
                            setPdf($scope.local.data.drawing.pdfPath);
                        } else {
                            showEmpty()
                        }
                    })
                })
            }
        }

        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
            localStorage.setObject('ds.defect.backup', $scope.local.data)
        }
        $scope.cancelEdit = function() {
            $scope.local.data = localStorage.getObject('ds.defect.backup')
            localStorage.setObject('ds.defect.active.data', $scope.local.data)
            localStorage.removeItem('ds.defect.backup')
            $rootScope.disableedit = true;
        }

        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            $indexedDB.openStore("projects", function(store) {
                store.find(localStorage.getObject('dsproject')).then(function(project) {
                    var defect = $filter('filter')(project.defects, {
                        id: $scope.local.data.id
                    })[0];
                    var old_assignee_id = defect.completeInfo.assignee_id;
                    defect.completeInfo = ConvertersService.save_defect($scope.local.data);
                    defect.status_name = defect.completeInfo.status_name;
                    defect.priority_name = defect.completeInfo.priority_name;
                    defect.severity_name = defect.completeInfo.severity_name;
                    defect.number_of_photos = defect.completeInfo.number_of_photos;
                    defect.number_of_comments = defect.completeInfo.number_of_comments;
                    defect.title = defect.completeInfo.title;
                    defect.completeInfo.due_date = new Date(defect.completeInfo.due_date).getTime();
                    defect.due_date = defect.completeInfo.due_date;
                    if (typeof defect.isNew == 'undefined')
                        defect.isModified = true;
                    project.isModified = true;

                    //assignee changes
                    if (old_assignee_id != defect.completeInfo.assignee_id) {
                        //remove from old assignee related list
                        var subcontr = $filter('filter')(project.subcontractors, {
                            id: old_assignee_id
                        })[0]
                        if (subcontr) {
                            var rel = $filter('filter')(subcontr.related, {
                                id: defect.id
                            })[0];
                            subcontr.related = $filter('filter')(subcontr.related, {
                                id: ('!' + rel.id)
                            });
                            ConvertersService.decrease_nr_tasks(subcontr, defect.status_name);
                        }
                        //add to new assignee related list
                        var newSubcontr = $filter('filter')(project.subcontractors, {
                            id: defect.completeInfo.assignee_id
                        })[0];
                        if (newSubcontr) {
                            newSubcontr.related.push(defect.completeInfo);
                            ConvertersService.increase_nr_tasks(newSubcontr, defect.status_name);
                        } else {
                            var assignee = $filter('filter')(project.users, {
                                id: defect.completeInfo.assignee_id
                            })[0];
                            defect.assignee_name = assignee.first_name + " " + assignee.last_name;
                        }
                    } else {
                        var subcontr = $filter('filter')(project.subcontractors, {
                            id: defect.completeInfo.assignee_id
                        })[0];
                        if (subcontr) {
                            subcontr.related = $filter('filter')(subcontr.related, {
                                id: ('!' + defect.id)
                            });
                            subcontr.related.push(defect.completeInfo);
                        }
                    }
                    if (defect.completeInfo.drawing) {
                        var drawForDefect = $filter('filter')(project.drawings, {
                            id: defect.completeInfo.drawing.id
                        })[0];
                        if (drawForDefect) {
                            if (drawForDefect.markers && drawForDefect.markers.length != 0) {
                                $filter('filter')(drawForDefect.markers, {
                                    defect_id: defect.id
                                })[0].status = defect.completeInfo.drawing.markers[0].status;
                            }
                            if (drawForDefect.relatedDefects && drawForDefect.relatedDefects.length != 0) {
                                var relDefect = $filter('filter')(drawForDefect.relatedDefects, {
                                    id: defect.id
                                })[0];
                                relDefect.assignee_name = defect.assignee_name;
                                relDefect.date = defect.date;
                                relDefect.due_date = defect.due_date;
                                relDefect.number_of_comments = defect.number_of_comments;
                                relDefect.number_of_photos = defect.number_of_photos;
                                relDefect.priority_name = defect.priority_name;
                                relDefect.severity_name = defect.severity_name;
                                relDefect.status_name = defect.status_name;
                                relDefect.title = defect.title;
                            }
                        }
                        localStorage.setObject('dsdrwact', drawForDefect);
                    }
                    saveChanges(project);
                    localStorage.setObject('ds.defect.active.data', $scope.local.data)
                    localStorage.removeItem('ds.defect.backup')
                    localStorage.setObject('ds.reloadevent', {
                        value: true
                    });
                })
            })
        }
        $scope.saveCreate = function() {
            //$scope.local.drawing && $scope.local.drawing.markers && $scope.local.drawing.markers.length &&
            if ($scope.local.data.title) {
                $rootScope.disableedit = true;
                var nextId = 0;
                $indexedDB.openStore("projects", function(store) {
                    store.getAll().then(function(res) {
                        angular.forEach(res, function(proj) {
                            angular.forEach(proj.defects, function(defect) {
                                if (defect.id > nextId)
                                    nextId = defect.id;
                            })
                        })
                    })
                })
                $indexedDB.openStore("projects", function(store) {
                    store.find(localStorage.getObject('dsproject')).then(function(project) {
                        var newDef = ConvertersService.save_defect($scope.local.data);
                        newDef.id = nextId + 1;
                        var localStorredDef = {};
                        localStorredDef.isNew = true;
                        localStorredDef.assignee_name = newDef.assignee_name;
                        localStorredDef.attachements = [];
                        localStorredDef.comments = [];
                        localStorredDef.id = newDef.id;
                        localStorredDef.number_of_comments = 0;
                        localStorredDef.number_of_photos = 0;
                        newDef.due_date = new Date(newDef.due_date).getTime();
                        localStorredDef.due_date = newDef.due_date;
                        localStorredDef.priority_name = newDef.priority_name;
                        localStorredDef.severity_name = newDef.severity_name;
                        localStorredDef.status_name = newDef.status_name;
                        localStorredDef.title = newDef.title;
                        localStorredDef.completeInfo = newDef;
                        var subcontr = $filter('filter')(project.subcontractors, {
                            id: newDef.assignee_id
                        })[0];
                        if (subcontr) {
                            subcontr.related.push(newDef);
                            ConvertersService.increase_nr_tasks(subcontr, newDef.status_name);
                        }
                        localStorage.setObject('ds.defect.active.data', ConvertersService.clear_id($scope.local.data));
                        localStorage.removeItem('ds.defect.backup');
                        //drawing added for defect
                        if ($scope.local.drawing) {
                            var drawing = $filter('filter')(project.drawings, {
                                id: $scope.local.drawing.id
                            })[0];
                            drawing.nr_of_defects++;
                            var aux = {};
                            if ($scope.local.drawing.markers && $scope.local.drawing.markers.length) {
                                aux = angular.copy($scope.local.drawing.markers[0])
                                aux.defect_id = nextId + 1;
                                aux.drawing_id = $scope.local.drawing.id;
                                aux.position_x = aux.xInit;
                                aux.position_y = aux.yInit;
                                drawing.markers.push(aux);
                                aux.status = localStorredDef.status_name;
                            }

                            localStorredDef.draw = drawing;
                            localStorredDef.completeInfo.drawing = ConvertersService.save_local(drawing);
                            if ($scope.local.drawing.markers) {
                                localStorredDef.completeInfo.drawing.markers.push(aux);
                            }
                            //add defect in the related defects list of the corresponding drawing
                            var drawForDefect = $filter('filter')(project.drawings, {
                                id: localStorredDef.draw.id
                            })[0];
                            if (drawForDefect) {
                                var relDefect = {};
                                relDefect.id = localStorredDef.id;
                                relDefect.assignee_name = localStorredDef.assignee_name;
                                relDefect.date = localStorredDef.date;
                                relDefect.due_date = localStorredDef.due_date;
                                relDefect.number_of_comments = 0;
                                relDefect.number_of_photos = 0;
                                relDefect.priority_name = localStorredDef.priority_name;
                                relDefect.severity_name = localStorredDef.severity_name;
                                relDefect.status_name = localStorredDef.status_name;
                                relDefect.title = localStorredDef.title;
                                drawForDefect.relatedDefects.push(relDefect);
                            }
                        }
                        project.defects.push(localStorredDef);
                        project.isModified = true;
                        saveChanges(project);
                        localStorage.removeItem('dsdrwact');
                        localStorage.setObject('ds.reloadevent', {
                            value: true
                        });
                        $scope.back();
                    })
                })
            } else {
                var alertPopup = $ionicPopup.show({
                    title: 'Error',
                    template: 'Make sure you have for your new defect a title.',
                    buttons: [{
                        text: 'Ok',
                    }]
                });
                alertPopup.then(function(res) {});
            }
        }

        function saveChanges(project) {
            $indexedDB.openStore('projects', function(store) {
                store.upsert(project).then(
                    function(e) {
                        store.find(localStorage.getObject('dsproject')).then(function(project) {})
                    },
                    function(e) {
                        var offlinePopup = $ionicPopup.alert({
                            title: "Unexpected error",
                            template: "<center>An unexpected error has occurred.</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                    })
            })
        }

        if ($stateParams.id === "0") {
            newDefect();
        } else {
            existingDefect()
        }

        $scope.back = function() {
            var routeback = localStorage.getObject('ds.defect.back')
            if ($stateParams.id === '0') {
                localStorage.removeItem('ds.defect.new.data');
            } else {
                localStorage.removeItem('ds.defect.active.data');
            }
            localStorage.removeItem('ds.drawing.defect')
            localStorage.removeItem('ds.defect.drawing');
            $rootScope.disableedit = true;
            $ionicViewSwitcher.nextDirection('back')
            if (routeback) {
                $state.go(routeback.state, {
                    id: routeback.id
                });
            } else {
                $state.go('app.tab')
            }
        }
        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
