dsApp.service('PostService', [
    '$q',
    '$http',
    '$timeout',
    '$state',
    '$filter',
    'pendingRequests',
    '$rootScope',
    function($q, $http, $timeout, $state, $filter, pendingRequests, $rootScope) {

        var service = this;
        /**
         * Method to post data
         * @param {object} params - object containing post params
         * - {
         *      url: 'login',
         *      endPoint: 'pub/',
         *      method: 'POST',
         *      params: {}, - for params of the URL
         *      data: {},   - for data to be posted
         *      headers: {},
         *      extraParams: {},
         *      transformRequest: {Function},
         *      transformResponse: {Function}
         *     }
         * @param {Function} success - callback on success
         * @param {Function} error - callback on error
         * @param {Object} [popup] - optional popup object to be closed
         */
        service.post = function(params, success, error, popup) {
            if (['POST', 'PUT', 'GET', 'DELETE'].indexOf(params.method) < 0) {
                return error({
                    error: 500,
                    response: 'Wrong method used'
                });
            }

            var dt = {},
                baseEndPoint = params.hasOwnProperty('endPoint') ? params.endPoint : 'api/',
                baseQueryTo = $APP.server + baseEndPoint,
                self = this;

            self.errorId = 0;
            self.errorStatus = "Unrecognized error";

            /**
             * Method to run on success
             *
             * @param {Object} response - server JSON response parsed into an object or caught in the middle
             * @returns {Object} - error | success object
             */
            self.successCallback = function(response) {
                if (popup) popup.close();

                // This is the success (200)
                // It might be throwing weird or expected errors so we better deal with them at this level
                if (!response) {
                    //console.log('Unknown Server error');
                    dt = {
                        error: 'Something went wrong. The server did not return a proper response!',
                        status: 299 // custom error status
                    };
                    return error({
                        'data': dt
                    });
                }

                success(response);
            };

            /**
             * Method to run on error
             * @param {Object} response - server JSON response parsed into an object or caught in the middle
             * @returns {Object} - error object
             */
            self.errorCallback = function(response) {
                if (popup) popup.close();

                // forced stop querying
                if (!response) {
                    $rootScope.stopQuerying = true;
                    dt = {
                        error: 'Not authorized',
                        status: 401
                    };
                    return error({
                        'data': dt
                    });
                }

                if ([401, 403].indexOf(response.status) > -1) {
                    $rootScope.stopQuerying = true;
                    pendingRequests.cancelAll();
                    sessionStorage.removeItem('isLoggedIn');
                    dt = {
                        error: 'Not authorized',
                        status: response.status
                    };
                    return error({
                        'data': dt
                    });
                }

                dt = {
                    error: response.statusText || 'Unknown server error',
                    status: response.status || 500
                };
                return error({
                    'data': dt
                });
            };

            // classic request object
            var requestObject = {
                method: params.method,
                url: baseQueryTo + params.url,
                data: params.data
            };

            if (params.data && typeof params.data === 'object') {
                requestObject.data = params.data;
            }

            if (params.params && typeof params.params === 'object') {
                requestObject.params = params.params;
            }
            if (params.transformRequest && typeof params.transformRequest === 'object') {
                requestObject.transformRequest = params.transformRequest;
            }

            if (params.transformResponse && typeof params.transformResponse === 'object') {
                requestObject.transformResponse = params.transformResponse;
            }

            if (params.extraParams && Object.keys(params.extraParams).length) {
                for (var i in params.extraParams) {
                    if (!params.extraParams.hasOwnProperty(i)) continue;
                    requestObject[i] = params.extraParams[i];
                }
            }

            // add cache control to all requests
            requestObject.headers = {
                'Cache-control': 'no-cache, no-store, max-age=0',
                'Pragma': 'no-cache'
            };

            if (params.headers && Object.keys(params.headers).length) {
                for (var y in params.headers) {
                    if (!params.headers.hasOwnProperty(y)) continue;
                    requestObject.headers[y] = params.headers[y];
                }
            }

            // load the $http service
            if (!$rootScope.stopQuerying) {

                var canceller = $q.defer();
                pendingRequests.add({
                    url: requestObject.url,
                    canceller: canceller
                });
                requestObject.timeout = canceller.promise;

                try {
                    $http(requestObject).then(
                        self.successCallback,
                        self.errorCallback
                    );
                } catch (err) {
                    return self.errorCallback({
                        statusText: 'Unknown server error: ' + err,
                        status: 500
                    });
                }
                pendingRequests.remove(requestObject.url);
            } else {
                return self.errorCallback;
            }
        };
    }
]);

dsApp.service('pendingRequests', ['$filter', function($filter) {
    var pending = [];
    this.get = function() {
        return pending;
    };
    this.add = function(request) {
        pending.push(request);
    };
    this.remove = function(request) {
        pending = $filter('filter')(pending, function(p) {
            return p.url !== request;
        });
    };
    this.cancelAll = function() {
        angular.forEach(pending, function(p) {
            p.canceller.resolve();
        });
        pending.length = 0;
    };
}]);

dsApp.service('SettingsService', [
    '$http', '$ionicPopup', '$ionicBackdrop', '$ionicBody', '$timeout',

    function($http, $ionicPopup, $ionicBackdrop, $ionicBody, $timeout) {
        var self = this;
        self.get_settings = function(predicate) {
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
        };
        self.list_settings = function() {
            return $APP.settings;
        };
        self.set_settings = function(data) {
            angular.forEach(data, function(value, key) {
                $APP.settings[key] = value;
            });
        };
        self.put_settings = function(predicate, value) {
            $APP.settings[predicate] = value;
        };
        self.show_message_popup = function(title, template) {
            return $ionicPopup.alert({
                title: title,
                template: "<center>" + template + "</center>",
            });
        };
        self.show_loading_popup = function(title) {
            return $ionicPopup.show({
                title: title,
                template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                content: "",
                buttons: []
            });
        };
        self.close_all_popups = function() {
            noop = angular.noop;
            elevated = false;
            var popupStack = $ionicPopup._popupStack;
            if (popupStack.length > 0) {
                popupStack.forEach(function(popup, index) {
                    if (popup.isShown === true) {
                        popup.remove();
                        popupStack.pop();
                    }
                });
            }

            $ionicBackdrop.release();
            //Remove popup-open & backdrop if this is last popup
            $timeout(function() {
                // wait to remove this due to a 300ms delay native
                // click which would trigging whatever was underneath this
                $ionicBody.removeClass('popup-open');
                // $ionicPopup._popupStack.pop();
            }, 400, false);
            ($ionicPopup._backButtonActionDone || noop)();
        };
        self.get_initials = function(str) {
            if (str) {
                var aux = str.split(" ");
                return (aux[0][0] + aux[1][0]).toUpperCase();
            }
            return "";
        };

        self.get_colors = function() {
            return $http.get('data/color-names.json').then(
                function onSuccess(colors) {
                    return colors.data;
                }).catch(
                function onError(error) {
                    console.log('There is no color-names.json file or there was another error', error);
                });
        };
    }
]);

dsApp.service('ConvertersService', ['$http', '$rootScope', '$filter', function ConvertersService($http, $rootScope, $filter) {
    var self = this;

    self.init_defect = function(data) {
        if (data) {
            data.status_obj = {
                id: data.status_id,
                name: data.status_name
            };
            data.severity_obj = {
                id: data.severity_id,
                name: data.severity_name
            };
            data.priority_obj = {
                id: data.priority_id,
                name: data.priority_name
            };
        }
        return data;
    }

    self.increase_nr_tasks = function(subcontr, task) {
        subcontr.nr_of_defects++;
        switch (task) {
            case "Complete":
                subcontr.completed_tasks++;
                break;
            case "Incomplete":
                subcontr.incomplete_tasks++;
                break;
            case "Partially Completed":
                subcontr.partially_completed_tasks++;
                break;
            case "Delayed":
                subcontr.delayed_tasks++;
                break;
            case "Contested":
                subcontr.contested_tasks++;
                break;
            case "Closed Out":
                subcontr.closed_out_tasks++;
                break
            default:
                subcontr.incomplete_tasks++;
        }
    }

    self.decrease_nr_tasks = function(subcontr, task) {
        subcontr.nr_of_defects--;
        switch (task) {
            case "Complete":
                subcontr.completed_tasks--;
                break;
            case "Incomplete":
                subcontr.incomplete_tasks--;
                break;
            case "Partially Completed":
                subcontr.partially_completed_tasks--;
                break;
            case "Delayed":
                subcontr.delayed_tasks--;
                break;
            case "Contested":
                subcontr.contested_tasks--;
                break;
            case "Closed Out":
                subcontr.closed_out_tasks--;
                break
            default:
                subcontr.incomplete_tasks--;
        }
    }

    self.add_task_for_subcontractor = function(task, subcontractors) {
        if (task.assignee_id) {
            //search the new assignee having the id 'assignee_id' through the subcontractors list
            var subcontr = $filter('filter')(subcontractors, {
                id: task.assignee_id
            });
            //if the new assignee is a subcontractor, add the task to his tasks list
            if (subcontr && subcontr.length) {
                subcontr[0].isModified = true;
                self.increase_nr_tasks(subcontr[0], task.status_name);
                //keep all tasks except for the new task given by id, if it is already in that list
                subcontr[0].tasks = $filter('filter')(subcontr[0].tasks, {
                    id: ('!' + task.id)
                }) || [];
                //add the new task
                subcontr[0].tasks.push(task);
                return subcontractors;
            }
        }
        return subcontractors;
    }

    self.remove_task_for_subcontractor = function(task, subcontractors, assignee_id) {
        //search the old assignee having the id 'assignee_id' through the subcontractors list
        var subcontr = $filter('filter')(subcontractors, {
            id: assignee_id
        });
        //if the old assignee is a subcontractor, remove the task from his tasks list
        if (subcontr && subcontr.length) {
            // remove from old assignee related list
            subcontr[0].tasks = $filter('filter')(subcontr[0].tasks, {
                id: ('!' + task.id)
            });
            //derease the number of tasks corresponding to task's status
            self.decrease_nr_tasks(subcontr[0], task.status_name);
            subcontr[0].isModified = true;
            return subcontractors;
        }
        return subcontractors;
    }

    self.getEmptyDefect = function() {
        var defect = {};
        defect.id = 0;
        defect.active = true;
        defect.project_id = $rootScope.projId;
        defect.defect_id = 0;
        defect.related_tasks = [];
        defect.due_date = 0;
        defect.drawing = null;
        defect.description = "";
        defect.photos = [];
        defect.comments = [];
        defect.status_obj = {
            id: 0,
            name: 'Incomplete'
        };
        defect.severity_obj = {
            id: 0,
            name: 'None'
        };
        defect.priority_obj = {
            id: 0,
            name: 'None'
        };

        var user = "";
        if ($rootScope.users && $rootScope.users.length) {
            user = $filter('filter')($rootScope.users, {
                login_name: localStorage.getObject('ds.user') && localStorage.getObject('ds.user').name
            })[0];
            if (user) {
                defect.assignee_name = user.first_name + " " + user.last_name;
                defect.assignee_id = user.id;
            }
        } else {
            defect.assignee_name = "";
            defect.assignee_id = 0;
        }
        return defect;
    }

    self.get_defect_for_create = function(defect) {
        def = {
            active: defect.active,
            project_id: defect.project_id,
            cost: defect.cost,
            due_date: new Date(defect.due_date).getTime(),
            location: defect.location,
            title: defect.title,
            priority_id: defect.priority_id,
            severity_id: defect.severity_id,
            status_id: defect.status_id,
            description: defect.description,
            related_tasks: [],
            assignee_id: defect.assignee_id,
            assignee_name: defect.assignee_name
        }

        angular.forEach(defect.related_tasks, function(rel) {
            //if the related task is aldready on server, add it to list
            var str = rel.id.toString();
            if (str.indexOf('new') == -1)
                def.related_tasks.push({
                    id: rel.id
                })
        })
        return def;
    }

    self.get_defect_for_update = function(defect) {
        var def = {
            id: defect.id,
            reporter_id: defect.reporter_id,
            assignee_id: defect.assignee_id,
            active: defect.active,
            project_id: defect.project_id,
            due_date: new Date(defect.due_date).getTime(),
            location: defect.location,
            title: defect.title,
            description: defect.description,
            defect_no: defect.defect_no,
            cost: defect.cost,
            related_tasks: [],
            priority_id: defect.priority_id,
            severity_id: defect.severity_id,
            status_id: defect.status_id
        }
        angular.forEach(defect.related_tasks, function(rel) {
            def.related_tasks.push({
                id: rel.id
            })
        })
        return def;
    }

    self.get_drawing_for_update = function(drawing) {
        return {
            id: drawing.id,
            title: drawing.title,
            code: drawing.code,
            revision: drawing.revision,
            markers: drawing.markers,
            project_id: drawing.project_id,
            project_name: drawing.project_name,
            drawing_date: drawing.drawing_date,
            file_name: drawing.file_name
        }
    }
}]);

dsApp.service('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    '$q',
    'PostService',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer, $q, PostService) {
        var self = this;
        self.downloadPdf = function(drawing, dir) {
            var def = $q.defer();
            $ionicPlatform.ready(function() {
                document.addEventListener(
                    "deviceready",
                    function() {
                        var fileTransfer = new FileTransfer();
                        var uri = encodeURI($APP.server + '/pub/drawings/' + drawing.base64String);
                        var fileURL = dir + "/" + drawing.base64String;
                        var deviceSpace = 0;

                        cordova.exec(
                            function(freeSpace) {
                                deviceSpace = freeSpace;
                            },
                            function() {},
                            "File", "getFreeDiskSpace", []);

                        PostService.post({
                            method: 'GET',
                            url: 'drawing/size',
                            params: {
                                id: drawing.id
                            }
                        }, function(res) {
                            if (res.data > deviceSpace - 500) {
                                //not enough space to download all pdfs; stop download
                                def.reject("Not enough space to download all files");
                            } else {
                                fileTransfer.download(
                                    uri,
                                    fileURL,
                                    function(entry) {
                                        def.resolve(fileURL);
                                    },
                                    function(error) {
                                        def.reject("An unexpected error occured and drawings could not be downloaded. They may be unavailable while offline.");
                                    }
                                );
                            }
                        }, function(error) {
                            def.reject("An unexpected error occured and drawings could not be downloaded. They may be unavailable while offline.");
                        })
                    },
                    false);
            })
            return def.promise;
        };

        self.createDirectory = function(dirName) {
            var def = $q.defer();
            $ionicPlatform.ready(function() {
                if (typeof cordova == 'undefined') {
                    cordova = {};
                    cordova.file = {
                        dataDirectory: '///'
                    }
                }

                $cordovaFile.createDir(cordova.file.dataDirectory, dirName, true)
                    .then(function(success) {
                        def.resolve(cordova.file.dataDirectory + "/" + dirName);
                    }, function(error) {
                        def.reject('Could not create directory to download drawings. Please try again.');
                    });
            })
            return def.promise;
        };
    }
]);
