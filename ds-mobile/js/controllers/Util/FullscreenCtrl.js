angular.module($APP.name).controller('FullscreenCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'DrawingsService',
    '$ionicScrollDelegate',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, DrawingsService, $ionicScrollDelegate) { //   $scope.settings = {tabs:$rootScope.settings.tabs,tabActive:$rootScope.settings.tabActive};
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.local = {};
        $scope.local.markers = [];
        $scope.disableZoomOut = true;
        var index = 0;
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
        var renderPoints = function(index) {


            $timeout(function() {
                $scope.$apply(function() {
                    angular.forEach($scope.local.markers, function(point) {
                        point.x = ($scope.widthMap[index].zoom / 100) * point.xInit;
                        point.y = ($scope.widthMap[index].zoom / 100) * point.yInit;
                        point.z = 5
                    });
                });
            });
        };
        // $scope.onScroll = function () {
        //   $timeout(function() {
        //       $scope.$apply(function() {
        //           angular.forEach($scope.local.markers, function(point) {
        //               point.z = 99
        //           });
        //       });
        //   });
        // }

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
            renderPoints(index);
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
            renderPoints(index);
        };
        var perc = $scope.width / 12;
        var setPdf = function(base64String) {
                var url = $APP.server + '/pub/drawings/' + base64String;
                PDFJS.getDocument(url).then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
                        console.log(page)
                        var widthToBe = 1200;
                        var viewport = page.getViewport(1);
                        var scale = widthToBe / viewport.width;
                        var usedViewport = page.getViewport(scale);
                        var canvas = document.getElementById('fullPreviewCanvas');
                        var context = canvas.getContext('2d');
                        canvas.height = usedViewport.height;
                        canvas.width = usedViewport.width;
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
                                $timeout(function() {
                                    $('.ds-marker').find('*').css("zIndex", 10);
                                }, 1000);
                            });
                        })
                    });
                });
            }
            // DrawingsService.get_original($stateParams.id).then(function(result) {
            //     $scope.drawing = result;
            //     angular.forEach(result.markers, function(markerResult) {
            //         if (markerResult.position_x && markerResult.position_y) {
            //             var auxPoint = {
            //                 xInit: markerResult.position_x,
            //                 yInit: markerResult.position_y,
            //                 x: markerResult.position_x * (60 / 100) - 6,
            //                 y: markerResult.position_y * (60 / 100) - 6,
            //                 defect_id: markerResult.defect_id,
            //                 drawing_id: markerResult.drawing_id,
            //                 id: markerResult.id,
            //                 status: markerResult.status
            //             };
            //             $scope.local.markers.push(auxPoint);
            //         }
            //     });
            //     console.log($scope.local.markers);
            // });
        if (!localStorage.getObject('dsdrwact') || localStorage.getObject('dsdrwact').id !== parseInt($stateParams.id)) {
            DrawingsService.get_original($stateParams.id).then(function(result) {
                localStorage.setObject('dsdrwact', result)
                $scope.local.data = result;
                $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;
                setPdf($scope.local.data.base64String)
            })
        } else {
            $scope.local.data = localStorage.getObject('dsdrwact');
            $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;
            setPdf($scope.local.data.base64String)
        }
        $scope.back = function() {
            $state.go('app.drawings', {
                id: $stateParams.id
            })
        }
        $scope.go = function(predicate) {
            $state.go('app.' + predicate);
        }
    }
]);
