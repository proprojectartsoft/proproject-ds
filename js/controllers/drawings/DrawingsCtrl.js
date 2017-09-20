dsApp.controller('DrawingsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$indexedDB',
    '$filter',
    '$ionicPopup',
    'DrawingsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $filter, $ionicPopup, DrawingsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = 'drawings';
        $scope.settings.entityId = $stateParams.id;
        $scope.local = {};
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        SettingsService.put_settings('tabActive', 'drawings');
        sessionStorage.setObject('ds.defect.back', {
            id: $stateParams.id,
            state: 'app.drawings'
        })
        sessionStorage.setObject('ds.fullscreen.back', {
            id: $stateParams.id,
            state: 'app.drawings'
        })
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

        if (!sessionStorage.getObject('dsdrwact') || sessionStorage.getObject('dsdrwact').id !== parseInt($stateParams.id)) {
            $indexedDB.openStore('projects', function(store) {
                store.find(sessionStorage.getObject('dsproject')).then(function(res) {
                    var drawing = $filter('filter')(res.drawings, {
                        id: $stateParams.id
                    })[0];
                    sessionStorage.setObject('dsdrwact', drawing)
                    $scope.local.data = drawing;
                    $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;
                    setPdf($scope.local.data.pdfPath)
                })
            })
        } else {
            $scope.local.data = sessionStorage.getObject('dsdrwact');
            $scope.settings.subHeader = 'Drawing - ' + $scope.local.data.title;
            setPdf($scope.local.data.pdfPath)
        }

        $scope.getFullscreen = function() {
            $scope.go('fullscreen', $stateParams.id);
        }
        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
        }
        $scope.cancelEdit = function() {
            $indexedDB.openStore("projects", function(store) {
                store.find(sessionStorage.getObject('dsproject')).then(function(project) {
                    var draw = $filter('filter')(project.drawings, {
                        id: sessionStorage.getObject('dsdrwact').id
                    })[0];
                    //restore the drawing before changes
                    $scope.local.data = draw;
                    sessionStorage.setObject('dsdrwact', $scope.local.data)
                    $rootScope.disableedit = true;
                })
            })
        }
        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            $indexedDB.openStore('projects', function(store) {
                store.find(sessionStorage.getObject('dsproject')).then(function(proj) {
                    var draw = $filter('filter')(proj.drawings, {
                        id: $scope.local.data.id
                    })[0];
                    draw.title = $scope.local.data.title;
                    draw.code = $scope.local.data.code;
                    draw.revision = $scope.local.data.revision;
                    draw.drawing_date = new Date($scope.local.data.drawing_date).getTime();
                    proj.isModified = true;
                    draw.isModified = true;
                    sessionStorage.setObject('dsdrwact', $scope.local.data)
                    saveChanges(proj);
                })
            })
        }

        function saveChanges(project) {
            $indexedDB.openStore('projects', function(store) {
                store.upsert(project).then(
                    function(e) {
                        store.find(sessionStorage.getObject('dsproject')).then(function(project) {})
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

        $scope.back = function() {
            sessionStorage.removeItem('dsdrwact');
            sessionStorage.removeItem('ds.defect.back');
            $rootScope.disableedit = true;
            $state.go('app.tab')
        }
        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
