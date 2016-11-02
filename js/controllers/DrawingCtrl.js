angular.module($APP.name).controller('DrawingCtrl', [
    '$rootScope', '$scope', 'DrawingsService', '$stateParams', 'DefectsService', '$timeout', 'SweetAlert',
    function ($rootScope, $scope, DrawingsService, $stateParams, DefectsService, $timeout, SweetAlert) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $scope.filter = {};
        $scope.filter.state = 'related';
        $scope.comment = '';
        $scope.setloc = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.toggleFullscreen = function () {
            $scope.dial = {
                'predicate': 'predicate'
            };
        };
        $scope.toggleDefects = function (id, predicate) {
            $scope.dials = {
                id: id,
                edit: predicate
            };
            
        };
        DrawingsService.get_update($stateParams.defect).then(function (result) {
            $scope.updates = result;
        });
        DefectsService.get($stateParams.defect).then(function (result) {
            $scope.defect = result;
            if (result.number_of_photos > 0) {
                DefectsService.list_photos(result.id).then(function (photos) {
                    $scope.photos_preview = photos;
                    angular.forEach($scope.photos_preview, function (photo) {
                        photo.url = $APP.server + 'pub/defectPhotos/' + photo.base_64_string
                    });

                });
            }
        });
        DefectsService.list_comments($stateParams.defect).then(function (result) {
            $scope.comments = result
        });
        DrawingsService.get_original($stateParams.id).then(function (result) {
            $scope.point = {};
            $scope.test = result;
            $rootScope.drawingHelper = result;
            angular.forEach($rootScope.drawingHelper.markers, function (aux) {
                if (aux.defect_id == $stateParams.defect) {
                    $scope.point.x = aux.position_x * (4 / 10)
                    $scope.point.y = aux.position_y * (4 / 10)
                    $scope.point.status = aux.status;
                }
            });
            $scope.url = $APP.server + '/pub/drawings/' + $rootScope.drawingHelper.base64String;
            PDFJS.getDocument($scope.url).then(function (pdf) {
                pdf.getPage(1).then(function (page) {
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
                    page.render(renderContext);
                });
            });
        });
        
        $scope.postComment = function () {
            if ($scope.comment) {
                var request = {
                    "id": 0,
                    "text": $scope.comment,
                    "user_id": 0,
                    "defect_id": $stateParams.defect
                };
                DefectsService.create_comment(request).then(function (result) {
                    $scope.comment = '';
                    DefectsService.list_comments($stateParams.defect).then(function (comments) {
                        $scope.comments = comments;
                    });
                }).error(function (response) {
                })
            } else {
                
                window.onkeydown = null;
                window.onfocus = null;
                SweetAlert.swal("Error!", "There is no comment to post", "error");
            };
            
        };
        $scope.submitCommentOnEnter = function (event) {
            if (event.keyCode === 13) {
                $scope.postComment();
            }
        };



    }
]);