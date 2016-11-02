angular.module($APP.name).controller('LoginCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    'AuthService',
    'CacheFactory',
    'SettingsService',
    'SweetAlert',
    function ($scope, $rootScope, $state, AuthService, CacheFactory, SettingsService, SweetAlert) {
        $scope.user = [];
        $scope.user.username = "";
        $scope.user.password = "";
        $scope.user.rememberMe = false;
        $scope.filter = {state: 'login'};

        AuthService.init().then(function (result) {
            if (result.status === 200) {
                $state.go('app.home')
            }
        });

        var rememberCache = CacheFactory.get('rememberCache');
        if (!rememberCache) {
            rememberCache = CacheFactory('rememberCache');
            rememberCache.setOptions({
                storageMode: 'localStorage'
            });
        }

        $scope.hasRemember = rememberCache.get('remember');
        if ($scope.hasRemember) {
            $scope.user.username = $scope.hasRemember.username;
            $scope.user.password = $scope.hasRemember.password;
            $scope.user.rememberMe = true;
        }

        $scope.login = function () {
            AuthService.login({
                username: $scope.user.username,
                password: $scope.user.password
            }).then(function (response) {
                if (!response.status) {
                    $rootScope.currentUser = response;
                    SettingsService.init_settings();
                    var rememberCache = CacheFactory.get('rememberCache');
                    if (rememberCache) {
                        if ($scope.user.rememberMe) {
                            rememberCache.put('remember', {'username': $scope.user.username, 'password': $scope.user.password});
                        } else {
                            rememberCache.destroy();
                        }
                    }
                    $state.go("app.home");
                } else {
                    if (response.status === 401) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "Your account has been de-activated. Contact your supervisor for further information.",
                            type: "warning",
                            showCancelButton: false,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            showLoaderOnConfirm: false,
                            closeOnConfirm: true
                        });
                    }
                    if (response.status === 400) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "Incorrect user data.",
                            type: "warning",
                            showCancelButton: false,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            showLoaderOnConfirm: false,
                            closeOnConfirm: true
                        });
                    }
                    if (response.status === 502 || response.status === 404 || response.status === 1 || response.status === 0) {
                        SweetAlert.swal({
                            title: "Error",
                            text: "Server offline.",
                            type: "warning",
                            showCancelButton: false,
                            confirmButtonColor: "#DD6B55",
                            confirmButtonText: "Ok",
                            showLoaderOnConfirm: false,
                            closeOnConfirm: true
                        });
                    }
                }

            })
        };
        $scope.keydown = function (event, predicate) {
            if (event.keyCode === 13) {
                if (predicate === 'email') {
                    $('#loginpassword').focus();
                } else {
                    $scope.login();
                }
            }
        }
        $scope.forgot = function () {
            if (!$scope.validateEmail($scope.filter.username)) {
                window.onkeydown = null;
                window.onfocus = null;
                SweetAlert.swal("Error!", "Please enter a valid email.", "error");
            } else {
                SweetAlert.swal({
                    title: "Are you sure",
                    text: "you want to send a password reset request?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes",
                    showLoaderOnConfirm: true,
                    closeOnConfirm: false},
                        function (isConfirm) {
                            if (isConfirm) {
                                AuthService.forgotpassword($scope.filter.username,true).then(function (result) {
                                    $scope.filter.username = "";
                                    window.onkeydown = null;
                                    window.onfocus = null;
                                    SweetAlert.swal("Success!", "An e-mail with instructions on how to reset your password has been sent to you.", "success");
                                    $state.go('login');
                                });
                            }
                        });
            }
        };
        $scope.validateEmail = function (mail) {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
            {
                return (true);
            }
            return (false);
        }

    }

]);