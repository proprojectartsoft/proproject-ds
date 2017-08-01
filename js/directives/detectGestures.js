angular.module($APP.name).directive('detectGestures', function($ionicGesture) {
    return {
        restrict: 'A',

        link: function(scope, elem, attrs) {
            var gestureType = attrs.gestureType;

            switch (gestureType) {
                case 'pinch':
                    $ionicGesture.on('pinch', scope.reportEvent, elem);
                    break;
                case 'swiperight':
                    $ionicGesture.on('swiperight', scope.reportEvent, elem);
                    break;
                case 'swipeleft':
                    $ionicGesture.on('swipeleft', scope.reportEvent, elem);
                    break;
                case 'doubletap':
                    $ionicGesture.on('doubletap', scope.reportEvent, elem);
                    break;
                case 'tap':
                    $ionicGesture.on('tap', scope.reportEvent, elem);
                    break;
                case 'scroll':
                    $ionicGesture.on('scroll', scope.reportEvent, elem);
                    break;
            }

        }
    }
})
