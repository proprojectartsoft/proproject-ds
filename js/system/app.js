var $APP = $APP || {}; // App namespace
// $APP.server = 'http://artvm23.vmnet.ro/';
// $APP.server = 'http://proproject.artsoft-consult.ro/';
// $APP.server = 'http://app.preprod.proproject.io/';
$APP.server = 'http://app.proproject.io/';
$APP.name = 'ppds';

$APP.settings = {
    tabs: {
        'drawings': '',
        'subcontractors': '',
        'defects': ''
    },
    header: 'Project Name',
    subHeader: 'Name ZZ'
}
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
}

var dsApp = angular.module($APP.name, [
    'ionic',
    'ion-datetime-picker',
    'ngCordova',
]).run(function($rootScope) {}).config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('app', {
                url: "/",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'NavCtrl'
            })
            .state('app.tab', {
                url: "tab",
                views: {
                    'menuContent': {
                        templateUrl: "templates/util/tab.html",
                        controller: 'TabCtrl as vm'
                    }
                }
            })
            .state('app.projects', {
                url: "projects",
                views: {
                    'menuContent': {
                        templateUrl: "templates/projects/_list.html",
                        controller: 'ProjectsCtrl as vm'
                    }
                }
            })
            .state('app.drawings', {
                url: "drawings=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/drawings/_entity.html",
                        controller: 'DrawingsCtrl'
                    }
                }
            })
            .state('app.drawingdetails', {
                url: "drawingdetails=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/drawings/_details.html",
                        controller: '_DrawingDetailsCtrl'
                    }
                }
            })
            .state('app.drawingrelated', {
                url: "drawingrelated=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/drawings/_related.html",
                        controller: '_DrawingRelatedCtrl'
                    }
                }
            })
            .state('app.subcontractors', {
                url: "subcontractors=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/subcontractors/_entity.html",
                        controller: 'SubcontractorsCtrl as vm'
                    }
                }
            })
            .state('app.subcontractorrelated', {
                url: "subcontractorrelated=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/subcontractors/_related.html",
                        controller: '_SubcontractorsRelatedCtrl as vm'
                    }
                }
            })
            .state('app.defects', {
                url: "defects=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/defects/_entity.html",
                        controller: 'DefectsCtrl as vm'
                    }
                }
            })
            .state('app.defectdetails', {
                url: "defectdetails=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/defects/_details.html",
                        controller: '_DefectDetailsCtrl as vm'
                    }
                }
            })
            .state('app.defectrelated', {
                url: "defectrelated=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/defects/_related.html",
                        controller: '_DefectRelatedCtrl as vm'
                    }
                }
            })
            .state('app.defectattachments', {
                url: "defectattachments=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/defects/_attachments.html",
                        controller: '_DefectAttachmentsCtrl as vm'
                    }
                }
            })
            .state('app.defectcomments', {
                url: "defectcomments=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/defects/_comments.html",
                        controller: '_DefectCommentsCtrl'
                    }
                }
            })
            .state('app.fullscreen', {
                url: "fullscreen=:id",
                params: {
                    id: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/util/fullscreen.html",
                        controller: 'FullscreenCtrl'
                    }
                }
            })
            .state('login', {
                url: "/login",
                templateUrl: "templates/login.html",
                controller: "LoginCtrl"
            });

        $urlRouterProvider.otherwise('/login'); //hardcoded for start
    }
]);
