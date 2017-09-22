dsApp.controller('DefectsCtrl', [
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
    'DrawingsService',
    '$ionicPopup',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $filter, DefectsService, ConvertersService, $ionicViewSwitcher, $ionicModal, DrawingsService, $ionicPopup) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.project = $rootScope.projId;
        vm.local = {};
        vm.local.entityId = $stateParams.id;
        sessionStorage.setObject('ds.fullscreen.back', {
            id: $stateParams.id,
            state: 'app.defects'
        })
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $ionicModal.fromTemplateUrl('templates/defects/_drawings.html', {
            scope: $scope
        }).then(function(modal) {
            vm.modal = modal;
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
                            vm.perc = width / 12;
                            if (vm.local.drawing && vm.local.drawing.markers && vm.local.drawing.markers.length) {
                                vm.$apply(function() {
                                    vm.local.marker = {};
                                    vm.local.marker.id = vm.local.drawing.markers[0].id;
                                    vm.local.marker.x = vm.local.drawing.markers[0].position_x * (vm.perc / 100) - 6;
                                    vm.local.marker.y = vm.local.drawing.markers[0].position_y * (vm.perc / 100) - 6;
                                    vm.local.marker.status = vm.local.drawing.markers[0].status;
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
                    vm.local.drawingsLight = $rootScope.drawingsLight;
                    vm.modal.show();
                }
            });
        };

        vm.closePopup = function() {
            vm.modal.hide();
        };

        vm.selectDrawing = function(data) {
            vm.local.drawing = data;
            sessionStorage.setObject('ds.defect.drawing', data);
            vm.go('fullscreen', vm.local.drawing.id);
            vm.modal.hide();
        }

        vm.getFullscreen = function() {
            if ($stateParams.id !== "0") {
                vm.go('fullscreen', vm.defect.drawing.id);
            } else {
                vm.go('fullscreen', vm.local.drawing.id);
            }
        }

        function newDefect() {
            $rootScope.disableedit = false;
            $rootScope.thiscreate = true;
            if (vm.local.drawing && vm.local.drawing.pdfPath) {
                setPdf(vm.local.drawing.pdfPath)
            } else {
                addDrawing()
            }
            vm.defect = $rootScope.currentDefect;
            vm.settings.subHeader = 'New defect'
        }

        function existingDefect() {
            //it is a related defect
            if ($rootScope.disableedit === undefined) {
                $rootScope.disableedit = true;
            }
            $rootScope.thiscreate = false;
            vm.defect = ConvertersService.init_defect($rootScope.currentDefect);
            vm.settings.subHeader = 'Defect - ' + vm.defect.title;

            if (vm.defect.drawing) {
                vm.defect.drawing.pdfPath = vm.defect.drawing.pdfPath || ($APP.server + '/pub/drawings/' + vm.defect.drawing.base64String);
                vm.local.drawing = vm.defect.drawing;
                setPdf(vm.defect.drawing.pdfPath);
            } else {
                showEmpty()
            }
        }

        vm.toggleEdit = function() {
            $rootScope.disableedit = false;
        }
        vm.cancelEdit = function() {
            $rootScope.currentDefect = angular.copy($rootScope.backupDefect);
            $rootScope.disableedit = true;
        }

        if ($stateParams.id === "0") {
            newDefect();
        } else {
            existingDefect()
        }

        vm.saveEdit = function() {
            $rootScope.disableedit = true;
            $rootScope.currentDefect.isModified = true;
            //keep old assignee
            // var old_assignee_id = vm.defect.assignee_id;
            //set status, priority, severity fields from objects
            // vm.defect.due_date = new Date(defect.completeInfo.due_date).getTime();
            // defect.due_date = defect.completeInfo.due_date;
            // if (typeof defect.isNew == 'undefined')
            //     defect.isModified = true;
            // project.isModified = true;
            vm.go('tab');
        }

        vm.saveCreate = function() {
            if (vm.defect.title) {
                $rootScope.disableedit = true;
                $rootScope.currentDefect.isNew = true;
                vm.back();

                // newDef.id = nextId + 1;
                // var localStorredDef = {};
                // localStorredDef.isNew = true;
                // localStorredDef.assignee_name = newDef.assignee_name;
                // localStorredDef.attachements = [];
                // localStorredDef.comments = [];
                // localStorredDef.id = newDef.id;
                // localStorredDef.number_of_comments = 0;
                // localStorredDef.number_of_photos = 0;
                // newDef.due_date = new Date(newDef.due_date).getTime();
                // localStorredDef.due_date = newDef.due_date;
                // localStorredDef.priority_name = newDef.priority_name;
                // localStorredDef.severity_name = newDef.severity_name;
                // localStorredDef.status_name = newDef.status_name;
                // localStorredDef.title = newDef.title;
                // localStorredDef.completeInfo = newDef;

                // sessionStorage.setObject('ds.defect.active.data', ConvertersService.clear_id(vm.defect));
                // project.isModified = true;

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

        vm.back = function() {
            $rootScope.disableedit = true;
            $ionicViewSwitcher.nextDirection('back')
            if ($rootScope.routeback) {
                $state.go($rootScope.routeback.state, {
                    id: $rootScope.routeback.id
                });
            } else {
                $state.go('app.tab')
            }
        }
        vm.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
