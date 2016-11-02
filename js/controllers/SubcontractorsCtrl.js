angular.module($APP.name).controller('SubcontractorsCtrl', [
    '$rootScope', '$scope', 'SubcontractorsService', 'SettingsService', 'SweetAlert', '$timeout',
    function ($rootScope, $scope, SubcontractorsService, SettingsService, SweetAlert, $timeout) {
        $('body').css('cursor','auto')
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        SettingsService.init_settings();
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        SubcontractorsService.list($rootScope.project.id).then(function (result) {
            $scope.subcontractors = result;
        })

        $scope.toggleSubcontractor = function (predicate, id) {
            $scope.dial = {
                id: id,
                predicate: predicate
            };
        };

        $timeout(function () {
            $scope.current_user = $rootScope.current_user;
        });

        $scope.delete = function (id) {
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
                            
                            SubcontractorsService.delete(id).then(function (result) {
                                window.onkeydown = null;
                                window.onfocus = null;
                                $scope.reload();
                                SweetAlert.swal("Success!", "Subcontractor deleted.", "success");
                            })
                        }
                    })
        }
        $scope.reload = function () {
            SubcontractorsService.list($rootScope.project.id).then(function (result) {
                $scope.subcontractors = result;
            })
        }
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