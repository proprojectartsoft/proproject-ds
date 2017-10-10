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
        vm.pictures = $rootScope.currentDefect.photos.pictures || [];
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

        goToTop();
        pullDown();

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
                        defect_id: $rootScope.currentDefect.id,
                        file_name: "",
                        project_id: $rootScope.currentDefect.project_id,
                        tags: null,
                        title: ""
                    };
                    vm.pictures.push(pic);
                    //indicate that the defect needs to be modified in local db
                    if ($rootScope.currentDefect.id != 0) {
                        $rootScope.currentDefect.modified = true;
                        if (typeof $rootScope.currentDefect.isNew == 'undefined') {
                            //indicate that the defect needs to be modified on server
                            $rootScope.currentDefect.isModified = true;
                        }
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
                        defect_id: $rootScope.currentDefect.id,
                        file_name: "",
                        project_id: $rootScope.currentDefect.project_id,
                        tags: null,
                        title: ""
                    };
                    vm.pictures.push(pic);
                    //indicate that the defect needs to be modified in local db
                    if ($rootScope.currentDefect.id != 0) {
                        $rootScope.currentDefect.modified = true;
                        if (typeof $rootScope.currentDefect.isNew == 'undefined') {
                            //indicate that the defect needs to be modified on server
                            $rootScope.currentDefect.isModified = true;
                        }
                    }
                    pullDown();
                });
            }, function(err) {});
        }

        function removePicture(pic, index) {
            var popup = $ionicPopup.alert({
                title: "Are you sure",
                template: "<center>you want to delete it?</center>",
                content: "",
                buttons: [{
                        text: 'Ok',
                        type: 'button-positive',
                        onTap: function(e) {
                            vm.pictures.splice(index, 1);
                            //indicate that the defect needs to be modified in local db
                            if ($rootScope.currentDefect.id != 0) {
                                $rootScope.currentDefect.modified = true;
                                //if not a new photo, add it to dataToDelete
                                if (typeof $rootScope.currentDefect.isNew == 'undefined' && pic.id) {
                                    var idPic = {
                                        id: pic.id
                                    };
                                    vm.dataToDelete.push(pic);
                                    //remove the photo from the list of photos to be updated on server
                                    vm.dataToUpdate = vm.dataToUpdate.filter(function(obj) {
                                        return obj.id !== pic.id;
                                    });
                                    $rootScope.currentDefect.isModified = true;
                                }
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
                //indicate that the defect needs to be modified in local db
                if ($rootScope.currentDefect.id != 0) {
                    $rootScope.currentDefect.modified = true;
                    if (vm.currentPhoto.id) {
                        //if not a new photo, add it to dataToUpdate
                        vm.dataToUpdate.push(vm.currentPhoto);
                        $rootScope.currentDefect.isModified = true;
                    }
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
            } else
                //go back to a diary
                $rootScope.go('app.' + predicate, {
                    id: $rootScope.currentDefect.id
                });
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
