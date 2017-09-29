dsApp.service('SyncService', [
    '$q',
    '$http',
    '$state',
    '$timeout',
    '$ionicPlatform',
    '$ionicPopup',
    '$filter',
    'orderByFilter',
    'DownloadsService',
    'AuthService',
    'SettingsService',
    'IndexedService',
    'ConvertersService',
    'PostService',
    function($q, $http, $state, $timeout, $ionicPlatform, $ionicPopup, $filter, orderBy, DownloadsService, AuthService, SettingsService,
        IndexedService, ConvertersService, PostService) {

        var service = this;

        IndexedService.createDB(function() {
            console.log('DB creation done');
        });

        service.getProjects = function(callback) {
            try {
                IndexedService.runCommands({
                    data: {},
                    operation: 'getProjects'
                }, function(result) {
                    callback(result.results);
                });
            } catch (e) {
                throw ('Error getting data: ' + e);
            }
        };

        service.getProject = function(id, callback) {
            if (!id) {
                return false;
            }
            try {
                IndexedService.runCommands({
                    data: {
                        id: id
                    },
                    operation: 'getProject'
                }, function(result) {
                    callback(result.results[0]);
                });
            } catch (e) {
                throw ('Error getting data: ' + e);
            }
        };

        service.setProjects = function(projects, callback) {
            try {
                IndexedService.runCommands({
                    data: projects,
                    operation: 'setProjects'
                }, function(result) {
                    callback(result);
                });
            } catch (e) {
                throw ('Error getting data: ' + e);
            }
        };

        service.clearDb = function(callback) {
            try {
                IndexedService.runCommands({
                    data: {},
                    operation: 'eraseDb'
                }, function(result) {
                    callback(result);
                });
            } catch (e) {
                throw ('Error getting data: ' + e);
            }
        };

        service.sync = function() {
            var deferred = $q.defer();
            var failed = false;
            if (navigator.onLine) {
                login(function(res) {
                    if (res === "logged") {
                        getme()
                            .success(function(data) {
                                service.clearDb(function() {
                                    buildData(function() {
                                        deferred.resolve('sync_done');
                                        // $state.go('app.projects');
                                    })
                                })
                            }).error(function(data, status) {
                                deferred.resolve();
                                if (!navigator.onLine) {
                                    var loggedIn = localStorage.getObject('dsremember');
                                    SettingsService.show_message_popup("You are offline", "<center>You can sync your data when online</center>");
                                }
                            });
                    } else {
                        deferred.resolve();
                        SettingsService.show_message_popup("Error", "An unexpected error occured during authentication and sync could not be done. Please try again.");
                    }
                })
            } else {
                deferred.resolve();
                var savedCredentials = localStorage.getObject('dsremember');
            }

            function getme() {
                return $http.get($APP.server + '/api/me')
                    .success(function(user) {
                        return user;
                    })
                    .error(function(data, status) {
                        return status;
                    })
            }

            function login(callback) {
                //user already logged
                if (sessionStorage.getObject('isLoggedIn')) {
                    callback("logged");
                } else {
                    //user is not logged on server
                    var user = {
                        username: localStorage.getObject('dsremember').username,
                        password: localStorage.getObject('dsremember').password,
                        remember: localStorage.getObject('dsremember').rememberMe,
                        id: localStorage.getObject('dsremember').id,
                    };
                    AuthService.login(user).success(function() {
                        callback("logged");
                    }).error(function() {
                        callback("error");
                    })
                }
            }

            function buildData(callback) {
                //get projects from server
                getProjectsList().then(function(projects) {
                    //no projects stored
                    if (!projects.length) {
                        callback();
                        return;
                    }
                    //download pdfs for all drawings of all projects
                    downloadPdfs(projects).then(function(res) {
                        //store the projects in indexedDB
                        service.setProjects(res, function(proj) {
                            callback();
                        });
                    });
                });
            }

            function getProjectsList() {
                var def = $q.defer();
                PostService.post({
                    method: 'GET',
                    url: 'sync/ds',
                    data: {}
                }, function(result) {
                    if (!projects.data.length) def.resolve([]);
                    var projectsArray = [];
                    angular.forEach(projects.data, function(value) {
                        projectsArray.push({
                            "id": value.id,
                            "value": value
                        });
                    });
                    def.resolve(projectsArray);
                }, function(error) {
                    def.resolve([]);
                    console.log(err);
                })
                return def.promise;
            }

            function downloadPdfs(projects) {
                var def = $q.defer();
                $ionicPlatform.ready(function() {
                    //create directory to download the pdfs
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        DownloadsService.createDirectory("ds-downloads").then(function(path) {
                            if (path == 'fail') {
                                def.resolve(projects);
                                //TODO: call $rootScope.go('reload') and use SettingsService.show_msg_popup
                                var popup = $ionicPopup.alert({
                                    title: "Error",
                                    template: "Could not create directory to download the files. Please try again",
                                    content: "",
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive',
                                        onTap: function(e) {
                                            popup.close();
                                            location.reload();
                                        }
                                    }]
                                });
                            } else {
                                angular.forEach(projects, function(proj) {
                                    if (!proj.value.drawings || proj.value.drawings && !proj.value.drawings.length) {
                                        def.resolve(projects);
                                    }
                                    //order drawings by date
                                    var orderedDraws = orderBy(proj.value.drawings, 'draw.drawing_date', true);
                                    //download the pdf for every drawing
                                    angular.forEach(orderedDraws, function(draw) {
                                        DownloadsService.downloadPdf(draw, path).then(function(downloadRes) {
                                            if (downloadRes == "") {
                                                //not enpugh space to download all pdfs; stop download
                                                def.resolve(projects);
                                                //TODO: call $rootScope.go('reload') and use SettingsService.show_msg_popup
                                                var popup = $ionicPopup.alert({
                                                    title: "Download stopped",
                                                    template: "<center>Not enough space to download all files</center>",
                                                    content: "",
                                                    buttons: [{
                                                        text: 'Ok',
                                                        type: 'button-positive',
                                                        onTap: function(e) {
                                                            popup.close();
                                                            location.reload();
                                                        }
                                                    }]
                                                });
                                            } else {
                                                draw.pdfPath = downloadRes;
                                                //all pdfs have been downloaded
                                                if (orderedDraws[orderedDraws.length - 1] === draw)
                                                    def.resolve(projects);
                                            }
                                        })
                                    })
                                })
                            }
                        })
                    } else {
                        def.resolve(projects);
                        console.log("You are not on mobile. Files download not necessary.");
                    }
                })
                return def.promise;
            }
            return deferred.promise;
        };

        service.syncData = function() {
            var def = $q.defer();
            var commentsToAdd = [],
                defectsToAdd = [],
                defectsToUpdate = [],
                drawingsToUpd = [],
                changedDefects = [];

            service.getProjects(function(projects) {
                if (projects.length != 0) {
                    syncProject(projects).then(function(s) {
                        def.resolve();
                    }, function(e) {
                        def.resolve();
                    })
                } else {
                    def.resolve();
                }
            })

            function storeNewDefects(project) {
                angular.forEach(project.defects, function(defect) {
                    //store all new defects for this project
                    if (typeof defect.isNew != 'undefined') {
                        delete defect.isNew;
                        defectsToAdd.push(defect);
                    }
                    if (typeof defect.isModified != 'undefined') {
                        //store new comments for the defect
                        angular.forEach(defect.comments, function(comment) {
                            //store new comments to be synced
                            if (typeof comment.isNew != 'undefined') {
                                delete comment.isNew;
                                commentsToAdd.push(comment);
                            }
                        })
                        //store all modified defects for this project
                        defectsToUpdate.push(defect);
                    }
                    delete defect.isNew;
                    delete defect.isModified;
                })
            }

            function storeUpdatedDrawings(project) {
                angular.forEach(project.drawings, function(draw) {
                    //store modified drawings
                    if (typeof draw.isModified != 'undefined') {
                        delete draw.isModified;
                        drawingsToUpd.push(draw);
                    }
                })
            }

            function syncSubcontractors(project) {
                angular.forEach(project.subcontractors, function(subcontr) {
                    //store modified subcontractors to server
                    if (typeof subcontr.isModified != 'undefined') {
                        PostService.post({
                            method: 'PUT',
                            url: 'subcontractor',
                            data: subcontr
                        }, function(result) {
                            delete subcontr.isModified;
                        }, function(error) {
                            delete subcontr.isModified;
                        })
                    }
                })
            }

            function syncComments() {
                angular.forEach(commentsToAdd, function(comment) {
                    //add new comment for already existing defect
                    PostService.post({
                        method: 'POST',
                        url: 'defectcomment',
                        data: comment
                    }, function(result) {
                        console.log(result);
                    }, function(error) {
                        console.log(error);
                    })
                })
                commentsToAdd = [];
            }
            //add comments for a new defect
            function addComments(comments, defect_id) {
                var defer = $q.defer();
                if (comments.length == 0) {
                    defer.resolve();
                }
                var count = 0;
                angular.forEach(comments, function(comment) {
                    count++;
                    // update defect id for new comments
                    comment.defect_id = defect_id;
                    PostService.post({
                        method: 'POST',
                        url: 'defectcomment',
                        data: comment
                    }, function(result) {
                        if (count >= comments.length) {
                            defer.resolve();
                        }
                    }, function(error) {
                        if (count >= comments.length) {
                            defer.resolve();
                        }
                    })
                })
                return defer.promise;
            }

            function addDefect(oldDefect) {
                var defer = $q.defer(),
                    defect = ConvertersService.get_defect_for_create(oldDefect);
                //save defect on server
                PostService.post({
                    method: 'POST',
                    url: 'defect',
                    data: defect
                }, function(res) {
                    defect.id = res.data;
                    //if the created defect has related defects that are not added yet to the server, add them to defectsToUpd list
                    for (var i = 0; i < oldDefect.related_tasks.length; i++) {
                        if (oldDefect.related_tasks[i].isNew) {
                            defectsToUpdate.push(defect);
                            i = defect.related_tasks.length;
                        }
                    }
                    //update defect id for related tasks of the defect to be added
                    angular.forEach(defects, function(d) {
                        //search through all other defects' related tasks the new defect
                        if (d.related_tasks.length != 0 && oldDefect.id != d.id) {
                            for (var i = 0; i < d.related_tasks.length; i++) {
                                if (d.related_tasks[i].id == oldDefect.id) {
                                    //set the new assigne id for the related task
                                    d.related_tasks[i].id = res.data;
                                    delete d.related_tasks[i].isNew;
                                }
                            }
                        }
                    })

                    if (oldDefect.drawing) {
                        //get the drawing of the new added defect from the array of drawings to be updated
                        var d = $filter('filter')(drawingsToUpd, {
                            id: oldDefect.drawing.id
                        });

                        if (d && d.length) {
                            draw = d[0];
                            //update marker's defect id
                            var mark = $filter('filter')(draw.markers, {
                                defect_id: oldDefect.id
                            });
                            if (mark && mark.length) {
                                mark[0].defect_id = res.data;
                            }
                            //update defect's id
                            var def1 = $filter('filter')(draw.defects, {
                                id: oldDefect.id
                            });
                            if (def1 && def1.length) {
                                def1[0].id = res.data;
                            }
                        }
                    }

                    changedDefects.push({
                        old: oldDefect.id,
                        new: res.data
                    })

                    //TODO: addAttachments; Promise.all -> resolve

                    addComments(oldDefect.comments, res.data).then(function(s) {
                        defer.resolve();
                    }, function(e) {
                        defer.resolve();
                    })
                }, function(error) {
                    defer.resolve();
                    console.log(error);
                })
                return defer.promise;
            }

            function syncDefects() {
                var defer = $q.defer();
                if (defectsToAdd == null || defectsToAdd.length == 0) {
                    changedDefects = [];
                    defer.resolve();
                    return defer.promise;
                }
                var count = 0;
                angular.forEach(defectsToAdd, function(defect) {
                    count++;
                    addDefect(defect).then(function(res) {
                        if (count >= defects.length) {
                            defectsToAdd = [];
                            defer.resolve();
                        }
                    }, function(error) {
                        if (count >= defects.length) {
                            defectsToAdd = [];
                            defer.resolve();
                        }
                    })

                })
                return defer.promise;
            }

            function updateDrawings() {
                //TODO: promise;
                angular.forEach(drawingsToUpd, function(draw) {
                    PostService.post({
                        method: 'PUT',
                        url: 'drawing',
                        data: draw
                    }, function(result) {}, function(error) {})
                })
            }

            function updateDefects() {
                //TODO: promise
                var updateRelatedDefectsId = function(defects) {
                    angular.forEach(defects, function(defect) {
                        if (defect.related_tasks.length != 0 && changedDefects.length != 0) {
                            for (var i = 0; i < defect.related_tasks.length; i++) {
                                for (var j = 0; j < changedDefects.length; j++) {
                                    if (defect.related_tasks[i].id == changedDefects[j].old) {
                                        defect.related_tasks[i].id = changedDefects[j].new;
                                        j = changedDefects.length;
                                    }
                                }
                            }
                        }
                    })
                    changedDefects = [];
                }

                updateRelatedDefectsId(defectsToUpdate);
                angular.forEach(defectsToUpdate, function(defect) {
                    defect = ConvertersService.get_defect_for_update(defect);
                    // if (!defect.reporter_id) {
                    //     DefectsService.get(defect.id).then(function(defectToBeUpdated) {
                    //         defect.reporter_id = defectToBeUpdated.reporter_id;
                    //         PostService.post({
                    //             method: 'PUT',
                    //             url: 'defect',
                    //             data: defect
                    //         }, function(result) {}, function(error) {})
                    //     })
                    // } else {
                    PostService.post({
                        method: 'PUT',
                        url: 'defect',
                        data: defect
                    }, function(result) {}, function(error) {})
                    // }
                })
                defectToBeUpdated = [];
            }



            function syncProject(projects) { //, index, def
                var defer = $q.defer(),
                    count = 0;
                angular.forEach(projects, function(p) {
                    count++;
                    project = p.value;
                    if (project.isModified) {
                        storeUpdatedDrawings(project);
                        storeNewDefects(project);
                        syncSubcontractors(project);
                        delete project.isModified;
                    }

                    //TODO promise all sync comm, attachm, defects
                    syncComments();
                    //TODO: sync attachments
                    syncDefects().then(function(res) {
                        console.log("defects synced ", index);
                        //TODO:
                        var updDefectsPrm = updateDefects(),
                            updDrawsPrm = updateDrawings();

                        Promise.all([updDefectsPrm, updDrawsPrm]).then(function(s) {
                            if (count >= projects.length)
                                defer.resolve();
                        }, function(e) {
                            if (count >= projects.length)
                                defer.resolve();
                        })
                    })
                })
                return defer.promise;
            }

            return def.promise;
        }
    }
]);
