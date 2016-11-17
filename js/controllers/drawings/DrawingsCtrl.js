angular.module($APP.name).controller('DrawingsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'DrawingsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, DrawingsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = 'drawings';
        $scope.settings.entityId = $stateParams.id;
        $scope.local = {};
        SettingsService.put_settings('tabActive', 'drawings');
        localStorage.setObject('ds.defect.back', {id:$stateParams.id, state:'app.drawings'})
        localStorage.setObject('ds.fullscreen.back', {id:$stateParams.id, state:'app.drawings'})

        if ($rootScope.disableedit === undefined) {
            $rootScope.disableedit = true;
        }
        var width = $("#canvasCointainer").width();
        var perc = width / 12;


        var setPdf = function(base64String) {
            var url = $APP.server + '/pub/drawings/' + base64String;
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
                            angular.forEach($scope.local.data.markers, function(markerResult) {
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
        $scope.getFullscreen = function() {
            $scope.go('fullscreen', $stateParams.id);
        }


        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
            localStorage.setObject('ds.drawing.backup', $scope.local.data)
        }
        $scope.cancelEdit = function() {
            $scope.local.data = localStorage.getObject('ds.drawing.backup')
            localStorage.setObject('dsdrwact', $scope.local.data)
            localStorage.removeItem('ds.drawing.backup')
            $rootScope.disableedit = true;
        }
        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            DrawingsService.update($scope.local.data).then(function(result) {
                console.log(result);
                localStorage.setObject('dsdrwact', $scope.local.data)
                localStorage.removeItem('ds.drawing.backup')
            })
        }

        $scope.back = function() {
            localStorage.removeItem('dsdrwact');
            localStorage.removeItem('ds.drawing.backup');
            localStorage.removeItem('ds.defect.back');
            $rootScope.disableedit = true;
            $state.go('app.tab')
        }
        $scope.go = function(predicate, item) {
            console.log(predicate, item);
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
