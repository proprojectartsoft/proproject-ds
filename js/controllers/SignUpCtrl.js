angular.module($APP.name).controller('SignUpCtrl', [
    'SweetAlert',
    '$scope',
    '$stateParams',   
    '$state',
    'SubcontractorsService',
    function (SweetAlert, $scope, $stateParams,  $state, SubcontractorsService) {
        $scope.user = {};
        $scope.user.email = $stateParams.email;
        
//        
//        $scope.data.customer_id = $stateParams.customerId;
//        $scope.data.login_name = $stateParams.email;
//        $scope.data.role_id = 1;
//        $scope.data.projects = [];
//        console.log($stateParams.customerId)
//        AuthService.logout();

        $scope.submitData = function (user) {
            $scope.user.user_name = $scope.user.email;
            if ($scope.user.password !== $scope.user.passwordtest) {
                SweetAlert.swal({
                    title: "Error",
                    text: "Passwords don't match.",
                    type: "error",
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Ok",
                    closeOnConfirm: true}
                );
            } else {
                $scope.user.id = 0;
                SubcontractorsService.signup($scope.user).success(function (response) {
                    if (response === -1) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "User already exists.",
                            showCancelButton: true,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            closeOnConfirm: true},
                        function (isConfirm) {
                            if (isConfirm) {
                                $state.go('login');
                            }
                        })
                    } else {
                        $state.go('login');
                    }
                }).error(function (response, status) {
                    if (status === 400) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "Sign up unavailable.",
                            type: "error",
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            closeOnConfirm: true},
                        function (isConfirm) {
                            if (isConfirm) {
                                $state.go('login');
                            }
                        })
                    }
                    if (status === 404 || status === 502) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "Server offline.",
                            type: "error",
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            closeOnConfirm: true}
                        );
                    }
                });
            }


        };
    }
]);