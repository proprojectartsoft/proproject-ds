angular.module($APP.name).service('SettingsService', [
    'AuthService',
    '$rootScope',
    'CacheFactory',
    '$http',
    'ProjectService',
    function (AuthService, $rootScope, CacheFactory, $http, ProjectService) {
        return {
            init_settings: function () {
                var settingsDSC = CacheFactory.get('settingsDSC');
                if (!settingsDSC) {
                    settingsDSC = CacheFactory('settingsDSC');
                    settingsDSC.setOptions({
                        storageMode: 'localStorage'
                    });
                }
                $rootScope.project = settingsDSC.get('project');
                if (!$rootScope.project) {
                    if (!$rootScope.projects) {
                        ProjectService.list().then(function (result) {
                            $rootScope.projects = result;
                            $rootScope.project = settingsDSC.get('project');
                            if (!$rootScope.project) {
                                $rootScope.project = $rootScope.projects[0];
                            }
                        });
                    } else {
                        $rootScope.project = $rootScope.projects[0];
                    }

                }
                AuthService.init().then(function (result) {
                    $rootScope.current_user = result.data;
                })

            },
            my_account: function () {
                return $http.get($APP.server + '/api/user/profileds', {}).then(
                        function (payload) {
                            return payload.data;
                        }
                );

            },
            notification_count: function () {
                return $http.get($APP.server + '/api/dsnotification/count', {}).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            notification: function () {
                return $http.get($APP.server + '/api/dsnotification', {}).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            update_notification: function (id) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/dsnotification',
                    data: id
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            update_my_account: function (dataIn) {
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/user/ds',
                    data: dataIn
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            activity_stream: function (pageNr) {
                return $http.get($APP.server + '/api/activitystream', {
                    params: {pageNr: pageNr}
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            get_logo: function () {
                return $http.get($APP.server + 'api/image/logo', {
                            headers: {'Accept': 'text/plain'}
                        }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            
            change_password: function(dataIn){
                return $http({
                    method:'POST',
                    url: $APP.server + 'api/changepassword',
                    data: dataIn
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            },
            change_logo: function(){
                return $http({
                    method: 'PUT',
                    url: $APP.server + '/api/user/ds',
                    data: dataIn
                }).then(
                        function (payload) {
                            return payload.data;
                        }
                );
            }
        };
    }
]);