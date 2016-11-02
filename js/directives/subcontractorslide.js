angular.module($APP.name).directive('subcontractorslide', [
    'SelectDrawingService',
    '$rootScope',
    'createDialog',
    'DefectsService',
    'ConvertersService',
    '$anchorScroll',
    '$location',
    'SubcontractorsService',
    'SweetAlert',
    'flowFactory',
    'Upload',
    'DrawingsService',
    function (SelectDrawingService, $rootScope, createDialog, DefectsService, ConvertersService, $anchorScroll, $location, SubcontractorsService, SweetAlert, flowFactory, Upload, DrawingsService) {
        return {
            restrict: 'EA',
            link: link,
            scope: {
                'id': '=',
                'dial': '=',
                'defects': '=',
                'someCtrlFn': '&callback'
            },
            templateUrl: 'templates/_subcontractors.html'
        };
        function link($scope, $elem, $attrs, $ctrl) {
            var canvasDiv = $("#canvasSubDiv");
            $(canvasDiv).html("");
            $scope.filter = {};
            $scope.dataObj = {};
            $scope.uploader = [];
            $scope.existingFlowObject = flowFactory.create({
            });
            $scope.filter.currency = {
                currency_id: 0,
                currency_name: "EUR"
            }
            $scope.existingFlowObject = flowFactory.create({});
            $scope.filter.active = false;
            $scope.filter.photos = [];
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

            $scope.toggleCurrency = function () {
                switch ($scope.filter.currency.currency_id) {
                    case 0:
                    {
                        $scope.filter.currency.currency_id = 1;
                        $scope.filter.currency.currency_name = "USD";
                        break;
                    }
                    case 1:
                    {
                        $scope.filter.currency.currency_id = 2;
                        $scope.filter.currency.currency_name = "GBP";
                        break;
                    }
                    case 2:
                    {
                        $scope.filter.currency.currency_id = 0;
                        $scope.filter.currency.currency_name = "EUR";
                        break;
                    }
                }
            }

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
                } else {
                    $scope.filter.active = !$scope.filter.active;
                    $scope.dataObj.email = '';
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
                if ($scope.dataDefect.id) {
                    var request;
                    DefectsService.update(ConvertersService.update_defect($scope.dataObj)).then(function (result) {
                        if ($scope.filter.deletePhotos.length) {
                            DefectsService.delete_photos($scope.filter.deletePhotos).then(function (result) {
                            });
                        }
                        if ($scope.dataObj.comment) {
                            request = {
                                "id": 0,
                                "text": $scope.dataObj.comment,
                                "user_id": 0,
                                "defect_id": $scope.dataObj.id
                            };
                            DefectsService.create_comment(request).then(function (result) {
                            });
                        }
                        if ($scope.filter.photos.length) {
                            request = angular.copy($scope.filter.uploadphotos);
                            angular.forEach(request, function (photo) {
                                photo.id = 0;
                                photo.defect_id = $scope.dataObj.id;
                                photo.project_id = $rootScope.project.id;
                            });
                            DefectsService.create_photos(request).then(function (result) {
                            });
                        }
                        $scope.filter.edit = false;
                        $scope.edit = false;
                        $scope.someCtrlFn();
                    })
                } else {
                    $scope.dataObj.project_id = $rootScope.project.id;
                    $scope.dataDefect.id = 0;
                    DefectsService.create(ConvertersService.create_defect($scope.dataObj)).then(function (result) {
                        var request;
                        if ($scope.dataObj.comment) {
                            request = {
                                "id": 0,
                                "text": $scope.dataObj.comment,
                                "user_id": 0,
                                "defectId": result
                            };
                            DefectsService.create_comment(request).then(function (result) {
                            });
                        }
                        if ($scope.filter.photos.length) {
                            request = angular.copy($scope.filter.uploadphotos);
                            angular.forEach(request, function (photo) {
                                photo.id = 0;
                                photo.defectId = result;
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
                            var canvasDiv = $("#canvasSubDiv");
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
            $scope.submitComment = function () {
                if (($scope.filter.edit || $scope.filter.preview) && $scope.dataObj.comment) {
                    var request = {
                        "id": 0,
                        "text": $scope.dataObj.comment,
                        "user_id": 0,
                        "defect_id": $scope.dataObj.id
                    };
                    DefectsService.create_comment(request).then(function (result) {
                        $scope.dataObj.comment = "";
                        DefectsService.list_comments($scope.dataObj.id).then(function (comments) {
                            $scope.filter.comments = comments;
                            $location.hash('commentinput');
                            $anchorScroll();
                        });
                    })
                }
            }

            $scope.parseService = function (predicate, id) {
                delete $scope.dataObj;
                if (predicate === 'invite') {
                    $scope.dataObj = {};
                    $scope.filter.email = '';
                    $scope.filter.invite = true;
                    $scope.filter.defect = false;
                }
                if (predicate === 'sub') {
                    if (id) {
                        SubcontractorsService.get(id).then(function (result) {
                            $scope.dataObj = result;
                            $scope.filter.preview = true;
                            $scope.filter.edit = false;
                            $scope.edit = false;
                        });
                    } else {
                        $scope.dataObj = {};
                        $scope.filter.preview = false;
                        $scope.filter.edit = false;
                        $scope.edit = false;
                    }
                    $scope.filter.invite = false;
                    $scope.filter.defect = false;
                }
                if (predicate === 'def') {
                    SubcontractorsService.get(id).then(function (result) {
                        $scope.photos_preview = [];
                        $scope.filter.photos = [];
                        $scope.subc = result;
                        $scope.dataObj = {};
                        $scope.dataObj.assignee_id = $scope.subc.id;
                        $scope.dataObj.assignee_name = $scope.subc.first_name + " " + $scope.subc.last_name;
                        $scope.filter.preview = false;
                        $scope.filter.edit = false;
                        $scope.edit = false;
                        $scope.filter.defect = true;
                        $scope.filter.invite = false;
                    });

                }
                $scope.filter.state = predicate;
                $scope.toggle(true);
            };
            $scope.inviteSub = function () {
                if ($scope.filter.state === 'invite') {
                    if ($scope.filter.email) {
                        SweetAlert.swal({
                            title: "Are you sure",
                            text: "you want to invite a new subcontractor?",
                            type: "warning",
                            showCancelButton: true,
                            showLoaderOnConfirm: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Yes",
                            closeOnConfirm: false},
                                function (isConfirm) {
                                    if (isConfirm) {
                                        SubcontractorsService.invite($scope.filter.email).then(function (result) {
                                            if (result.message === "The user has already been invited!") {
                                                window.onkeydown = null;
                                                window.onfocus = null;
                                                SweetAlert.swal("Error!", "An invitation was already sent to this email.", "error");
                                                $scope.filter.active = false;

                                            } else if (result.message === "User already exists!") {
                                                $scope.someCtrlFn();
                                                window.onkeydown = null;
                                                window.onfocus = null;
                                                SweetAlert.swal("Error!", "This user already exists", "error");

                                                $scope.filter.active = false;

                                            } else {
                                                window.onkeydown = null;
                                                window.onfocus = null;
                                                SweetAlert.swal("Success!", "Subcontractor invited.", "success");
                                                $scope.someCtrlFn();
                                                $scope.filter.active = false;
                                            }
                                        })
                                    }
                                })
                    } else {
                        window.onkeydown = null;
                        window.onfocus = null;
                        SweetAlert.swal("Error!", "Please insert a valid email address.", "error");
                    }
                }
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
            $scope.save = function () {
                $scope.validPass = false;
                if ($scope.dataObj.first_name && $scope.dataObj.last_name && $scope.dataObj.company && $scope.dataObj.password && $scope.dataObj.verifyPassword) {
                    if (!$scope.dataObj.email) {
                        window.onkeydown = null;
                        window.onfocus = null;
                        SweetAlert.swal("Error!", "Please insert a valid email address", "error");
                    } else if ($scope.dataObj.password && ($scope.dataObj.password == $scope.dataObj.verifyPassword)) {
                        $scope.validPass = true;
                    } else {
                        window.onkeydown = null;
                        window.onfocus = null;
                        SweetAlert.swal("Error!", "Passwords do not match", "error");
                    }
                    if (($scope.filter.state === 'sub') && $scope.validPass) {
                        if ($scope.dataObj.id) {
                            SweetAlert.swal({
                                title: "Are you sure",
                                text: "you want to create a new subcontractor?",
                                type: "warning",
                                showCancelButton: true,
                                showLoaderOnConfirm: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Yes",
                                closeOnConfirm: false},
                                    function (isConfirm) {
                                        if (isConfirm) {
                                            SubcontractorsService.update($scope.dataObj).then(function (result) {
                                                window.onkeydown = null;
                                                window.onfocus = null;
                                                SweetAlert.swal("Success!", "Subcontractor created.", "success");
                                                $scope.someCtrlFn();
                                                $scope.filter.active = false;

                                            });
                                        }
                                    })
                        } else {
                            SweetAlert.swal({
                                title: "Are you sure",
                                text: "you want to create this subcontractor?",
                                type: "warning",
                                showCancelButton: true,
                                showLoaderOnConfirm: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Yes",
                                closeOnConfirm: false},
                                    function (isConfirm) {
                                        if (isConfirm) {
                                            $scope.dataObj.user_name = $scope.dataObj.email;
                                            $scope.dataObj.id = 0;
                                            SubcontractorsService.create($scope.dataObj).then(function (result) {
                                                window.onkeydown = null;
                                                window.onfocus = null;
                                                SweetAlert.swal("Success!", "Subcontractor updated.", "success");
                                                $scope.someCtrlFn();
                                                $scope.filter.active = false;
                                            });
                                        }
                                    })
                        }
                    }
                } else {
                    window.onkeydown = null;
                    window.onfocus = null;
                    SweetAlert.swal("Error!", "Please complete all the required fields", "error");

                }

                if ($scope.filter.state === 'def') {
                    SweetAlert.swal({
                        title: "Are you sure",
                        text: "you want to create a new defect for this subcontractor?",
                        type: "warning",
                        showCancelButton: true,
                        showLoaderOnConfirm: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "Yes",
                        closeOnConfirm: false},
                            function (isConfirm) {
                                if (isConfirm) {
                                    $scope.dataObj.project_id = $rootScope.project.id;
                                    $scope.dataObj.currency_id = $scope.filter.currency.currency_id;
                                    $scope.dataObj.assignee_obj = {id: $scope.dataObj.assignee_id, name: $scope.dataObj.assignee_name};
                                    DefectsService.create(ConvertersService.create_defect($scope.dataObj)).then(function (result) {
                                        $scope.defectId = result;
                                        var request;
                                        if ($scope.dataObj.comment) {
                                            request = {
                                                "id": 0,
                                                "text": $scope.dataObj.comment,
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
                                                    defect_id: $scope.defectId,
                                                    drawing_id: result.id,
                                                }
                                                result.markers.push(auxPoint);

                                                DrawingsService.update(result).then(function (result) {});
                                            });
                                        }
                                        window.onkeydown = null;
                                        window.onfocus = null;
                                        $scope.someCtrlFn();
                                        SweetAlert.swal("Success!", "Subcontractor updated.", "success");
                                        $scope.filter.active = false;
                                    });
                                }
                            })

                }
            }
            $scope.delete = function () {
                SweetAlert.swal({
                    title: "Are you sure",
                    text: "you want to delete this subcontractor?",
                    type: "warning",
                    showCancelButton: true,
                    showLoaderOnConfirm: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    closeOnConfirm: false},
                        function (isConfirm) {
                            if (isConfirm) {
                                SubcontractorsService.delete($scope.dataObj.id).then(function (result) {
                                    window.onkeydown = null;
                                    window.onfocus = null;
                                    $scope.someCtrlFn();
                                    SweetAlert.swal("Success!", "Subcontractor deleted.", "success");
                                    $scope.filter.active = false;
                                })
                            }
                        })
            }
            $scope.toggleEdit = function () {
                $scope.filter.edit = true;
                $scope.edit = true;
            }
            $scope.$watch('dial', function (value) {
                if (value) {
                    $scope.isDrawing = false;
                    $(canvasDiv).html("");
                    $scope.uploader = {};
                    $scope.noFlow = {};
                    $scope.photos_preview = [];
                    $scope.filter.deletePhotos = [];
                    $scope.filter.uploadphotos = [];
                    $scope.filter.state = value.predicate;
                    $scope.filter.uploadphotos = [];
                    $scope.parseService(value.predicate, value.id);
                } else {
                    $scope.filter.uploadphotos = [];
                    $scope.isDrawing = false;
                }
            });
        }
    }
])