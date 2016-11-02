angular.module($APP.name).controller('DrawingsCtrl', [
    '$rootScope', '$scope', 'SelectDrawingService', 'createDialog', 'DrawingsService', 'SettingsService', '$timeout', 'SweetAlert',
    function ($rootScope, $scope, SelectDrawingService, createDialog, DrawingsService, SettingsService, $timeout, SweetAlert) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        SettingsService.init_settings();
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.checkAll = false;
        $scope.setloc = false;
        $('body').css('cursor','auto')

        DrawingsService.list($rootScope.project.id).then(function (result) {
            $scope.drawings = result;
        })

        $timeout(function () {
            $scope.current_user = $rootScope.current_user;
        });

        $scope.setCheck = function () {
            if (!$scope.checkAll) {
                angular.forEach($scope.drawings, function (value) {
                    value.checkit = true;
                    $scope.checkAll = true;
                });
            } else {
                angular.forEach($scope.drawings, function (value) {
                    value.checkit = false;
                    $scope.checkAll = false;
                });
            }
        }

        $scope.imgPosition = $(".main-drawings .outline");
        $scope.moveToLeft = function () {
            $scope.imgPosition.animate({
                left: "-=100"
            });
        };
        $scope.moveToRight = function () {
            $scope.imgPosition.animate({
                left: "+=100"
            });
        };

        $scope.selectDrawing = function () {
            $rootScope.modalLock = true;
            SelectDrawingService('templates/photoModal.html', {
                id: 'complexDialog',
                title: $scope.drawings,
                backdrop: true,
                controller: 'SelectDrawingCtrl',
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

        $scope.editDrawing = function (item) {
            $rootScope.editDrawing = item;
            createDialog('templates/_edit_drawing.html', {
                id: 'complexDialog',
                backdrop: true,
                controller: '_EditDrawingCtrl',
                modalClass: 'modal de-drawings-edit',
                success: {label: 'Success', fn: function () {
                    }}
            }, {
                title: 'Edit Drawing'
            });
        }
        $scope.addDrawing = function () {
            $rootScope.addDrawing = false;
            createDialog('templates/_add_drawing.html', {
                id: 'complexDialog',
                backdrop: true,
                controller: '_AddDrawingCtrl',
                modalClass: 'modal de-drawings-edit',
                success: {label: 'Success', fn: function () {
                    }}
            }, {
                title: 'Add Drawing'
            });
        }
        $scope.deleteDrawings = function () {
            $scope.drawingsToDelete = [];
            angular.forEach($scope.drawings, function (value) {
                if (value.checkit) {
//                    var aux = {id: value.id}
                    $scope.drawingsToDelete.push(value.id);
                }
            })
            if($scope.drawingsToDelete.length){
            SweetAlert.swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete them!",
                closeOnConfirm: false},
                    function (isConfirm) {
                        if(isConfirm){
                        DrawingsService.delete_drawings($scope.drawingsToDelete).then(function (result) {
                            SweetAlert.swal({title: "Done!", type: "success"});
                           $scope.$broadcast('reloadDrawings');
                           
                        });
                    };
                });
            };
            };
        $scope.deleteDrawing = function (toBeDeleted) {
            SweetAlert.swal({
                title: "Are you sure?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false},
                    function (isConfirm) {
                        if(isConfirm){
                        DrawingsService.delete(toBeDeleted.id).then(function (result) {
                            $scope.$broadcast('reloadDrawings');
                            SweetAlert.swal({title: "Done!", type: "success"});
                        });
                       }; 
                    });

        }
        $scope.$on('reloadDrawings', function (event, args) {
            DrawingsService.list($rootScope.project.id).then(function (result) {
                $scope.drawings = result;
            })
        });
        $scope.sort = {
            active: '',
            descending: undefined
        }

        $scope.changeSorting = function (column) {

            var sort = $scope.sort;

            if (sort.active == column) {
                sort.descending = !sort.descending;
            } else {
                sort.active = column;
                sort.descending = false;
            }
        };

        $scope.getIcon = function (column) {

            var sort = $scope.sort;

            if (sort.active == column) {
                return sort.descending
                        ? 'img/ic/action/arrow_up_2.png'
                        : 'img/ic/action/arrow_down_2.png';
            }

            return 'img/ic/action/arrow_down_2.png';
        }
    }
]);