dsApp.controller('_DefectCommentsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$indexedDB',
    '$ionicPopup',
    '$filter',
    'DefectsService',
    'SettingsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $ionicPopup, $filter, DefectsService, SettingsService) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.local = {};
        $scope.local.loaded = false;
        $scope.local.data = sessionStorage.getObject('ds.defect.active.data');

        $indexedDB.openStore('projects', function(store) {
            store.find($rootScope.projId).then(function(project) {
                var defect = $filter('filter')(project.defects, {
                    id: ($stateParams.id)
                })[0];
                $scope.local.loaded = true;
                $scope.local.list = defect.comments;
            })
        })
        if (document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen) {
            setTimeout(function() {
                screen.orientation.lock('portrait')
            }, 200);
        }
        $scope.addComment = function() {
            if ($scope.local.comment) {
                $indexedDB.openStore('projects', function(store) {
                    store.find($rootScope.projId).then(function(project) {
                        var userInfo = $filter('filter')(project.users, {
                            login_name: (localStorage.getObject('ds.user').name)
                        });
                        if (userInfo && userInfo.length) {
                            request = {
                                "id": 0,
                                "text": $scope.local.comment,
                                "user_id": userInfo[0].id,
                                "user_name": userInfo[0].first_name + " " + userInfo[0].last_name,
                                "defect_id": $stateParams.id,
                                "date": Date.now()
                            };
                        } else {
                            request = {
                                "id": 0,
                                "text": $scope.local.comment,
                                "user_id": 0,
                                "user_name": "Super Admin",
                                "defect_id": $stateParams.id,
                                "date": Date.now()
                            };
                        }
                        var defect = $filter('filter')(project.defects, {
                            id: $stateParams.id
                        })[0];
                        if (typeof defect.isNew == 'undefined') {
                            defect.isModified = true;
                            request.isNew = true;
                        }
                        project.isModified = true;
                        defect.comments.push(request);
                        $scope.local.comment = '';
                        $scope.local.list = defect.comments;
                        saveChanges(project);
                    })
                })
            }
        }

        function saveChanges(project) {
            $indexedDB.openStore('projects', function(store) {
                store.upsert(project).then(
                    function(e) {
                        store.find($rootScope.projId).then(function(project) {})
                    },
                    function(e) {
                        var offlinePopup = $ionicPopup.alert({
                            title: "Unexpected error",
                            template: "<center>An unexpected error occurred while trying to add a comment</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                    })
            })
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
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }
        $scope.list = ['wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut'];
    }
]);
