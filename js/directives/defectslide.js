angular.module($APP.name).directive('defectslide', [
    '$rootScope',
    'createDialog',
    'DefectsService',
    'ConvertersService',
    '$anchorScroll',
    '$location',
    'SweetAlert',
    'DrawingsService',
    'flowFactory',
    'Upload',
    function ($rootScope, createDialog, DefectsService, ConvertersService, $anchorScroll, $location, SweetAlert, DrawingsService, flowFactory, Upload) {
        return {
            restrict: 'EA',
            link: link,
            scope: {
                'id': '=',
                'dial': '=',
                'defects': '=',
                'someCtrlFn': '&callback'
            },
            templateUrl: 'templates/_defects.html'
        };
        function link($scope, $elem, $attrs, $ctrl) {
            var canvasDiv = $("#canvasDiv");
            $scope.filter = {};
            $scope.dataDefect = {};
            $scope.filter.active = false;
            $scope.filter.photos = [];
            $scope.uploader = [];
            $scope.current_user = $rootScope.current_user;
            $scope.existingFlowObject = flowFactory.create({
            });
            $scope.isDrawing = false;

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



            $scope.launchComplexModal = function (item) {
                if (item.defect_id) {
                    $rootScope.selected = item;
                    $rootScope.selected.urlOriginal = $APP.server + 'pub/defectPhotos/' + $rootScope.selected.base_64_string.replace("resized", "original");
                } else {
                    angular.forEach($scope.filter.uploadphotos, function (pht) {
                        if (item.id === pht.$ngfBlobUrl) {
                            $rootScope.selected = pht;
                        }
                    })
                }
                $rootScope.selected.edit = $scope.filter.edit;

                createDialog('templates/_photo_modal.html', {
                    id: 'complexDialog',
                    backdrop: true,
                    success: {label: 'Success', fn: function () {
                        }}
                }, {
                    myVal: 15,
                    title: 'Photo Preview',
                    selectedImg: $rootScope.selected
                });
            };
            $scope.open1 = function () {
                $scope.popup1.opened = true;
            };
            $scope.popup1 = {
                opened: false
            };
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

            $scope.toggle = function (value) {
                if (value) {
                    $scope.filter.active = value;
                    currencyButton.setAttribute("disabled", true);
                } else {
                    if (value == null) {
                        $scope.dataDefect.currency_id = 0;
                        $scope.dataDefect.currency_name = "EUR";
                        currencyButton.removeAttribute("disabled");
                    }
                    $scope.filter.active = !$scope.filter.active;
                }
            };

            $scope.selectDrawing = function () {
                $rootScope.modalLock = true;
                createDialog('templates/_select_drawing_modal.html', {
                    id: 'complexDialog',
                    backdrop: true,
                    controller: '_SelectDrawingCtrl',
                    modalClass: 'modal de-drawings-edit',
                    success: {label: 'Success', fn: 'showDrawing()'}
                }, {
                    title: 'Select a drawing',
                    value: $rootScope.select
                });
            };
            $rootScope.$watch('select', function (value) {
                if (value) {
                    $(canvasDiv).html("");
                    $scope.isDrawing = true;
                    var url = $APP.server + '/pub/drawings/' + value.path;
                    PDFJS.getDocument(url).then(function (pdf) {
                        pdf.getPage(1).then(function (page) {

                            var heightToBe = 118;
                            var viewport = page.getViewport(1);
                            var scale = heightToBe / viewport.height;
                            var usedViewport = page.getViewport(scale);
                            var canvasDiv = $("#canvasDiv");
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

                }
            });
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
            $scope.create = function () {
                if ($scope.dataDefect.title) {
                    if ($scope.dataDefect.id) {
                        var request;
                        DefectsService.update(ConvertersService.update_defect($scope.dataDefect)).then(function (result) {
                            if ($scope.filter.deletePhotos.length) {
                                DefectsService.delete_photos($scope.filter.deletePhotos).then(function (result) {
                                });
                            }
                            if ($scope.dataDefect.comment) {
                                request = {
                                    "id": 0,
                                    "text": $scope.dataDefect.comment,
                                    "user_id": 0,
                                    "defect_id": $scope.dataDefect.id
                                };
                                DefectsService.create_comment(request).then(function (result) {
                                });
                            }
                            if ($scope.filter.uploadphotos.length) {
                                request = angular.copy($scope.filter.uploadphotos);
                                angular.forEach(request, function (photo) {
                                    photo.id = 0;
                                    photo.defect_id = $scope.dataDefect.id;
                                    photo.project_id = $rootScope.project.id;
                                });
                                DefectsService.create_photos(request).then(function (result) {
                                });
                            }
                            $scope.filter.edit = false;
                            $scope.filter.active = false;
                            $rootScope.editRelated = false;
                            $scope.someCtrlFn();
                        })
                    } else {
                        $scope.dataDefect.project_id = $rootScope.project.id;
                        $scope.dataDefect.id = 0;
                        DefectsService.create(ConvertersService.create_defect($scope.dataDefect)).then(function (result) {
                            $scope.defect_id = result;
                            //$scope.toggle(false);
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

                            if ($scope.isDrawing) {
                                DrawingsService.get_original($rootScope.select.id).then(function (result) {
                                    var auxPoint = {
                                        position_x: 0,
                                        position_y: 0,
                                        defect_id: $scope.defect_id,
                                        drawing_id: result.id,
                                    }
                                    result.markers.push(auxPoint);

                                    DrawingsService.update(result).then(function (result) {});
                                });
                            }
                            $scope.filter.active = false;
                            $scope.someCtrlFn();
                        });
                    }
                } else {
                    SweetAlert.swal({
                        title: "Error",
                        text: "Please enter required fields",
                        type: "error",
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Ok",
                        closeOnConfirm: true});
                }
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
            $scope.toggleEdit = function () {
                $scope.filter.edit = !$scope.filter.edit;
                $scope.edit = !$scope.edit;
                $scope.filter.preview = !$scope.filter.preview
                $scope.removeRelated = function (i) {
                    $scope.dataDefect.related_tasks.splice(i, 1);
                };
                var addRelated = document.getElementById('relatedforce');
                if ($scope.filter.edit) {
                    currencyButton.removeAttribute("disabled");
                } else {
                    currencyButton.setAttribute("disabled", true);
                }
                
            }
            $scope.deleteDefect = function (toBeDeleted) {
                SweetAlert.swal({
                    title: "Are you sure?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false},
                        function (isConfirm) {
                            if (isConfirm) {
                                DefectsService.delete_defect(toBeDeleted).then(function (result) {
                                    $scope.$broadcast('reloadDefects');
                                    SweetAlert.swal({title: "Done!", type: "success"});
                                    $scope.someCtrlFn();
                                });
                            }
                        });

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
            $scope.$watch('dial', function (value) {
                if (value) {
                    if (value.id && value.id !== 0) {                     
                        $(canvasDiv).html("");
                        $scope.photos_preview = [];
                        $scope.filter.uploadphotos = [];
                        DefectsService.list_comments(value.id).then(function (comments) {
                            $scope.filter.comments = comments;
                        });
                        $scope.parseService(value.id);
                        $scope.filter.preview = true;
                        $scope.filter.edit = false;
                        $scope.edit = false;
                        $rootScope.editRelated = false;
                        $scope.uploader = {};
                        $scope.filter.deletePhotos = [];
                        delete $scope.files;
                        if(value.edit === 'edit'){
                            $scope.toggleEdit();
                        };
                    } else {
                        $(canvasDiv).html("");
                        $scope.noFlow = {};
                        delete $scope.files;
                        $scope.uploader = {};
                        $scope.dataDefect = {};
                        $scope.photos_preview = [];
                        $scope.filter.deletePhotos = [];
                        $scope.filter.uploadphotos = [];
                        $scope.filter.preview = true;
                        $scope.filter.edit = true;
                        $scope.edit = false;
                        $rootScope.editRelated = false;
                        $scope.toggle();
                    }
                }
            });
            var currencyButton = document.getElementById('currencyButton');
            $scope.$on('$destroy', function () {
            });
        }
    }
])