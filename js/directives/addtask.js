angular.module($APP.name).directive('addtask', [
    '$timeout',
    '$rootScope',
    'DrawingsService',
    'DefectsService',
    'ConvertersService',
    '$anchorScroll',
    '$location',
    'SubcontractorsService',
    '$stateParams',
    'flowFactory',
    'Upload',
    'SweetAlert',
    function ($timeout, $rootScope, DrawingsService, DefectsService, ConvertersService, $anchorScroll, $location, SubcontractorsService, $stateParams, flowFactory, Upload, SweetAlert) {
        return {
            restrict: 'EA',
            link: link,
            scope: {
                'dial': '=',
                'someCtrlFn': '&callback'
            },
            templateUrl: 'templates/_add_task.html'
        };
        function link($scope, $elem, $attrs, $ctrl) {
            $scope.filter = {};
            $scope.filter.uploadphotos = [];
            $scope.dataDefect = {
                currency_id: 0,
                currency_name: "EUR"
            };
            $scope.filter.active = false;
            $scope.filter.photos = [];
            $scope.uploader = [];
            $scope.filter.deletePhotos = [];
            $rootScope.saving = {
                saved: true
            };
            $scope.existingFlowObject = flowFactory.create({});
            $rootScope.selected = [];
            $scope.filter.severity = [
                {
                    id: 0,
                    name: 'None'
                },
                {
                    id: 1,
                    name: 'Information'
                },
                {
                    id: 2,
                    name: 'Minor'
                },
                {
                    id: 3,
                    name: 'Normal'
                },
                {
                    id: 4,
                    name: 'Major'
                },
                {
                    id: 5,
                    name: 'Other'
                }
            ];
            $scope.filter.priority = [
                {
                    id: 0,
                    name: 'None'
                },
                {
                    id: 1,
                    name: 'Low'
                },
                {
                    id: 2,
                    name: 'Medium'
                },
                {
                    id: 3,
                    name: 'High'
                },
                {
                    id: 4,
                    name: 'Critical'
                },
                {
                    id: 5,
                    name: 'Other'
                }
            ];


            $scope.open1 = function () {
                $scope.popup1.opened = true;
            };
            $scope.popup1 = {
                opened: false
            };


            $scope.toggle = function (value) {
                if (value == 'cancel') {
                    $rootScope.saving = {
                        saved: false
                    }
                }
                $scope.filter.active = !$scope.filter.active;
                if ($scope.filter.active) {
                    DrawingsService.get_original($stateParams.id).then(function (result) {
                        var url = $APP.server + '/pub/drawings/' + result.base64String;
                        $scope.isDrawing = true;
                        PDFJS.getDocument(url).then(function (pdf) {
                            pdf.getPage(1).then(function (page) {
                                var canvasDiv = $("#thisLocation");
                                var heightToBe = 118;
                                var viewport = page.getViewport(1);
                                var scale = heightToBe / viewport.height;
                                var usedViewport = page.getViewport(scale);
                                var canvas = document.createElement('canvas');
                                $(canvas).appendTo(canvasDiv);
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
                    $rootScope.saving.saved = true;
                }
            }

            ;
            $scope.toggleBar = function () {
                if ($scope.subcontractors) {
                    $scope.toggle();
                }
            }

            $scope.uploadFiles = function (files, errFiles) {
                $scope.files = files;
                angular.forEach(files, function (flowFile) {
                    Upload.dataUrl(flowFile, true).then(function (url) {
                        $scope.filter.uploadphotos.push({
                            "id": flowFile.$ngfBlobUrl,
                            "title": " ",
                            "defect_id": 0,
                            "project_id": 0,
                            "file_name": flowFile.name,
                            "base_64_string": url.replace(/^data:image\/(png|jpg|jpeg);base64,/, "")
                        });
                    });
                })
            }
            $scope.deleteFile = function (predicate, item, list) {
                if (predicate === 'file') {
                    var index = list.indexOf(item);
                    for (var i = 0; i < $scope.filter.uploadphotos.length; i++) {
                        if ($scope.filter.uploadphotos[i].id === item.id) {
                            $scope.filter.deletePhotos.push({id: item.id});

                        }
                    }
                    if (index > -1) {
                        list.splice(index, 1);
                    }
                }
                if (predicate === 'photos') {
                    for (var i = 0; i < $scope.photos_preview.length; i++) {
                        if ($scope.photos_preview[i].id === item.id) {
                            $scope.photos_preview.splice(i, 1);
                            $scope.filter.deletePhotos.push({id: item.id});
                        }
                    }
                }
            }
            $scope.create = function () {
                $scope.dataDefect.project_id = $rootScope.project.id;
                $scope.dataDefect.markers = {
                    position_x: $rootScope.currentMarker.x,
                    position_y: $rootScope.currentMarker.y
                }
                DefectsService.create(ConvertersService.create_defect($scope.dataDefect)).then(function (result) {
                    $rootScope.lastDefectId = result;
                    var request;
                    if ($scope.dataDefect.comment) {
                        request = {
                            "id": 0,
                            "text": $scope.dataDefect.comment,
                            "user_id": 0,
                            "defect_id": result
                        };
                        DefectsService.create_comment(request).then(function (result) {
                        });
                    }
                    if ($scope.filter.uploadphotos.length) {
                        request = angular.copy($scope.filter.uploadphotos);
                        angular.forEach(request, function (photo) {
                            photo.id = 0;
                            photo.defect_id = result;
                            photo.project_id = $rootScope.project.id;
                        });
                        DefectsService.create_photos(request).then(function (result) {
                        });
                    }
                    var marker = {
                        position_x: $rootScope.currentMarker.x,
                        position_y: $rootScope.currentMarker.y,
                        defect_id: result,
                        drawing_id: $scope.drawingHelper.id
                    };

                    //$scope.backupTarget.defect_id = result;
                    //$scope.backupTarget.drawing_id = $scope.drawingHelper.id;
                    $scope.drawingHelper.markers.push(marker);
                    DrawingsService.update($scope.drawingHelper).then(function (result) {
                        $scope.filter.active = false;
                    });
                    $rootScope.saving = {
                        saved: true
                    }
                    $scope.toggle();
                });
            }

            $scope.parseService = function (id) {
                DefectsService.get(id).then(function (result) {
                    $scope.dataDefect = ConvertersService.preview_defect(result);
                    if ($scope.dataDefect.drawing) {
                        $rootScope.select = {
                            id: $scope.dataDefect.drawing.id,
                            title: $scope.dataDefect.drawing.title,
                            path: $scope.dataDefect.drawing.base64String
                        }
                    }
                    $scope.photos_preview = [];
                    $scope.filter.photos = [];
                    if (result.number_of_photos > 0) {
                        DefectsService.list_photos(result.id).then(function (photos) {
                            $scope.photos_preview = photos;
                            angular.forEach($scope.photos_preview, function (photo) {
                                photo.url = $APP.server + 'pub/defectPhotos/' + photo.base_64_string
                            });
                            $scope.toggle(true);
                        });
                    } else {
                        if (result.number_of_comments > 0) {
                            DefectsService.list_comments(result.id).then(function (comments) {
                                $scope.filter.comments = comments;
                                $scope.toggle(true);
                            });
                        } else {
                            $scope.toggle(true);
                        }
                    }
                });
            };

            $scope.deletePhotoPreview = function (item) {
                if ($scope.filter.edit) {
                    if (!$scope.filter.deletePhotos) {
                        $scope.filter.deletePhotos = [];
                    }
                    var i = $scope.photos_preview.indexOf(item);
                    if (i !== -1) {
                        $scope.photos_preview.splice(i, 1);
                    }
                    $scope.filter.deletePhotos.push({id: item.id});
                }
            }

            $scope.submitCommentOnEnter = function (event) {
                if (event.keyCode === 13) {
                    $scope.submitComment();
                }
            };
            $scope.submitComment = function () {
                if (($scope.filter.edit || $scope.filter.preview) && $scope.dataDefect.comment) {
                    var request = {
                        "id": 0,
                        "text": $scope.dataDefect.comment,
                        "user_id": 0,
                        "defect_id": $scope.dataDefect.id
                    };
                    DefectsService.create_comment(request).then(function (result) {
                        $scope.dataDefect.comment = "";
                        DefectsService.list_comments($scope.dataDefect.id).then(function (comments) {
                            $scope.filter.comments = comments;
                            $location.hash('commentinput');
                            $anchorScroll();
                        });
                    })
                }
            }
            $scope.toggleCurrency = function () {
                switch ($scope.dataDefect.currency_id) {
                    case 0:
                    {
                        $scope.dataDefect.currency_id = 1;
                        $scope.dataDefect.currency_name = "USD";
                        break;
                    }
                    case 1:
                    {
                        $scope.dataDefect.currency_id = 2;
                        $scope.dataDefect.currency_name = "GBP";
                        break;
                    }
                    case 2:
                    {
                        $scope.dataDefect.currency_id = 0;
                        $scope.dataDefect.currency_name = "EUR";
                        break;
                    }
                }
            }
            $scope.$watch('dial', function (value) {
                if (value) {
                    $scope.dataDefect = {
                        currency_id: 0,
                        currency_name: "EUR",
                        locationFix: value.location
                    };
                    $scope.filter.photos = [];
                    $scope.toggle();
                    if ($scope.dial.subcontractors) {
                        $scope.subcontractors = $scope.dial.subcontractors;
                    } else {
                        $scope.drawingHelper = $rootScope.drawingHelper;
                        $scope.target = angular.copy(value.target);
                        $scope.backupTarget = value.target;
                        $scope.backupTargetList = value.list;
                    }
                    $scope.filter.preview = false;
                    $scope.filter.edit = false;
                    $rootScope.edit = false;

                }
            });
            $scope.$on('$destroy', function () {
                $scope.filter.active = false;
            });
        }
    }
]);