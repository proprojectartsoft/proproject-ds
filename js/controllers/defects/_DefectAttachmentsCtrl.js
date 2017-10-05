dsApp.controller('_DefectAttachmentsCtrl', [
    '$rootScope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$ionicScrollDelegate',
    '$ionicPopup',
    '$cordovaCamera',
    function($rootScope, $stateParams, $state, SettingsService, $timeout, $ionicScrollDelegate, $ionicPopup, $cordovaCamera) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.tabActive = $rootScope.currentTab;
        vm.settings.entityId = $stateParams.id;
        vm.takePicture = takePicture;
        vm.addPicture = addPicture;
        vm.removePicture = removePicture;
        vm.testPicture = testPicture;
        vm.local = {};
        vm.dataToDelete = [];
        vm.dataToUpdate = [];
        vm.pictures = $rootScope.currentDefect.photos.pictures;
        vm.substate = 'gallery';
        var backupPic = null;

        //set the title for this page
        if ($stateParams.id === '0') {
            vm.settings.subHeader = 'New defect'
        } else {
            vm.settings.subHeader = 'Defect - ' + $rootScope.currentDefect.title;
        }

        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }

        angular.forEach(vm.pictures, function(value) {
            //create the src for the attachment by concatenating the serevr path, the directory and the image path
            value.url = $APP.server + 'pub/defectPhotos/' + value.base_64_string;
        });
        pullDown();
        goToTop();

        // $timeout(function() {
        //     $('.ds-attachments').find('img').each(function() {
        //         var aux = {};
        //         var imgStyle = (this.width / this.height > 1) ? 'height' : 'width';
        //         aux[imgStyle] = '100%'
        //         $(this).css(aux);
        //     })
        // });

        function testPicture(pic) {
            vm.substate = 'pic';
            backupPic = angular.copy(pic);
            vm.currentPhoto = pic;
            goToTop();
        }

        function takePicture() {
            if (!Camera) return false;
            var options = {
                quality: 40,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: false,
                encodingType: Camera.EncodingType.JPEG,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                $timeout(function() {
                    var pic = {
                        base_64_string: imageData,
                        comment: null,
                        defect_id: vm.diaryId,
                        file_name: "",
                        project_id: vm.projectId,
                        tags: null,
                        title: "",
                    };
                    vm.pictures.push(pic);
                    if (typeof $scope.defect.isNew == 'undefined') {
                        $rootScope.currentDefect.modified = true;
                        $rootScope.currentDefect.isModified = true;
                    }
                    pullDown();
                });
            }, function(err) {});
        }

        function addPicture() {
            if (!Camera) return false;
            var options = {
                maximumImagesCount: 1,
                quality: 40,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                correctOrientation: true,
                allowEdit: false
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                $timeout(function() {
                    var pic = {
                        base_64_string: imageData,
                        comment: null,
                        defect_id: vm.diaryId,
                        file_name: "",
                        project_id: vm.projectId,
                        tags: null,
                        title: "",
                    };
                    vm.pictures.push(pic);
                    if (typeof $scope.defect.isNew == 'undefined') {
                        $rootScope.currentDefect.modified = true;
                        $rootScope.currentDefect.isModified = true;
                    }
                    pullDown();
                });
            }, function(err) {});
        }

        function removePicture(pic) {
            //TODO:
            // delete_photos: function(dataIn) {
            //     return $http({
            //         method: 'POST',
            //         url: $APP.server + 'api/defectphoto',
            //         data: dataIn
            //     }).then(
            //         function(payload) {
            //             return payload.data;
            //         }
            //     );
            // },
            var popup = $ionicPopup.alert({
                title: "Are you sure",
                template: "<center>you want to delete it?</center>",
                content: "",
                buttons: [{
                        text: 'Ok',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (pic.id) {
                                var idPic = {
                                    id: pic.id
                                };
                                vm.dataToDelete.push(idPic);
                            }
                            vm.pictures.splice(index, 1);
                            if (typeof $scope.defect.isNew == 'undefined') {
                                $rootScope.currentDefect.modified = true;
                                $rootScope.currentDefect.isModified = true;
                            }
                            pullDown();
                            popup.close();
                        }
                    },
                    {
                        text: 'Cancel',
                        onTap: function(e) {
                            popup.close();
                        }
                    }
                ]
            });
        }

        function returnToGallery() {
            goToTop();
            pullDown();
            if ((backupPic.comment != vm.currentPhoto.comment || backupPic.title != vm.currentPhoto.title) && vm.dataToUpdate.indexOf(vm.currentPhoto) == -1) {
                vm.dataToUpdate.push(vm.currentPhoto);
                if (typeof $scope.defect.isNew == 'undefined') {
                    $rootScope.currentDefect.modified = true;
                    $rootScope.currentDefect.isModified = true;
                }
            }
            vm.substate = 'gallery';
        }

        vm.go = function(predicate, item) {
            $rootScope.currentDefect.photos = {
                pictures: vm.pictures,
                toBeDeleted: vm.dataToDelete,
                toBeUpdated: vm.dataToUpdate
            };
            if (vm.substate === 'pic') {
                //go back from view full picture
                returnToGallery();
            } else if (vm.diaryId) {
                //go back for existing diary
                $state.go('app.' + predicate, {
                    id: vm.diaryId
                });
            } else {
                //go back for a new diary
                $state.go('app.' + predicate, {
                    id: item
                });
            }
        }

        function pullDown() {
            $('html').css({
                'visibility': 'hidden'
            });
            angular.element(document).ready(function() {
                $timeout(function() {
                    $('.pull-down').each(function() {
                        var $this = $(this);
                        var h = $this.parent().height() - $this.height() - $this.next().height();
                        $this.css({
                            'padding-top': h
                        });
                    });
                    document.getElementsByTagName("html")[0].style.visibility = "visible";
                }, 100);
            })
        }

        function goToTop() {
            $timeout(function() { // we need little delay
                $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop();
            });
        }
    }
]);
