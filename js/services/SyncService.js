dsApp.service('SyncService', [
    '$q',
    '$http',
    '$state',
    '$timeout',
    '$ionicPlatform',
    '$filter',
    'orderByFilter',
    'ProjectService',
    'DownloadsService',
    'AuthService',
    'SettingsService',
    function($q, $http, $state, $timeout, $ionicPlatform, $filter, orderBy, ProjectService, DownloadsService, AuthService, SettingsService) {

        var service = this,
            worker = false;
        service.getProjects = function(callback) {
            try {
                worker = new Worker('js/system/worker.js');

                worker.addEventListener('message', function(ev) {
                    worker.terminate();
                    if (ev.data.finished == true) {
                        callback(ev.data.results);
                    }
                })

                worker.postMessage({
                    data: {},
                    operation: 'getProjects'
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
                worker = new Worker('js/system/worker.js');

                worker.addEventListener('message', function(ev) {
                    worker.terminate();
                    if (ev.data.finished == true) {
                        callback(ev.data.results[0]);
                    }
                });

                worker.postMessage({
                    data: {
                        id: id
                    },
                    operation: 'getProject'
                });

            } catch (e) {
                throw ('Error getting data: ' + e);
            }
        };

        service.setProjects = function(projects, callback) {
            try {
                worker = new Worker('js/system/worker.js');

                worker.addEventListener('message', function(ev) {
                    worker.terminate();
                    if (ev.data.finished == true) {
                        callback(ev.data);
                    }
                });

                worker.postMessage({
                    data: projects,
                    operation: 'setProjects'
                });

            } catch (e) {
                throw ('Error setting data: ' + e);
            }
        };

        service.clearDb = function(callback) {
            try {
                worker = new Worker('js/system/worker.js');

                worker.addEventListener('message', function(ev) {
                    worker.terminate();
                    if (ev.data.finished == true) {
                        callback(ev)
                    }
                });

                worker.postMessage({
                    data: {},
                    operation: 'eraseDb'
                })

            } catch (e) {
                throw ('Error clearing db ' + e)
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
                var savedCredentials = localStorage.getObject('dsremember');
                SettingService.show_message_popup("You are offline", "<center>You can sync your data when online</center>");
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
                ProjectService.sync_projects().success(function(projects) {
                    //there are no projects to store
                    if (!projects.length) def.resolve([]);
                    var projectsArray = [];
                    angular.forEach(projects, function(value) {
                        projectsArray.push({
                            "id": value.id,
                            "value": value
                        });
                    });
                    def.resolve(projectsArray);
                }).error(function(err) {
                    console.log(err);
                });
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
                                SettingsService.show_message_popup("Error", "Could not create directory to download the files. Please try again");
                            } else {
                                angular.forEach(projects, function(proj) {
                                    //order drawings by date
                                    var orderedDraws = orderBy(proj.drawings, 'draw.drawing_date', true);
                                    //download the pdf for every drawing
                                    angular.forEach(orderedDraws, function(draw) {
                                        DownloadsService.downloadPdf(draw, path).then(function(downloadRes) {
                                            if (downloadRes == "") {
                                                //not enpugh space to download all pdfs; stop download
                                                def.resolve(projects);
                                                SettingsService.show_message_popup("Download stopped", "<center>Not enough space to download all files</center>");
                                            } else {
                                                draw.pdfPath = downloadRes;
                                                //all pdfs have been downloaded
                                                if (drawings[drawings.length - 1] === draw)
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
            var commentsToAdd = [],
                defectsToAdd = [],
                defectsToUpdate = [];

            function storeNewDefects(project) {
                angular.forEach(project.defects, function(defect) {
                    if (typeof defect.isNew != 'undefined') {
                        delete defect.isNew;
                        defectsToAdd.push(defect);
                    }
                    if (typeof defect.isModified != 'undefined') {
                        angular.forEach(defect.comments, function(comment) {
                            if (typeof comment.isNew != 'undefined') {
                                delete comment.isNew;
                                commentsToAdd.push(comment);
                            }
                        })
                        defectsToUpdate.push(defect.completeInfo);
                    }
                    delete defect.isNew;
                    delete defect.isModified;
                })
            }

            function storeUpdatedDrawings(project) {
                var drawingsToUpd = [];
                angular.forEach(project.drawings, function(draw) {
                    if (typeof draw.isModified != 'undefined') {
                        delete draw.isModified;
                        drawingsToUpd.push(draw);
                    }
                })
                sessionStorage.setObject('drawingsToUpd', drawingsToUpd);
            }

            function syncSubcontractors(project) {
                angular.forEach(project.subcontractors, function(subcontr) {
                    if (typeof subcontr.isModified != 'undefined') {
                        SubcontractorsService.update(subcontr).then(function(result) {
                            delete subcontr.isModified;
                        })
                    }
                })
            }

            function syncComments() {
                angular.forEach(commentsToAdd, function(comment) {
                    DefectsService.create_comment(comment).then(function(res) {}, function(err) {})
                })
                commentsToAdd = [];
            }

            function addComments(comments, defect_id, defer, doDefer) {
                if (comments.length == 0 && doDefer) {
                    defer.resolve();
                }
                angular.forEach(comments, function(comment) {
                    // update defect id for new comments
                    comment.defect_id = defect_id;
                    DefectsService.create_comment(comment).then(function(res) {
                        if (comments[comments.length - 1] === comment && doDefer) {
                            defer.resolve();
                        }
                    }, function(err) {
                        if (comments[comments.length - 1].id == comment.id && doDefer) {
                            defer.resolve();
                        }
                    })
                })
            }

            function addDefects(defects, index, defer) {
                defectsToAdd = [];
                var changed = sessionStorage.getObject('changedDefects') || [];
                defect = defects[index];
                var draw = defect.draw;
                defect.completeInfo.id = 0;
                DefectsService.create(defect.completeInfo).then(function(res) {
                    //if the created defect has related defects that are not added yet to the server, add them to defectsToUpd list
                    var rel = defect.completeInfo.related_tasks;
                    for (var i = 0; i < rel.length; i++) {
                        if (rel[i].isNew) {
                            defect.completeInfo.id = res;
                            defectsToUpdate.push(defect.completeInfo);
                            i = defect.completeInfo.related_tasks.length;
                        }
                    }
                    //update defect id for related tasks of the defect to be added
                    angular.forEach(defects, function(defToAdd) {
                        if (defToAdd.completeInfo.related_tasks.length != 0 && defect.id != defToAdd.id) {
                            for (var i = 0; i < defToAdd.completeInfo.related_tasks.length; i++) {
                                if (defToAdd.completeInfo.related_tasks[i].id == defect.id) {
                                    defToAdd.completeInfo.related_tasks[i].id = res;
                                    delete defToAdd.completeInfo.related_tasks[i].isNew;
                                }
                            }
                        }
                    })
                    if (draw) {
                        // update defect id for new markers
                        if (draw.markers && draw.markers.length) {
                            var mark = $filter('filter')(draw.markers, {
                                defect_id: defect.id
                            })[0];
                            if (mark) {
                                mark.defect_id = res;
                            }
                        }
                        DrawingsService.update(draw).then(function(drawingupdate) {
                            addComments(defect.comments, res, defer, defects[defects.length - 1].id == defect.id);
                        }, function(err) {
                            addComments(defect.comments, res, defer, defects[defects.length - 1].id == defect.id);
                        });
                    } else {
                        addComments(defect.comments, res, defer, defects[defects.length - 1].id == defect.id);
                    }
                    changed.push({
                        old: defect.id,
                        new: res
                    })
                    if (defects[defects.length - 1].id == defect.id) {
                        sessionStorage.setObject('changedDefects', changed);
                    } else {
                        addDefects(defects, index + 1, defer);
                    }
                }, function(err) {
                    if (defects[defects.length - 1].id == defect.id) {
                        sessionStorage.setObject('changedDefects', changed);
                        defer.resolve();
                    } else {
                        addDefects(defects, index + 1, defer);
                    }
                })
            }

            function syncDefects() {
                var defer = $q.defer();
                if (defectsToAdd == null || defectsToAdd.length == 0) {
                    sessionStorage.setObject('changedDefects', []);
                    defer.resolve();
                    return defer.promise;
                }
                addDefects(defectsToAdd, 0, defer);
                return defer.promise;
            }

            function updateDrawings(drawings) {
                sessionStorage.setObject('drawingsToUpd', []);
                angular.forEach(drawings, function(draw) {
                    DrawingsService.update(draw).then(function(result) {}, function(err) {})
                })
            }

            function updateDefects(defects) {
                updateRelatedDefectsId(defectsToUpdate);
                angular.forEach(defectsToUpdate, function(defect) {
                    if (!defect.reporter_id || !defect.reporter_name) {
                        DefectsService.get(defect.id).then(function(defectToBeUpdated) {
                            defect.reporter_id = defectToBeUpdated.reporter_id;
                            defect.reporter_name = defectToBeUpdated.reporter_name;
                            DefectsService.update(defect).success(function(res) {}).error(function(err) {})
                        })
                    } else {
                        DefectsService.update(defect).success(function(res) {}).error(function(err) {})
                    }
                })
                defectToBeUpdated = [];
            }

            function updateRelatedDefectsId(defects) {
                angular.forEach(defects, function(defect) {
                    if (defect.related_tasks.length != 0 && sessionStorage.getObject('changedDefects').length != 0) {
                        for (var i = 0; i < defect.related_tasks.length; i++) {
                            for (var j = 0; j < sessionStorage.getObject('changedDefects').length; j++) {
                                if (defect.related_tasks[i].id == sessionStorage.getObject('changedDefects')[j].old) {
                                    defect.related_tasks[i].id = sessionStorage.getObject('changedDefects')[j].new;
                                    j = sessionStorage.getObject('changedDefects').length;
                                }
                            }
                        }
                    }
                })
                sessionStorage.setObject('changedDefects', []);
            }

            function syncProject(projects, index, def) {
                project = projects[index];
                if (project.isModified) {
                    storeUpdatedDrawings(project);
                    storeNewDefects(project);
                    syncSubcontractors(project);
                    delete project.isModified;
                }
                syncComments();
                syncDefects().then(function(res) {
                    updateDefects();
                    updateDrawings(sessionStorage.getObject('drawingsToUpd'));
                    if (projects[projects.length - 1] == project) {
                        def.resolve();
                    } else {
                        syncProject(projects, index + 1, def);
                    }
                })
            }

            function syncData() {
                var def = $q.defer();
                $indexedDB.openStore('projects', function(store) {
                    store.getAll().then(function(projects) {
                        if (projects.length != 0) {
                            syncProject(projects, 0, def);
                        } else {
                            def.resolve();
                        }
                    })
                })
                return def.promise;
            }
        }
    }
]);
