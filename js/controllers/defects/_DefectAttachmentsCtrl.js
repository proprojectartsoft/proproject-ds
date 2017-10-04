dsApp.controller('_DefectAttachmentsCtrl', [
    '$rootScope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$filter',
    'DefectsService',
    '$ionicScrollDelegate',
    function($rootScope, $stateParams, $state, SettingsService, $timeout, $filter, DefectsService, $ionicScrollDelegate) {
        var vm = this;
        vm.settings = {};
        vm.settings.subHeader = SettingsService.get_settings('subHeader');
        vm.settings.tabActive = $rootScope.currentTab;
        vm.settings.entityId = $stateParams.id;
        vm.local = {};
        vm.dataToDelete = [];
        vm.dataToUpdate = [];
        vm.pictures = $rootScope.currentDefect.photos;
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

        $timeout(function() {
            $('.ds-attachments').find('img').each(function() {
                var aux = {};
                var imgStyle = (this.width / this.height > 1) ? 'height' : 'width';
                aux[imgStyle] = '100%'
                $(this).css(aux);
            })
        });

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
                    pullDown();
                });
            }, function(err) {});
        }

        vm.removePicture = function(pic) {
            if (pic.id) {
                var idPic = {
                    id: pic.id
                };
                vm.dataToDelete.push(idPic);
            }
            vm.pictures.splice(index, 1);
            pullDown();
        }

        vm.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }

        vm.go = function(item) {
            $rootScope.currentPhoto = item;
            $state.go('app.photo', {
                id: $stateParams.id,
                photo: item.id
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
