var $APP = $APP || {}; // App namespace
// $APP.server = 'http://artvm23.vmnet.ro/';
// $APP.server = 'http://proproject.artsoft-consult.ro/';
$APP.server = 'http://app.preprod.proproject.io/'
$APP.name = 'proproject';

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

angular.module($APP.name, [
    'ionic',
    'ion-datetime-picker',
    'indexedDB',
    'ngCordova',
]);
angular.module($APP.name).run(function($rootScope) {});
angular.module($APP.name).config([
    '$stateProvider',
    '$urlRouterProvider',
    '$indexedDBProvider',
    function($stateProvider, $urlRouterProvider, $indexedDBProvider) {
        //        angular.extend(CacheFactoryProvider.defaults, {maxAge: 15 * 60 * 1000});
        $indexedDBProvider
            .connection('preprod')
            .upgradeDatabase(1, function(event, db, tx) {
                var objStore = db.createObjectStore('projects', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                objStore.createIndex('id_idx', 'id', {
                    unique: true
                });
            });

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
                        controller: 'TabCtrl'
                    }
                }
            })
            .state('app.account', {
                url: "account",
                views: {
                    'menuContent': {
                        templateUrl: "templates/account.html",
                        controller: 'NavCtrl'
                    }
                }
            })
            .state('app.projects', {
                url: "projects",
                views: {
                    'menuContent': {
                        templateUrl: "templates/projects/_list.html",
                        controller: 'ProjectsCtrl'
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
                        controller: 'SubcontractorsCtrl'
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
                        controller: '_SubcontractorsRelatedCtrl'
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
                        controller: 'DefectsCtrl'
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
                        controller: '_DefectDetailsCtrl'
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
                        controller: '_DefectRelatedCtrl'
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
                        controller: '_DefectAttachmentsCtrl'
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
            .state('app.photo', {
                url: "photo=:id&:photo",
                params: {
                    id: null,
                    photo: null
                },
                views: {
                    'menuContent': {
                        templateUrl: "templates/util/photo.html",
                        controller: 'PhotoCtrl'
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
