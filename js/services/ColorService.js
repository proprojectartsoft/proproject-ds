dsApp.factory('ColorService', [
    '$http',
    function($http) {
        return {
            get_colors: function() {
                return $http.get('data/color-names.json').then(
                    function onSuccess(colors) {
                        return colors.data;
                    }).catch(
                    function onError(error) {
                        console.log('There is no color-names.json file or there was another error', error);
                    });
            }
        }
    }
])
