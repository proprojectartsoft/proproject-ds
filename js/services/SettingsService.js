angular.module($APP.name).factory('SettingsService', [
    '$http',
    function($http) {
        return {
            get_settings: function(predicate) {
                var list = predicate.split(".");
                if (list.length === 0) {
                    return null;
                } else {
                    var result = $APP.settings[list[0]];
                    for (var i = 1; i < list.length; i++) {
                        result = result[list[i]];
                    }
                    return result;
                }
            },
            list_settings: function() {
                return $APP.settings;
            },
            set_settings: function(data) {
                angular.forEach(data, function(value, key) {
                    $APP.settings[key] = value;
                });
            },
            put_settings: function(predicate, value) {
                $APP.settings[predicate] = value;
            },
            my_account: function() {
                return $http.get($APP.server + '/api/user/profileds', {}).then(
                    function(payload) {
                        return payload.data;
                    }
                );

            }
        };
    }
]);
