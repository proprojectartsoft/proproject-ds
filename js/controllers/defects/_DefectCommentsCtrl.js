angular.module($APP.name).controller('_DefectCommentsCtrl', [
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
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $indexedDB, $ionicPopup, $filter, DefectsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');

        $scope.local = {};
        $scope.local.loaded = false;
        $scope.local.data = localStorage.getObject('ds.defect.active.data');

        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject').id).then(function(project) {
                var defect = $filter('filter')(project.defects, {
                    id: ($stateParams.id)
                })[0];
                $scope.local.loaded = true;
                $scope.local.list = defect.comments;
            })
        })
        screen.orientation.lock('portrait');
        $scope.addComment = function() {
            if ($scope.local.comment) {
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject').id).then(function(project) {
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
                        store.find(localStorage.getObject('dsproject').id).then(function(project) {})
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
            if (str) {
                var aux = str.split(" ");
                return (aux[0][0] + aux[1][0]).toUpperCase();
            }
            return "";
        }
        $scope.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }
        $scope.list = ['wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut'];
    }
]);
