angular.module($APP.name).controller('HomeCtrl', [
    '$rootScope', '$scope', 'AuthService', '$state', 'SettingsService', 'createDialog', 'CacheFactory',
    function ($rootScope, $scope, AuthService, $state, SettingsService, createDialog, CacheFactory) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.editMode = {
            basic: false,
            sub: false,
            full: false,
        }
        AuthService.init().then(function (result) {
            if (result.status !== 200) {
                $state.go('login')
            }
        });
        SettingsService.my_account().then(function (result) {
            $rootScope.userProfileData = result;
        });
        SettingsService.get_logo().then(function (result) {
            $rootScope.userLogo = result;
        });
        
        SettingsService.notification().then(function (result) {
            $rootScope.notification = result;
        });
        SettingsService.activity_stream(1).then(function (result) {
            $scope.recentActivityData = result;
        });
        $scope.toggleDefect = function (id) {
            $scope.dial = {
                id: id
            };
        };
        $scope.sort = {
            active: '',
            descending: undefined
        }

        $scope.processFiles = function (files) {
            angular.forEach(files, function (flowFile, i) {
                var fileReader = new FileReader();
                fileReader.onload = function (event) {
                    var uri = event.target.result;
                    $scope.$apply(function () {
                        $rootScope.userProfileData.company_logo = uri;
                    });
                };
                fileReader.readAsDataURL(flowFile.file);
            });
        };

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
                        ? 'img/ic/action/arrow_up.png'
                        : 'img/ic/action/arrow_down.png';
            }
            return 'img/ic/action/sorting_white.png';
        }
        $scope.editCurrentUser = function () {
            $scope.editingUser = angular.copy($rootScope.userProfileData);
            switch ($rootScope.current_user.roleDs.id) {
                case 0:
                    $scope.editMode.basic = !$scope.editMode.basic;
                    break;
                case 1:
                    $scope.editMode.basic = !$scope.editMode.basic;
                    $scope.editMode.sub = !$scope.editMode.sub;
                    break;
                case 2:
                    $scope.editMode.basic = !$scope.editMode.basic;
                    $scope.editMode.sub = !$scope.editMode.sub;
                    $scope.editMode.full = !$scope.editMode.full;
                    break;
                default:
                    $scope.editMode.basic = !$scope.editMode.basic;
                    $scope.editMode.sub = !$scope.editMode.sub;
                    $scope.editMode.full = !$scope.editMode.full;
            }
        }
        $scope.update = function () {
            var aux = angular.copy($scope.editingUser);
            aux.company_logo = $rootScope.userProfileData.company_logo;
            SettingsService.update_my_account(aux).then(function (result) {
                SettingsService.my_account().then(function (result) {
                    $rootScope.userProfileData = result;
                });
                $scope.editCurrentUser();
            });
        }
        $scope.cancelEdit = function () {
            $scope.editingUser = {};
            $scope.editCurrentUser();
        }
        $scope.changePassword = function () {
            createDialog('templates/_change_password.html', {
                id: 'complexDialog',
                backdrop: true,
                controller: '_ChangePasswordCtrl',
                modalClass: 'modal de-drawings-edit',
                success: {label: 'Success', fn: function () {
                    }}
            }, {
                title: 'Change Password'
            });
        }
    }
]);