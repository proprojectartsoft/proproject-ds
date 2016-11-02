angular.module($APP.name).controller('_ChangeLogoCtrl', [
    '$rootScope', '$scope', 'DrawingsService', 'fileUpload',
    function ($rootScope, $scope, DrawingsService, fileUpload) {
        $rootScope.activeMenu = false;
        $rootScope.activeProjects = false;
        $scope.filter = {};
        $scope.filter.hasImg = false;
        $rootScope.activeSearch = false;
        $rootScope.activeNotification = false;
        $scope.$watch('myFile', function (val) {
            $scope.auxLogo = val;
        });
        $scope.saveLogo = function () {
            $rootScope.userProfileData.company_logo = $scope.auxLogo;
            $scope.$modalCancel();
        }
    }]);


