dsApp.controller('DefectsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'ConvertersService',
    '$ionicViewSwitcher',
    '$ionicModal',
    '$ionicPopup',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, ConvertersService, $ionicViewSwitcher, $ionicModal, $ionicPopup) {
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
                            if (vm.defect.drawing && vm.defect.drawing.markers && vm.defect.drawing.markers.length) {
                                $scope.$apply(function() {
                                    vm.local.marker = {};
                                    vm.local.marker.id = vm.defect.drawing.markers[0].id;
                                    vm.local.marker.x = vm.defect.drawing.markers[0].position_x * (vm.perc / 100) - 6;
                                    vm.local.marker.y = vm.defect.drawing.markers[0].position_y * (vm.perc / 100) - 6;
                                    vm.local.marker.status = vm.defect.drawing.markers[0].status;
                                })
                            }
                        })
                    });
                });
            }, 100);
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
            $rootScope.currentDraw = data;
            vm.defect.drawing = $rootScope.currentDraw;
            vm.go('fullscreen', vm.defect.drawing.id);
            vm.modal.hide();
        }

        vm.getFullscreen = function() {
            // $rootScope.currentDraw = vm.defect.drawing;
            vm.go('fullscreen', vm.defect.drawing.id);
        }

        function newDefect() {
            $rootScope.disableedit = false;
            $rootScope.thiscreate = true;
            vm.defect = $rootScope.currentDefect;
            if (vm.defect && vm.defect.drawing) {
                setPdf(vm.defect.drawing.pdfPath || ($APP.server + '/pub/drawings/' + vm.defect.drawing.base64String))
            } else {
                addDrawing()
            }
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
            $rootScope.currentDefect.modified = true;
            vm.go('tab');
        }

        vm.saveCreate = function() {
            if (vm.defect.title) {
                $rootScope.disableedit = true;
                $rootScope.currentDefect.isNew = true;
                $rootScope.currentDefect.new = true;
                vm.back();
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
            $ionicViewSwitcher.nextDirection('back');
            $state.go('app.tab');
        }

        vm.go = function(predicate, item) {
            if (predicate == 'fullscreen')
                $rootScope.currentDraw = $rootScope.currentDefect.drawing;
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
