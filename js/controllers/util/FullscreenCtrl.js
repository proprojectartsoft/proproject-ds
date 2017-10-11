dsApp.controller('FullscreenCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'ConvertersService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, ConvertersService) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = $rootScope.currentTab;
        $scope.local = {};
        $scope.local.markers = [];
        $scope.disableZoomOut = true;
        $scope.addingMarker = false;

        var index = 0,
            hasMarker = false;
        $scope.width = $("#canvasCointainer").width();
        $scope.index = 720;

        $scope.local.troll = {
            'z-index': 10
        }

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

        //rotate screen
        screen.orientation.addEventListener('change', function() {});
        screen.orientation.unlock();
        var perc = $scope.width / 12;

        var renderPoints = function(index, pinched) {
            $timeout(function() {
                $scope.$apply(function() {
                    if (pinched) {
                        angular.forEach($scope.local.markers, function(point) {
                            point.x = index / 100 * point.xInit;
                            point.y = index / 100 * point.yInit;
                            point.z = 5
                        });
                    } else {
                        angular.forEach($scope.local.markers, function(point) {
                            point.x = ($scope.widthMap[index].zoom / 100) * point.xInit;
                            point.y = ($scope.widthMap[index].zoom / 100) * point.yInit;
                            point.z = 5
                        });
                    }
                })
            })
        };

        var setPdf = function(url) {
            $timeout(function() {
                PDFJS.getDocument(url).then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
                        var widthToBe = 1200;
                        var viewport = page.getViewport(1);
                        var scale = widthToBe / viewport.width;
                        var usedViewport = page.getViewport(scale);
                        var canvas = document.getElementById('fullPreviewCanvas');
                        var context = canvas.getContext('2d');
                        canvas.height = usedViewport.height;
                        canvas.width = usedViewport.width;
                        canvas.onclick = function(event) {
                            if ($scope.addingMarker) {
                                hasMarker = true;
                                $scope.addingMarker = false;
                                var newstatus = 'Incomplete';
                                var img = 'img/incomplete.png';
                                if ($rootScope.currentDraw) {
                                    generateDefectImg('Incomplete');
                                }
                                if (index !== 2) {
                                    var x = (Math.floor(event.offsetX) / $scope.widthMap[index].zoom) * 100 - 6 - (5 - index);
                                    var y = (Math.floor(event.offsetY) / $scope.widthMap[index].zoom) * 100 - 6 - (5 - index);
                                    var newMarker = {
                                        id: 0,
                                        xInit: x,
                                        yInit: y,
                                        position_x: x,
                                        position_y: y,
                                        drawing_id: parseInt($stateParams.id),
                                        status: newstatus,
                                        img: img
                                    }
                                    if ($scope.local.singleMarker) {
                                        $scope.local.markers = [];
                                        $scope.local.markers.push(newMarker);
                                        //set the current drawing as drawing for the new defect
                                        $rootScope.currentDefect.drawing = angular.copy($scope.local.data);
                                        //keep only the marker of the new defect
                                        $rootScope.currentDefect.drawing.markers = [newMarker];
                                    } else {
                                        //add new defect for the current drawing
                                        $rootScope.currentDefect = ConvertersService.getEmptyDefect();
                                        //set the current drawing as drawing for the new defect
                                        $rootScope.currentDefect.drawing = angular.copy($scope.local.data);
                                        //keep only the marker of the new defect
                                        $rootScope.currentDefect.drawing.markers = [newMarker];
                                        $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                                    }
                                    $rootScope.go('app.defects', {
                                        id: 0
                                    })
                                    renderPoints(index, false);
                                } else {
                                    var x = Math.floor(event.offsetX) - 6;
                                    var y = Math.floor(event.offsetY) - 6;
                                    var newMarker = {
                                        id: 0,
                                        xInit: x,
                                        yInit: y,
                                        position_x: x,
                                        position_y: y,
                                        drawing_id: parseInt($stateParams.id),
                                        status: newstatus,
                                        img: img
                                    }
                                    if ($scope.local.singleMarker) {
                                        $scope.local.markers = [];
                                        $scope.local.markers.push(newMarker);

                                    } else {
                                        //add new defect for the current drawing
                                        $rootScope.currentDefect = ConvertersService.getEmptyDefect();
                                        $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                                        //set the current drawing as drawing for the new defect
                                        $rootScope.currentDefect.drawing = angular.copy($scope.local.data);
                                        //keep only the marker of the new defect
                                        $rootScope.currentDefect.drawing.markers = [newMarker];
                                    }
                                    $rootScope.go('app.defects', {
                                        id: 0
                                    })
                                    renderPoints(index, false);
                                }
                            }
                        }
                        var renderContext = {
                            canvasContext: context,
                            viewport: usedViewport
                        };
                        page.render(renderContext).then(function() {
                            $timeout(function() {
                                $scope.local.markers = [];
                                angular.forEach($scope.local.data.markers, function(markerResult) {
                                    if (!(markerResult.position_x === 0 && markerResult.position_y === 0)) {
                                        var img = '';
                                        switch (markerResult.status) {
                                            case 'Incomplete':
                                                img = 'img/incomplete.png'
                                                break;
                                            case 'Completed':
                                                img = 'img/completed.png'
                                                break;
                                            case 'Contested':
                                                img = 'img/contested.png'
                                                break;
                                            case 'Delayed':
                                                img = 'img/delayed.png'
                                                break;
                                            case 'Closed Out':
                                                img = 'img/closed_out.png'
                                                break;
                                            case 'Partially Completed':
                                                img = 'img/partially_completed.png'
                                                break;
                                        }
                                        var auxPoint = {
                                            xInit: markerResult.position_x,
                                            yInit: markerResult.position_y,
                                            position_x: markerResult.position_x,
                                            position_y: markerResult.position_y,
                                            x: markerResult.position_x * (60 / 100) - 6,
                                            y: markerResult.position_y * (60 / 100) - 6,
                                            defect_id: markerResult.defect_id,
                                            drawing_id: markerResult.drawing_id,
                                            id: markerResult.id,
                                            status: markerResult.status,
                                            img: img,
                                            z: 99
                                        };
                                        $scope.local.markers.push(auxPoint);
                                    }
                                });
                                renderPoints(index, false);
                                // loaded();
                            });
                        })
                    });
                });
            });
        }

        $scope.local.data = $rootScope.currentDraw;
        setPdf($scope.local.data.pdfPath || ($APP.server + '/pub/drawings/' + $scope.local.data.base64String));
        if ($rootScope.routeback.state === 'app.defects' && $rootScope.currentDraw) {
            //fullscreen for drawing of a defect fron defects tab
            $scope.local.singleMarker = true;
            if ($scope.local.data.markers && $scope.local.data.markers.length && $scope.local.data.markers[0].id) {
                $scope.local.disableAddMarker = true;
            }
        } else {
            //fullscreen for a drawing from drawings tab
            $scope.local.singleMarker = false;
            $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;
        }

        $scope.zoomIn = function() {
            if (index === 4) {
                index++;
                $scope.disableZoomIn = true;
                $scope.disableZoomOut = false;
            } else {
                index++;
                $scope.disableZoomIn = false;
                $scope.disableZoomOut = false;
            }
            $scope.index = $scope.widthMap[index].value;
            renderPoints(index, false);
        };

        $scope.zoomOut = function() {
            if (index === 1 && !$scope.disableZoomOut) {
                index--;
                $scope.disableZoomOut = true;
                $scope.disableZoomIn = false;
            } else {
                index--;
                $scope.disableZoomOut = false;
                $scope.disableZoomIn = false;
            }
            $scope.index = $scope.widthMap[index].value;
            renderPoints(index, false);
        };

        //zoom in on pinch gesture
        function pinchOut() {
            var zoom = $scope.widthMap[index].zoom;
            //zoom in if less than max allowed value
            if ($scope.index < $scope.widthMap[5].value) {
                $scope.index += 30;
                //set the correct index for points to be rendered
                zoom += 2.5;
                //keep consistency between zoom on pinch and on button click
                for (var i = 0; i < $scope.widthMap.length - 1; i++) {
                    if ($scope.index >= $scope.widthMap[i].value) {
                        index = i;
                    }
                }
            }
            renderPoints(zoom, true);
        }
        //zoom out on pinch gesture
        function pinchIn() {
            var zoom = $scope.widthMap[index].zoom;
            //zoom out if more than min allowed value
            if ($scope.index > $scope.widthMap[0].value) {
                $scope.index -= 30;
                //set the correct index for points to be rendered
                zoom -= 2.5;
                //keep consistency between zoom on pinch and on button click
                for (var i = $scope.widthMap.length - 1; i >= 0; i--) {
                    if ($scope.index <= $scope.widthMap[i].value) {
                        index = i;
                    }
                }
            }
            renderPoints(zoom, true);
        }
        //pinch event handling
        $scope.reportEvent = function(event) {
            switch (event.type) {
                case 'pinchin':
                    pinchIn();
                    break;
                case 'pinchout':
                    pinchOut();
                    break;
                default:
            }
        }

        $scope.triggerMarker = function() {
            $scope.addingMarker = !$scope.addingMarker;
        }

        function generateDefectImg(newstatus) {
            switch (newstatus) {
                case 'Incomplete':
                    img = 'img/incomplete.png'
                    break;
                case 'Completed':
                    img = 'img/completed.png'
                    break;
                case 'Contested':
                    img = 'img/contested.png'
                    break;
                case 'Delayed':
                    img = 'img/delayed.png'
                    break;
                case 'Closed Out':
                    img = 'img/closed_out.png'
                    break;
                case 'Partially Completed':
                    img = 'img/partially_completed.png'
                    break;
            }
        }

        $scope.back = function() {
            if ($rootScope.routeback) {
                //make sure a marker is set for a new defect
                if ($rootScope.routeback.id == "0" && $rootScope.routeback.state == "app.defects" && !hasMarker) {
                    SettingsService.show_message_popup("Error", "Please select a marker for the new defect.");
                    return;
                }
                $rootScope.go($rootScope.routeback.state, {
                    id: $rootScope.routeback.id
                });
            } else {
                $rootScope.go('app.tab')
            }
        }
        $scope.go = function(predicate, id) {
            if (id) {
                $rootScope.go('app.' + predicate, {
                    id: id
                });
            }
        }
    }
]);
