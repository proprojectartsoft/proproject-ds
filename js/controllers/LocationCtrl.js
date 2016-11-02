angular.module($APP.name).controller('LocationCtrl', [
    '$rootScope', '$scope', 'createDialog', 'DrawingsService', '$stateParams', 'SettingsService', '$state', 'SweetAlert', '$timeout',
    function ($rootScope, $scope, createDialog, DrawingsService, $stateParams, SettingsService, $state, SweetAlert, $timeout) {
        $rootScope.pointList = [];
        $scope.addingMarker = false;
        $rootScope.currentDrawing = $stateParams.id;
        $scope.filter.markerFilter = 0;
        $scope.inactiveList = [];
        $scope.initialPoints = [];
        var index = 2;
        $scope.widthMap = [{
                zoom: 60,
                value: 720
            }, {
                zoom: 80,
                value: 960
            }, {
                zoom: 100,
                value: 1200
            }, {
                zoom: 120,
                value: 1440
            }, {
                zoom: 160,
                value: 1920
            }, {
                zoom: 200,
                value: 2400
            }];
        $scope.index = $scope.widthMap[index].zoom;
        var renderPoints = function (index) {
            angular.forEach($rootScope.pointList, function (point) {
                point.x = ($scope.widthMap[index].zoom / 100) * point.xInit;
                point.y = ($scope.widthMap[index].zoom / 100) * point.yInit;
            });
        };
        var renderIt = function (pdfFile, mapIndex) {
            $scope.rendering = true;
            pdfFile.getPage(1).then(function (page) {

                $scope.viewport = page.getViewport(1);
                var scale = $scope.widthMap[mapIndex].value / $scope.viewport.width;
                $scope.firstViewport = page.getViewport(scale);
                $scope.viewport = angular.copy($scope.firstViewport);

                canvas.height = $scope.viewport.height;
                canvas.width = $scope.viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: $scope.viewport
                };
                page.render(renderContext).promise.then(function () {
                    renderPoints(mapIndex);
                    $scope.rendering = false;
                });
            });
        };
        $scope.allMarkers = function () {
            $scope.filter.markerFilter = 1;
            $rootScope.pointList = $scope.inactiveList;
            renderPoints(index);
        }
        $scope.activeMarkers = function () {
            $scope.filter.markerFilter = 0;
            $rootScope.pointList = $scope.initialPoints;
            console.log($scope.initialPoints);
            renderPoints(index);
        }
        $scope.statusMarkers = function (stat) {
            $rootScope.pointList = [];
            $rootScope.statusList = [];
            $scope.filter.markerFilter = 0;
            angular.forEach($scope.initialPoints, function (aux) {
                $rootScope.pointList = [];
                if (aux.status === stat) {
                    var auxPoint = {                
                        xInit: aux.xInit,
                        yInit: aux.yInit,
                        defect_id: aux.defect_id,
                        drawing_id: aux.drawing_id,
                        id: aux.id,
                        status: aux.status
                    };              
                    $rootScope.statusList.push(auxPoint);
                    renderPoints(index);                                 
                }
            });
            $rootScope.pointList = $rootScope.statusList;
            renderPoints(index);
        }
        DrawingsService.get_id_list($rootScope.project.id).then(function (result) {
            for (i = 0; i < result.length; i++) {
                if (result[i].id == $stateParams.id) {
                    if (i < result.length - 1) {
                        $rootScope.nextDrawing = result[i + 1].id;
                        if (i > 0) {
                            $rootScope.previousDrawing = result[i - 1].id;
                        } else {
                            $rootScope.previousDrawing = 0;
                        }
                    } else {
                        $rootScope.nextDrawing = 0;
                        if (i > 0) {
                            $rootScope.previousDrawing = result[i - 1].id;
                        } else {
                            $rootScope.previousDrawing = 0;
                        }
                    }
                }
            }
        });
        DrawingsService.get_inactive($stateParams.id).then(function (result) {
            angular.forEach(result.markers, function (markerResult) {
                if (markerResult.position_x && markerResult.position_y) {
                    var auxPoint = {
                        xInit: markerResult.position_x,
                        yInit: markerResult.position_y,
                        defect_id: markerResult.defect_id,
                        drawing_id: markerResult.drawing_id,
                        id: markerResult.id,
                        status: markerResult.status
                    };
                    $scope.inactiveList.push(auxPoint);
                }
            });
        });
        DrawingsService.get_original($stateParams.id).then(function (result) {
            $scope.test = result;
            $rootScope.drawingHelper = result;
            angular.forEach(result.markers, function (markerResult) {
                if (markerResult.position_x && markerResult.position_y) {
                    var auxPoint = {
                        xInit: markerResult.position_x,
                        yInit: markerResult.position_y,
                        defect_id: markerResult.defect_id,
                        drawing_id: markerResult.drawing_id,
                        id: markerResult.id,
                        status: markerResult.status
                    };
                    $scope.initialPoints.push(auxPoint);
                }
                console.log(markerResult);
            });
            $rootScope.pointList = $scope.initialPoints;
            console.log($rootScope.pointList)
            PDFJS.disableStream = true;
            $scope.url = $APP.server + '/pub/drawings/' + $rootScope.drawingHelper.base64String;
            renderPoints(2);
            PDFJS.getDocument($scope.url).then(function (pdf) {
                $rootScope.pdfFile = pdf;
                renderIt(pdf, index);
            });
            $timeout(function () {
                renderPoints(2);
            }, 500);
        });
        /// START PDF WORK
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');

        $scope.firstTime = 0;
        $scope.zoom = function () {
            if (index === 4) {
                index++;
                $scope.disableZoomIn = true;
                $scope.disableZoomOut = false;
            } else {
                index++;
                $scope.disableZoomIn = false;
                $scope.disableZoomOut = false;
            }
            $scope.index = $scope.widthMap[index].zoom;
            renderIt($rootScope.pdfFile, index);
            renderPoints(index);
        };
        $scope.fit = function () {
            if (index === 1 && !$scope.disableZoomOut) {
                index--;
                $scope.disableZoomOut = true;
                $scope.disableZoomIn = false;
            } else {
                index--;
                $scope.disableZoomOut = false;
                $scope.disableZoomIn = false;
            }
            $scope.index = $scope.widthMap[index].zoom;
            renderIt($rootScope.pdfFile, index);
            renderPoints(index);
        };
        var renderIt = function (pdfFile, mapIndex) {
            $scope.rendering = true;
            pdfFile.getPage(1).then(function (page) {

                $scope.viewport = page.getViewport(1);
                var scale = $scope.widthMap[mapIndex].value / $scope.viewport.width;
                $scope.firstViewport = page.getViewport(scale);
                $scope.viewport = angular.copy($scope.firstViewport);

                canvas.height = $scope.viewport.height;
                canvas.width = $scope.viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: $scope.viewport
                };
                page.render(renderContext).promise.then(function () {
                    renderPoints(mapIndex);
                    $scope.rendering = false;
                });
            });
        };
        $rootScope.$watch('saving', function (value) {

            if (value && (value.saved === false)) {
                $scope.isToggle = false;
                $rootScope.pointList.pop();
            }
        });
        $rootScope.$watch('isFullscreen', function (value) {
            if (value === false) {
                $timeout(function () {
                    renderPoints(2);
                }, 250);
            }
        })
        $scope.addMarker = function () {
            $scope.addingMarker = !$scope.addingMarker;
            if ($scope.addingMarker) {
                $('.page').css('cursor', 'url(img/incomplete.png),auto');
            } else {
                $('.page').css('cursor', 'auto');
            }
        };
        canvas.onclick = function (event) {
            if ($scope.addingMarker) {
                $scope.addingMarker = false;
                $('.page').css('cursor', 'auto');

                if (!$scope.isToggle) {
                    $scope.isToggle = true;
                    $scope.toggleNewTask(null, null, true);
                    if (index !== 2) {
                        var x = (Math.floor(event.offsetX) / $scope.widthMap[index].zoom) * 100 + 6 + (8 - index);
                        var y = (Math.floor(event.offsetY) / $scope.widthMap[index].zoom) * 100 + 6 + (8 - index);
                        $rootScope.pointList.push({xInit: x, yInit: y});
                        renderPoints(index);
                    } else {
                        var x = Math.floor(event.offsetX) + 15;
                        var y = Math.floor(event.offsetY) + 15;
                        $rootScope.pointList.push({xInit: x, yInit: y});
                        renderPoints(index);

                    }
                    $rootScope.currentMarker = {
                        x: x,
                        y: y
                    };
                } else {
                    $scope.toggleNewTask();
                    $scope.isToggle = false;
                    $rootScope.pointList.pop();
                }
            }
        };


        renderPoints(0);
        /// END OF PDF WORK
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $scope.filter = {};
        $scope.filter.state = 'related';
        $scope.setloc = false;
        SettingsService.init_settings();

        DrawingsService.get_original($stateParams.id).then(function (result) {
            $scope.test = result;
            $rootScope.drawingHelper = result;
            $rootScope.pointers = result.markers;
        });
        $scope.deleteDrawing = function (toBeDeleted) {
            SweetAlert.swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false},
                    function (isConfirm) {
                        if (isConfirm) {

                            DrawingsService.delete(toBeDeleted).then(function (result) {
                                $state.go('app.drawings');
                                SweetAlert.swal({title: "Done!", type: "success"});
                            });
                        }
                        ;
                    });

        };
        $scope.editDrawing = function (item) {
            $rootScope.editDrawing = item;
            createDialog('templates/_edit_drawing.html', {
                id: 'complexDialog',
                backdrop: true,
                controller: '_EditDrawingCtrl',
                modalClass: 'modal de-drawings-edit',
                success: {label: 'Success', fn: function () {
                    }}
            }, {
                title: 'Edit Drawing'
            });
        };
        $scope.toggleFullscreen = function () {
            $('body').css('cursor', 'auto');
            $scope.dial = {
                'predicate': 'predicate'
            };
        };
        $scope.toggleNewTask = function (aux, list, location) {
            $rootScope.defectcolor = 'Incomplete';
            $scope.dialcreate = {
                target: aux,
                list: list,
                location: location
            };
        };
        $rootScope.$watch('defectcolor', function (newVal) {
            if ($rootScope.pointList.length) {
                $rootScope.pointList[ $rootScope.pointList.length - 1].status = newVal;
            }
        });

        $scope.goDrawing = function (id, defect) {
            $('body').css('cursor', 'auto');
            $state.go('app.drawing', {'id': id, 'defect': defect});
        };
    }
]);