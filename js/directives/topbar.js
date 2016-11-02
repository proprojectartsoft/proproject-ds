angular.module($APP.name).directive('topbar', function () {
    return {
        restrict: 'E',
        templateUrl: 'templates/topbar.html'
    };
});
angular.module($APP.name).directive('sidebar', function ($rootScope) {
    return {
        restrict: 'E',
        link: link,
        templateUrl: 'templates/sidebar.html'
    };
    function link($scope, $elem, $attrs, $ctrl) {
        $scope.current_user = $rootScope.current_user;
    }
});
angular.module($APP.name).directive("mySrc", function () {
    return {
        link: function (scope, element, attrs) {
            var img, loadImage;
            img = null;

            loadImage = function () {

                element[0].src = "../img/loading.gif";

                img = new Image();
                img.src = attrs.mySrc;

                img.onload = function () {
                    element[0].src = attrs.mySrc;
                };
            };

            scope.$watch((function () {
                return attrs.mySrc;
            }), function (newVal, oldVal) {
                if (oldVal !== newVal) {
                    loadImage();
                }
            });
        }
    };
});
angular.module($APP.name).directive('mainmenu', function ($rootScope, $timeout) {
    return {
        restrict: 'EA',
        link: link,
        scope: {
            'state': '='
        },
        templateUrl: 'templates/mainmenu.html'
    };
    function link($scope, $elem, $attrs, $ctrl) {
        $timeout(function () {
            $scope.current_user = $rootScope.current_user;
        });
        $scope.$on('$destroy', function () {
            delete  $scope.current_user;
        });

    }
});

angular.module($APP.name).directive('status', function ($rootScope, DefectsService, ConvertersService) {
    return {
        restrict: 'E',
        link: link,
        scope: {
            'item': '=',
            'parent': '=',
            'table': '=',
            'dsb': '='
        },
        templateUrl: 'templates/_status.html'
    };
    function link($scope, $elem, $attrs, $ctrl) {
        $scope.filter = {};
        $scope.filter.noShow = true;
        if ($rootScope.current_user.roleDs.id == 2) {
            $scope.filter.noShow = false;
        }
        $scope.toggle = function () {
            if ($scope.item.openStatus) {
                angular.forEach($scope.parent, function (child) {
                    child.openStatus = false;
                });
            } else {
                if ($scope.dsb || $scope.table) {
                    angular.forEach($scope.parent, function (child) {
                        child.openStatus = false;
                    });
                    $scope.item.openStatus = !$scope.item.openStatus;
                }
            }
        };
        $scope.changeStatus = function (newStatus) {
            $scope.item.status_obj = newStatus;
            $scope.item.status_id = newStatus.id;
            $scope.item.status_name = newStatus.name;
            $scope.item.openStatus = false;
            if ($scope.table) {
                DefectsService.update(ConvertersService.update_defect($scope.item)).then(function (result) {
                })
            }
            console.log($scope.item.locationFix);
            if ($scope.item.locationFix) {
                $rootScope.defectcolor = newStatus.name;
            }
        };
        $(document).bind('click', function (event) {
            var isClickedElementChildOfPopup = $elem
                    .find(event.target)
                    .length > 0;
            if (isClickedElementChildOfPopup)
                return;
            $scope.$apply(function () {
                if ($scope.item) {
                    $scope.item.openStatus = false;
                }
            });
        });
    }
});
angular.module($APP.name).directive('fullscreen', function ($rootScope, $timeout, $state, DrawingsService, $stateParams) {
    return {
        restrict: 'E',
        link: link,
        scope: {
            'state': '=',
            'dial': '='
        },
        templateUrl: 'templates/_fullscreen.html'
    };
    function link($scope, $elem, $attrs, $ctrl, $stateParams) {
        $scope.isToggle = false;
        var canvas = null;
        $scope.addingMarker = false;
        $scope.index = 100;
        var index = 2;
        var browserWidth = $(document).width() - 100;
        $scope.widthMap = [{
                zoom: 60,
                value: browserWidth * 60 / 100
            }, {
                zoom: 80,
                value: browserWidth * 80 / 100
            }, {
                zoom: 100,
                value: browserWidth
            }, {
                zoom: 120,
                value: browserWidth * 120 / 100
            }, {
                zoom: 160,
                value: browserWidth * 160 / 100
            }, {
                zoom: 200,
                value: browserWidth * 200 / 100
            }];
        $scope.filter = {};
        $scope.filter.active = false;
        $rootScope.pointlist = [];
        $scope.setloc = false;
        var renderPoints = function (index) {
            angular.forEach($rootScope.pointList, function (point) {
                $scope.perc = browserWidth / 1200 * 100;
                point.x = ($scope.widthMap[index].zoom / 100) * (point.xInit * $scope.perc / 100);
                point.y = ($scope.widthMap[index].zoom / 100) * (point.yInit * $scope.perc / 100);
            });
        }
        $rootScope.$watch('saving', function (value) {

            if (value && (value.saved === false)) {
                $scope.isToggle = false;
                $rootScope.pointlist.pop();
            }

        });
         $scope.addMarker = function () {
            $scope.addingMarker = !$scope.addingMarker;
            if ($scope.addingMarker) {
                $('#fullscreenCanvas').css('cursor', 'url(img/incomplete.png),auto');
            } else {
                $('#fullscreenCanvas').css('cursor', 'auto');
            }
        };
        renderPoints(index);
        $scope.toggleNewTask = function (aux, list, location) {
            $rootScope.defectcolor = 'Incomplete';
            $scope.dialcreate = {
                target: aux,
                list: list,
                location: location
            };
        };
        $scope.goDrawing = function (id, defect) {
            $('#fullscreenCanvas').css('cursor', 'auto')
            $state.go('app.drawing', {'id': id, 'defect': defect});
        };

        var renderZoom = function (pdfFile, mapIndex) {
            $scope.rendering = true;
            pdfFile.getPage(1).then(function (page) {
                var thisContext = canvas.getContext('2d');
                $scope.viewport = page.getViewport(1);
                var scale = $scope.widthMap[mapIndex].value / $scope.viewport.width;
                $scope.firstViewport = page.getViewport(scale);
                $scope.viewport = angular.copy($scope.firstViewport);

                canvas.height = $scope.viewport.height;
                canvas.width = $scope.viewport.width;

                var renderContext = {
                    canvasContext: thisContext,
                    viewport: $scope.viewport
                };
                page.render(renderContext).promise.then(function () {
                    renderPoints(mapIndex);
                    $scope.rendering = false;
                });
            });
        }
        $scope.zoomIn = function () {
            if (index == 4) {
                index++;
                $scope.disableZoomIn = true;
                $scope.disableZoomOut = false;
            } else {
                index++;
                $scope.disableZoomIn = false;
                $scope.disableZoomOut = false;
            }
            $scope.index = $scope.widthMap[index].zoom;
            renderZoom($rootScope.pdfFile, index);
            renderPoints(index);
        };
        $scope.zoomOut = function () {
            if (index == 1 && !$scope.disableZoomOut) {
                index--;
                $scope.disableZoomOut = true;
                $scope.disableZoomIn = false;
            } else {
                index--;
                $scope.disableZoomOut = false;
                $scope.disableZoomIn = false;
            }
            $scope.index = $scope.widthMap[index].zoom;
            renderZoom($rootScope.pdfFile, index);
            renderPoints(index);
        };
        var renderIt = function (pdfFile, mapIndex) {
            $scope.rendering = true;
            pdfFile.getPage(1).then(function (page) {
                var canvasDiv = document.getElementById('fullscreenCanvas');
                canvas = document.createElement('canvas');
                //canvas = $("<canvas></canvas>");
                canvasDiv.appendChild(canvas);
                canvas.onclick = function (event) {
                    if ($scope.addingMarker) {
                        $('#fullscreenCanvas').css('cursor', 'auto')
                        $scope.addingMarker = false;
                        if (!$scope.isToggle) {
                            $scope.isToggle = true;
                            $scope.toggleNewTask(null, null, true);
                            if (index != 2) {
                                var x = ((Math.floor(event.offsetX) / $scope.perc * 100 - 2) / $scope.widthMap[index].zoom) * 100 + (13 - index * 2);
                                var y = ((Math.floor(event.offsetY) / $scope.perc * 100 - 2) / $scope.widthMap[index].zoom) * 100 + (13 - index * 2);
                                $rootScope.pointlist.push({xInit: x, yInit: y});
                                renderPoints(index);
                            } else {
                                var x = Math.floor(event.offsetX) / $scope.perc * 100 + 6;
                                var y = Math.floor(event.offsetY) / $scope.perc * 100 + 6;
                                $rootScope.pointList.push({xInit: x, yInit: y});
                                renderPoints(index);

                            }
                            $rootScope.currentMarker = {
                                x: x,
                                y: y
                            }
                        } else {
                            $scope.toggleNewTask(null,null,true);
                            $scope.isToggle = false;
                            $rootScope.pointlist.pop();
                        }
                    }
                };
                var thisContext = canvas.getContext('2d');
                $scope.viewport = page.getViewport(1);
                var scale = $scope.widthMap[mapIndex].value / $scope.viewport.width;
                $scope.firstViewport = page.getViewport(scale);
                $scope.viewport = angular.copy($scope.firstViewport);
                canvas.height = $scope.viewport.height
                canvas.width = $scope.viewport.width
                var renderContext = {
                    canvasContext: thisContext,
                    viewport: $scope.viewport
                };

                page.render(renderContext)
                renderPoints(mapIndex);
                $scope.rendering = false;
                $scope.$apply(function () {});
            });
        }
        $rootScope.$watch('defectcolor', function (newVal) {
            if ($rootScope.pointlist.length) {
                $rootScope.pointlist[ $rootScope.pointlist.length - 1].status = newVal;
            }
        });
        $scope.toggle = function (predicate) {
            if (predicate === false){
                $('#fullscreenCanvas').css('cursor', 'auto')
                $rootScope.isFullscreen = false;
            }
            DrawingsService.get_id_list($rootScope.project.id).then(function (result) {
                for (i = 0; i < result.length; i++) {
                    if (result[i].id == $rootScope.currentDrawing) {
                        if (i < result.length - 1) {
                            $scope.next = result[i + 1].id;
                            if (i > 0) {
                                $scope.previous = result[i - 1].id;
                            } else {
                                $scope.previous = 0;
                            }
                        } else {
                            $scope.next = 0;
                            if (i > 0) {
                                $scope.previous = result[i - 1].id;
                            } else {
                                $scope.previous = 0;
                            }
                        }
                    }
                }
            });
            $('#fullscreenCanvas').css('cursor', 'auto')
            $scope.filter.active = predicate;
            if (predicate) {
                $timeout(function () {
                    $scope.drawingHelper = $rootScope.drawingHelper;
                    $scope.url = $APP.server + '/pub/drawings/' + $scope.drawingHelper.base64String;
                    renderPoints(2);
                    $rootScope.isFullscreen = true;
                    //START RENDER PDF
                    $scope.loading = true;
                    PDFJS.getDocument($scope.url).then(function (pdf) {
                        renderIt(pdf, index);
                        $scope.loading = false;
                    })
                })
            }
        }
        $scope.$watch('dial', function (value) {
            $scope.dialCreate = null;
            $('#fullscreenCanvas').css('cursor', 'auto')
            if (value) {
                $scope.toggle(true);
            }
        });
    }
});




angular.module($APP.name).directive('backImg', function () {
    return function (scope, element, attrs) {
        var url = attrs.backImg;
        element.css({
            'background-image': 'url(' + url + ')',
            'background-size': 'cover'
        });
    };
});
angular.module($APP.name).filter('capitalize', function ($timeout) {
    // Create the return function and set the required parameter as well as an optional paramater
    return function (input, camelcase) {
        if (isNaN(input)) {
            // If the input data is not a number, perform the operations to capitalize the correct letter.
            var char = char - 1 || 0;
            var out = [];
            if (camelcase) {
                for (var i = 0; i < input.length; i++) {
                    if (input[i] === " ") {
                        out.push(" ");
                        char = i + 1;
                    } else {
                        if (i === char) {
                            out.push(input[i].toUpperCase());
                        } else {
                            out.push(input[i].toLowerCase());
                        }
                    }

                }
            } else {
                for (var i = 0; i < input.length; i++) {
                    if (i === char) {
                        out.push(input[i].toUpperCase());
                    } else {
                        out.push(input[i].toLowerCase());
                    }
                }
            }
            return out.join('');
        } else {
            return input;
        }
    };

});
angular.module($APP.name).directive('fileModel', ['$parse', '$rootScope', function ($parse, $rootScope) {
        return {
            restrict: 'EA',
            scope: {
                'item': '=',
                'someCtrlFn': '&callback'
            },
            link: function (scope, element, attrs) {
//                var model = $parse(attrs.fileModel);
//                var modelSetter = model.assign;
//
                element.bind('change', function () {


                    scope.$apply(function () {
                        $rootScope.myFile = element[0].files[0];
//                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }
]);
angular.module($APP.name).directive('testdir', function ($timeout, $rootScope) {
    return function (scope, element, attrs) {

        scope.changeSize = function (value) {
            if ((scope.defaultSize + value) > 0) {
                var oldSize = scope.defaultSize;
                scope.defaultSize = scope.defaultSize + value;
                $timeout(function () {
                    var newWidth = element[0].children[0].clientWidth;
                    var newHeight = element[0].children[0].clientHeight;
                    var step = 0.0005;


                    angular.forEach(scope.pointers, function (point) {
                        point.y = (point.y * newHeight) / point.height;
                        point.x = (point.x * newWidth) / point.width;
                        point.height = newHeight;
                        point.width = newWidth;
                    });
                });
            }


        };

        scope.$watch((function () {
            return element[0].children[0].src;
        }), function (newVal, oldVal) {
            if (newVal !== 0) {
                if (!$rootScope.pointers) {
                    scope.pointers = [];
                } else {
                    scope.pointers = $rootScope.pointers;
                }
                element.css({
                    'width': 1279,
                    'height': element[0].children[0].clientHeight,
                    'max-height': 'calc(100% - 70px)'
                });
                $timeout(function () {
                    angular.forEach(scope.pointers, function (point) {
                        point.position_x = (point.position_x * element[0].clientHeight) / point.height;
                        point.position_y = (point.position_y * element[0].clientWidth) / point.width;
                        point.height = element[0].clientHeight;
                        point.width = element[0].clientWidth;
                    });
                })

                scope.defaultSize = 100;
            }
        });
        element.on('click', function (e) {
            if (scope.setloc) {
                var div = $(e.target);
                var offset = div.offset();
                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;

                scope.$apply(function () {
                    var aux = {
                        'position_x': x,
                        'position_y': y,
                        'width': element[0].children[0].clientWidth,
                        'height': element[0].children[0].clientHeight,
                        'scroll': scope.defaultSize
                    };

                    scope.pointers.push(aux);
                    scope.toggleNewTask(aux, scope.pointers);
                    scope.setloc = false;
                });
            }
            e.stopPropagation();
        });
    };
});

angular.module($APP.name).directive('loadpoint', function ($timeout, $rootScope) {
    return function (scope, element, attrs) {
        $timeout(function () {
            var point = {
                height: 903,
                width: 1279,
                position_x: 738.5,
                position_y: 272
            };
            point.position_y = (point.position_y * element[0].children[0].clientHeight) / point.height;
            point.position_x = (point.position_x * element[0].children[0].clientWidth) / point.width;
            point.height = 120;
            point.width = 200;
            scope.testStyle = {
                'top': point.position_y,
                'left': point.position_x,
                'margin-top': '3px',
                'margin-left': '3px'
            };
        })
    };
});