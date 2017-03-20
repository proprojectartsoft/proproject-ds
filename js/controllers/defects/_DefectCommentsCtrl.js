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

        $scope.addComment = function() {
            if ($scope.local.comment) {
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject').id).then(function(project) {
                        var user = $filter('filter')(project.users, {
                            login_name: (localStorage.getObject('ds.user').name)
                        })[0];
                        request = {
                            "id": 0,
                            "text": $scope.local.comment,
                            "user_id": user.id,
                            "user_name": user.first_name + " " + user.last_name,
                            "defect_id": $stateParams.id,
                            "date": Date.now()
                        };
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
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }
        $scope.back = function() {
            $state.go('app.defects', {
                id: $stateParams.id
            })
        }
        $scope.list = ['wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut', 'wut'];
    }
]);
