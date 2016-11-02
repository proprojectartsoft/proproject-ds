angular.module($APP.name).controller('SubcontractorCtrl', [
    '$rootScope', '$scope', 'SubcontractorsService', '$stateParams', 'DefectsService', '$location', '$anchorScroll', 'SweetAlert',
    function ($rootScope, $scope, SubcontractorsService, $stateParams, DefectsService, $location, $anchorScroll, SweetAlert) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        SubcontractorsService.get($stateParams.id).then(function (result) {
            $scope.subcontractor = result;
        });

        SubcontractorsService.list_defects($stateParams.id).then(function (result) {
            $scope.defects = result;
        });
        $scope.toggleDefect = function (id) {
            $scope.dial = {
                id: id
            };
        };
        $scope.listComments = function () {
            SubcontractorsService.list_comments($stateParams.id).then(function (result) {
                $scope.comments = result;
                $location.hash('commentinput');
                $anchorScroll();
            })
        };

        $scope.submitComment = function () {
            $scope.aux = {
                subcontractor_id: $stateParams.id,
                comment: $scope.comment,
                project_id: $rootScope.project.id
            }
            if ($scope.aux.comment) {
                SubcontractorsService.create_comment($scope.aux).success(function (response) {
                    $scope.comment = "";
                    $scope.listComments();
                }).error(function (response) {
                    console.log('error');
                })
            } else {
                window.onkeydown = null;
                window.onfocus = null;
                SweetAlert.swal("Error!", "There is no comment to post", "error");
            }
        };
        $scope.submitCommentOnEnter = function (event) {
            if (event.keyCode === 13) {
                $scope.submitComment();
            }
        };

        $scope.listComments();

    }
]);