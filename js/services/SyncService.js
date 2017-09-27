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
    '$ionicPopup',
    'IndexedService',
    'DefectsService',
    'DrawingsService',
    'SubcontractorsService',
    'ConvertersService',
    function($q, $http, $state, $timeout, $ionicPlatform, $filter, orderBy, ProjectService, DownloadsService, AuthService, SettingsService, $ionicPopup, IndexedService, DefectsService, DrawingsService, SubcontractorsService, ConvertersService) {

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
                var savedCredentials = localStorage.getObject('dsremember');
                SettingsService.show_message_popup("You are offline", "<center>You can sync your data when online</center>");
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
                    def.resolve([]);
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
                                SettingsService.show_message_popup("Error", "Could not create directory to download the files. Please try again");
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
                                                SettingsService.show_message_popup("Download stopped", "<center>Not enough space to download all files</center>");
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
                drawingsToUpd = [];

            service.getProjects(function(projects) {
                if (projects.length != 0) {
                    syncProject(projects, 0, def);
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
                        SubcontractorsService.update(subcontr).then(function(result) {
                            delete subcontr.isModified;
                        })
                    }
                })
            }

            function syncComments() {
                angular.forEach(commentsToAdd, function(comment) {
                    //add new comment for already existing defect
                    DefectsService.create_comment(comment).then(function(res) {}, function(err) {})
                })
                commentsToAdd = [];
            }
            //add comments for new defects
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
                //get drawing
                var draw = defects[index].drawing;
                var comments = defects[index].comments;
                var related_tasks = defects[index].related_tasks;
                var oldId = defects[index].id;
                var defect = ConvertersService.get_defect_for_create(defects[index]);
                DefectsService.create(defect).then(function(res) {
                    defect.id = res;
                    //if the created defect has related defects that are not added yet to the server, add them to defectsToUpd list
                    var rel = related_tasks;
                    for (var i = 0; i < rel.length; i++) {
                        if (rel[i].isNew) {
                            defectsToUpdate.push(defect);
                            i = defect.related_tasks.length;
                        }
                    }
                    //update defect id for related tasks of the defect to be added
                    angular.forEach(defects, function(defToAdd) {
                        if (defToAdd.related_tasks.length != 0 && oldId != defToAdd.id) {
                            for (var i = 0; i < defToAdd.related_tasks.length; i++) {
                                if (defToAdd.related_tasks[i].id == oldId) {
                                    defToAdd.related_tasks[i].id = res;
                                    delete defToAdd.related_tasks[i].isNew;
                                }
                            }
                        }
                    })
                    if (draw) {
                        var d = $filter('filter')(drawingsToUpd, {
                            id: draw.id
                        })[0];
                        //update marker's defect id
                        if (d && d.markers && d.markers.length) {
                            var mark = $filter('filter')(d.markers, {
                                defect_id: oldId
                            })[0];
                            if (mark) {
                                mark.defect_id = res;
                            }
                        }
                        //update defect's id
                        if (d && d.defects && d.defects.length) {
                            var def1 = $filter('filter')(d.defects, {
                                id: oldId
                            })[0];
                            if (def1) {
                                def1.id = res;
                            }
                        }
                    }
                    addComments(comments, res, defer, defects[defects.length - 1].id == res);
                    changed.push({
                        old: oldId,
                        new: res
                    })
                    if (defects[defects.length - 1].id == res) {
                        sessionStorage.setObject('changedDefects', changed);
                    } else {
                        addDefects(defects, index + 1, defer);
                    }
                }, function(err) {
                    if (defects[defects.length - 1].id == oldId) {
                        sessionStorage.setObject('changedDefects', changed);
                        console.log("defer defects");
                        defer.resolve();
                    } else {
                        addDefects(defects, index + 1, defer);
                    }
                })
            }

            function syncDefects() {
                var defer = $q.defer();
                if (defectsToAdd == null || defectsToAdd.length == 0) {
                    sessionStorage.setObject('changedDefects', []); //TODO:
                    defer.resolve();
                    return defer.promise;
                }
                addDefects(defectsToAdd, 0, defer);
                return defer.promise;
            }

            function updateDrawings() { //TODO:
                angular.forEach(drawingsToUpd, function(draw) {
                    console.log(draw);
                    DrawingsService.update(draw).then(function(result) {}, function(err) {})
                })
            }

            function updateDefects() {
                updateRelatedDefectsId(defectsToUpdate);
                angular.forEach(defectsToUpdate, function(defect) {
                    defect = ConvertersService.get_defect_for_update(defect);
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
                project = projects[index].value;
                if (project.isModified) {
                    storeUpdatedDrawings(project);
                    storeNewDefects(project);
                    syncSubcontractors(project);
                    delete project.isModified;
                }
                syncComments();
                //TODO: sync attachments
                syncDefects().then(function(res) {
                    console.log("defects synced ", index);
                    updateDefects();
                    updateDrawings();
                    if (projects[projects.length - 1].value == project) {
                        def.resolve();
                    } else {
                        syncProject(projects, index + 1, def);
                    }
                })
            }

            return def.promise;
        }
    }
]);
