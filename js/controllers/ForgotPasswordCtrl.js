angular.module($APP.name).controller('ForgotPasswordCtrl', [
    '$stateParams',
    '$scope',
    '$state',
    'AuthService',
    'SweetAlert',
    function ($stateParams, $scope, $state, AuthService, SweetAlert) {
        $scope.user = {};
        $scope.user.email = $stateParams.email;
        $scope.user.password = "";
        $scope.user.verifypassword = "";

        $scope.submit = function () {
            if ($scope.user.password !== $scope.user.verifypassword) {
                SweetAlert.swal({
                    title: "Passwords don't match",
                    text: "try again?",
                    type: "error",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    closeOnConfirm: true}
                );
            } else {
                AuthService.forgotpassword_submit($scope.user.email, $scope.user.password)
                        .then(function (response) {
                            window.onkeydown = null;
                            window.onfocus = null;
                            SweetAlert.swal("Success!", "Password changed.", "success");
                            $state.go("login");
                        });
            }

        };
    }

]);