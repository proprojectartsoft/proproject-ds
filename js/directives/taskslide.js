angular.module($APP.name).directive('taskslide', [
    'SelectDrawingService',
    '$rootScope',
    'createDialog',
    'DefectsService',
    'ConvertersService',
    '$anchorScroll',
    '$location',
    function (SelectDrawingService, $rootScope, createDialog, DefectsService, ConvertersService, $anchorScroll, $location) {
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
            $scope.filter = {};
            $scope.dataDefect = {};
            $scope.filter.active = false;
            $scope.filter.photos = [];
            $scope.current_user = $rootScope.current_user;

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
                angular.forEach($scope.filter.photos, function (img) {
                    if (img.id === item.uniqueIdentifier) {
                        $scope.selected = img;
                    }
                })
                createDialog('templates/_photo_modal.html', {
                    id: 'complexDialog',
                    title: 'Title: ',
                    backdrop: true,
                    success: {label: 'Success', fn: function () {
                        }}
                }, {
                    myVal: 15,
                    assetDetails: {
                        name: 'My Asset',
                        description: 'A Very Nice Asset'
                    },
                    selectedImg: $scope.selected
                });
            };
            $scope.processFiles = function (files) {
                angular.forEach(files, function (flowFile, i) {
                    var fileReader = new FileReader();
                    fileReader.onload = function (event) {
                        var uri = event.target.result;
                        uri = uri.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
                        $scope.filter.photos.push({
                            "id": flowFile.uniqueIdentifier,
                            "title": " ",
                            "defect_id": 0,
                            "project_id": 0,
                            "file_name": flowFile.name,
                            "base_64_string": uri
                        });
                    };
                    fileReader.readAsDataURL(flowFile.file);
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

            $scope.toggle = function (value) {
                if (value) {
                    $scope.filter.active = value;
                }
                else {
                    $scope.filter.active = !$scope.filter.active;
                }
            };

            $scope.selectDrawing = function () {
                $rootScope.modalLock = true;
                SelectDrawingService('templates/photoModal.html', {
                    id: 'testDialog',
                    title: $scope.drawings,
                    backdrop: true,
                    controller: 'SelectDrawingCtrl',
                    modalClass: 'de-photomodal modal',
                    success: {label: 'Success', fn: function () {
                        }}
                }, {
                    drawings: $scope.drawings,
                    assetDetails: {
                        name: 'My Asset',
                        description: 'A Very Nice Asset'
                    }
                });
            };

            $scope.create = function () {
                if ($scope.filter.preview && $scope.filter.edit) {
                    var request;
                    DefectsService.update(ConvertersService.update_defect($scope.dataDefect)).then(function (result) {
                        if ($scope.filter.deletePhotos) {
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
                        if ($scope.filter.photos && $scope.filter.photos.length > 0) {
                            request = angular.copy($scope.filter.photos);
                            angular.forEach(request, function (photo) {
                                photo.id = 0;
                                photo.defect_id = $scope.dataDefect.id;
                                photo.project_id = $rootScope.project.id;
                            });
                            DefectsService.create_photos(request).then(function (result) {
                            });
                        }
                        $scope.filter.edit = false;
                        $scope.edit = false;
                        $scope.someCtrlFn();
                    })
                }
                else {
                    $scope.dataDefect.project_id = $rootScope.project.id;
                    DefectsService.create(ConvertersService.create_defect($scope.dataDefect)).then(function (result) {
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
                        if ($scope.filter.photos && $scope.filter.photos.length > 0) {
                            request = angular.copy($scope.filter.photos);
                            angular.forEach(request, function (photo) {
                                photo.id = 0;
                                photo.defect_id = result;
                                photo.project_id = $rootScope.project.id;
                            });
                            DefectsService.create_photos(request).then(function (result) {
                            });
                        }
                        $scope.filter.active = false;
                        $scope.someCtrlFn();
                    });
                }
            }

            $scope.parseService = function (id) {
                DefectsService.get(id).then(function (result) {
                    $scope.dataDefect = ConvertersService.preview_defect(result);
                    if (result.number_of_photos > 0) {
                        DefectsService.list_photos(result.id).then(function (photos) {
                            $scope.photos_preview = photos;
                            $scope.toggle(true);
                        });
                    }
                    else {
                        if (result.number_of_comments > 0) {
                            DefectsService.list_comments(result.id).then(function (comments) {
                                $scope.filter.comments = comments;
                                $scope.toggle(true);
                            });
                        }
                        else {
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
                $scope.filter.edit = true;
                $scope.edit = true;
            }
            $scope.$watch('dial', function (value) {
                if (value) {
                    if (value.id && value.id !== 0) {
                        $scope.parseService(value.id);
                        $scope.filter.preview = true;
                        $scope.filter.edit = false;
                        $scope.edit = false;
                    }
                    else {
                        $scope.dataDefect = {};
                        $scope.filter.photos = [];
                        $scope.filter.preview = false;
                        $scope.filter.edit = false;
                        $scope.edit = false;
                        $scope.toggle();
                    }
                }
            });
            $scope.$on('$destroy', function () {                
//                $scope.filter.active = false;
            });
        }
    }
])