dsApp.controller('DrawingsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$filter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $filter) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.entityId = $stateParams.id;
        $scope.local = {};
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        SettingsService.put_settings('tabActive', 'drawings');
        $rootScope.routeback = {
            id: $stateParams.id,
            state: 'app.drawings'
        }
        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        var width = $("#canvasCointainer").width();
        var perc = width / 12;

        var setPdf = function(url) {
            PDFJS.getDocument(url).then(function(pdf) {
                pdf.getPage(1).then(function(page) {
                    var widthToBe = 480;
                    var viewport = page.getViewport(1);
                    var scale = widthToBe / viewport.width;
                    var usedViewport = page.getViewport(scale);
                    var canvas = document.getElementById('drawingPreviewCanvas');
                    var context = canvas.getContext('2d');
                    canvas.height = usedViewport.height;
                    canvas.width = usedViewport.width;
                    var renderContext = {
                        canvasContext: context,
                        viewport: usedViewport
                    };
                    page.render(renderContext).then(function() {
                        $timeout(function() {
                            $scope.markers = [];
                            angular.forEach($rootScope.currentDraw.markers, function(markerResult) {
                                if (!(markerResult.position_x === 0 && markerResult.position_y === 0)) {
                                    var auxPoint = {
                                        xInit: markerResult.position_x,
                                        yInit: markerResult.position_y,
                                        x: markerResult.position_x * (perc / 100) - 6,
                                        y: markerResult.position_y * (perc / 100) - 6,
                                        defect_id: markerResult.defect_id,
                                        drawing_id: markerResult.drawing_id,
                                        id: markerResult.id,
                                        status: markerResult.status
                                    };
                                    $scope.markers.push(auxPoint);
                                }
                            });
                        });
                    })
                });
            });
        }
        $scope.settings.subHeader = 'Drawing - ' + $rootScope.currentDraw.title;
        setPdf($rootScope.currentDraw.pdfPath || ($APP.server + '/pub/drawings/' + $rootScope.currentDraw.base64String));
        $scope.getFullscreen = function() {
            $scope.go('fullscreen', $stateParams.id);
        }
        $scope.toggleEdit = function() {
            $rootScope.disableedit = !$rootScope.disableedit;
            if ($rootScope.disableedit)
                $rootScope.currentDraw = angular.copy($rootScope.backupDraw);
        }
        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            $rootScope.currentDraw.drawing_date = new Date($rootScope.currentDraw.drawing_date).getTime();
            $rootScope.currentDraw.isModified = true;
            $rootScope.currentDraw.modified = true;
            $rootScope.go('app.tab')
        }

        $scope.go = function(predicate, item) {
            if (predicate == 'back') {
                $rootScope.routeback = null;
                $rootScope.disableedit = true;
                $rootScope.go('app.tab');
            } else {
                $rootScope.currentDefect = $filter('filter')($rootScope.defects, {
                    id: item
                })[0];
                $rootScope.backupDefect = angular.copy($rootScope.currentDefect);
                $rootScope.go('app.' + predicate, {
                    id: item
                });
            }
        }
    }
]);
