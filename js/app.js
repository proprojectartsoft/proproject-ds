var $APP = $APP || {}; // App namespace

//$APP.server = 'http://app.preprod.proproject.io/';
$APP.server = 'http://artvm23.vmnet.ro/';
//$APP.server = 'http://proproject.artsoft-consult.ro/';
$APP.name = 'devempire';
$APP.domain = window.location.hostname;
$APP.mobile = true;
$APP.CONFIG;

angular.module($APP.name, [
    'ui.router',
    'ngTable',
    'dndLists',
    'angular-cache',
    'flow',
    'fundoo.services',
    'ui.bootstrap',
    'oitozero.ngSweetAlert',
    'ngFileUpload'
]);

angular.module($APP.name).config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
        $stateProvider
                .state('app', {
                    url: "/",
                    templateUrl: "templates/main.html",
                    controller: "MainCtrl"
                })
                .state('login', {
                    url: "/login",
                    templateUrl: "templates/login.html",
                    controller: "LoginCtrl"
                })
                .state('signup', {
                    url: "/signup?email=",
                    params: {
                        email: null
                    },
                    templateUrl: "templates/signup.html",
                    controller: "SignUpCtrl"
                })
                .state('app.home', {
                    url: "home",
                    templateUrl: "templates/home.html",
                    controller: "HomeCtrl"
                })
                .state('app.searchResults', {
                    url: 'search/:category/:input',
                    params: {
                        category: null,
                        input: null

                    },
                    templateUrl: 'templates/searchresults.html',
                    controller: 'SearchResultsCtrl'
                })
                .state('app.punchlist', {
                    url: "punchlist",
                    templateUrl: "templates/punchlist.html",
                    controller: "PunchListCtrl"
                })
                .state('app.defects', {
                    url: "defects",
                    templateUrl: "templates/defects.html",
                    controller: "DefectsCtrl"
                })
                .state('app.drawings', {
                    url: "drawings",
                    templateUrl: "templates/drawings.html",
                    controller: "DrawingsCtrl"
                })
                .state('app.search', {
                    url: "search",
                    templateUrl: "templates/search.html",
                    controller: "GlobalSearchCtrl"
                })
                .state('app.drawing', {
                    url: "drawing=:id&:defect",
                    params: {
                        id: null,
                        defect: null
                    },
                    templateUrl: "templates/drawing.html",
                    controller: "DrawingCtrl"
                })
                .state('app.location', {
                    url: "location=:id",
                    params: {
                        id: null
                    },
                    templateUrl: "templates/location.html",
                    controller: "LocationCtrl"
                })
                .state('forgetpassword', {
                    url: "/forgetpassword/:email",
                    params: {
                        email: null
                    },
                    templateUrl: "templates/forgotpassword.html",
                    controller: "ForgotPasswordCtrl"
                })
                .state('app.contractors', {
                    url: "contractors",
                    templateUrl: "templates/contractors.html",
                    controller: "SubcontractorsCtrl"
                })
                .state('app.contractor', {
                    url: "contractor=:id",
                    params: {
                        id: null
                    },
                    templateUrl: "templates/contractor.html",
                    controller: "SubcontractorCtrl"
                });
        $urlRouterProvider.otherwise('/home');
    }
]);

angular.module($APP.name).run(['$rootScope', function ($rootScope) {
    }
]);

