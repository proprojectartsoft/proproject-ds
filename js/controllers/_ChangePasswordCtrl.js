angular.module($APP.name).controller('_ChangePasswordCtrl', [
    '$rootScope', '$scope', 'SettingsService', 'fileUpload',
    function ($rootScope, $scope, SettingsService, fileUpload) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.pass = {
            oldPassword: '',
            newPassword1: '',
            newPassword2: ''
        }
        $scope.savePassword = function () {
            if ($scope.pass.newPassword1 == $scope.pass.newPassword2) {
                $scope.changePass = {old_password: $scope.pass.oldPassword, new_password: $scope.pass.newPassword1}
                SettingsService.change_password($scope.changePass).then(function (result) {
                    if (result.message == "Success") {
                        swal("Success", "Your password was changed successfuly", "success");
                    } else {
                        swal("Error", "Incorrect password", "warning");
                    }
                });
                $scope.$modalCancel();
            } else {
                swal("Error", "New passwords must match", "warning");
            }
        }
    }]);


