dsApp.controller('_DefectCommentsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$filter',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $filter) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.local = {};
        $scope.defect = $rootScope.currentDefect;
        $scope.local.list = $rootScope.currentDefect.comments;

        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.addComment = function() {
            if ($scope.local.comment) {
                var userInfo = $filter('filter')($rootScope.users, {
                    login_name: (localStorage.getObject('ds.user').name)
                });
                request = {
                    "id": 0,
                    "text": $scope.local.comment,
                    "user_id": userInfo && userInfo.length && userInfo[0].id || 0,
                    "user_name": userInfo && userInfo.length && (userInfo[0].first_name + " " + userInfo[0].last_name) || "Super Admin",
                    "defect_id": $stateParams.id,
                    "date": Date.now(),
                    "isNew": true
                };
                //indicate that the defect will be modified locally
                $scope.defect.modified = true;
                request.isNew = true;
                $scope.defect.comments.push(request);
                $scope.local.comment = '';
                $scope.local.list = $scope.defect.comments;
                if (typeof $scope.defect.isNew == 'undefined') {
                    $scope.defect.isModified = true;
                }
            }
        }

        $scope.addComentAtEnter = function(event) {
            if (event.keyCode === 13) {
                $scope.addComment();
            }
        }
        $scope.getInitials = function(str) {
            return SettingsService.get_initials(str);
        }
        $scope.back = function() {
            $rootScope.go('app.defects', {
                id: $stateParams.id
            })
        }
    }
]);
