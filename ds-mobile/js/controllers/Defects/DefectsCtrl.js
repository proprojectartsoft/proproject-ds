angular.module($APP.name).controller('DefectsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'DefectsService',
    'ConvertersService',
    '$ionicViewSwitcher',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, DefectsService, ConvertersService, $ionicViewSwitcher) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.projectId = localStorage.getObject('dsproject');
        $scope.local = {};
        $scope.local.entityId = $stateParams.id;



        var setPdf = function(base64String) {
            $timeout(function() {
                var url = $APP.server + '/pub/drawings/' + base64String;
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
                        var renderContext = {
                            canvasContext: context,
                            viewport: usedViewport
                        };
                        page.render(renderContext).then(function() {
                            var width = $("#defectPreviewCanvas").width();
                            $scope.perc = width / 12;
                            if ($scope.local.data && $scope.local.data.drawing.markers) {
                                $scope.marker = {};
                                $scope.marker.x = $scope.local.data.drawing.markers[0].position_x * ($scope.perc / 100) - 6;
                                $scope.marker.y = $scope.local.data.drawing.markers[0].position_y * ($scope.perc / 100) - 6;
                                $scope.marker.status = $scope.local.data.drawing.markers[0].status;
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
                var x = canvas.width/2;
                ctx.textAlign = "center";
                ctx.fillText("No Drawing Available", x, 80);
            });
        };

        if ($stateParams.id !== "0") {
            if ($rootScope.disableedit === undefined) {
                $rootScope.disableedit = true;
            }
            $rootScope.thiscreate = false;
            if (!localStorage.getObject('ds.defect.active.data') || localStorage.getObject('ds.defect.active.data').id !== parseInt($stateParams.id)) {

                DefectsService.get($stateParams.id).then(function(result) {
                    $scope.local.data = ConvertersService.init_defect(result);
                    localStorage.setObject('ds.defect.active.data', $scope.local.data)
                    $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                    if ($scope.local.data.drawing && $scope.local.data.drawing.base64String) {
                        setPdf($scope.local.data.drawing.base64String)
                    } else {
                        showEmpty()
                    }
                })
            } else {
                $scope.local.data = ConvertersService.init_defect(localStorage.getObject('ds.defect.active.data'));
                $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                if ($scope.local.data.drawing && $scope.local.data.drawing.base64String) {
                    setPdf($scope.local.data.drawing.base64String)
                } else {
                    showEmpty()
                }
            }
        } else {
            $rootScope.disableedit = false;
            $rootScope.thiscreate = true;
            if (!localStorage.getObject('ds.defect.new.data')) {
                $scope.local.data = {};
                $scope.local.data.id = 0;
                $scope.local.data.active = true;
                $scope.local.data.project_id = $scope.settings.projectId;
                $scope.local.data.defect_id = 0;
                $scope.local.data.related_tasks = [];
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
                localStorage.setObject('ds.defect.new.data', $scope.local.data)
            } else {
                $scope.local.data = localStorage.getObject('ds.defect.new.data');
            }

            $scope.settings.subHeader = 'New defect'
            localStorage.removeItem('ds.defect.active.data')
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
            DefectsService.update($scope.local.data).then(function(result) {
                localStorage.setObject('ds.defect.active.data', $scope.local.data)
                localStorage.removeItem('ds.defect.backup')
            })
        }
        $scope.saveCreate = function() {
            $rootScope.disableedit = true;
            DefectsService.create($scope.local.data).then(function(result) {
                localStorage.setObject('ds.defect.active.data', $scope.local.data)
                localStorage.removeItem('ds.defect.backup')
            })
        }


        $scope.back = function() {
            var routeback = localStorage.getObject('ds.defect.back')
            if ($stateParams.id === '0') {
                localStorage.removeItem('ds.defect.new.data');
            } else {
                localStorage.removeItem('ds.defect.active.data');
            }
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
