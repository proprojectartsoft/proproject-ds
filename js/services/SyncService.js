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
                }, function(projects) {
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
                                                //not enough space to download all pdfs; stop download
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
            var def = $q.defer(),
                count = 0,
                changes = {};

            service.getProjects(function(projects) {
                //no projects in local db
                if (!projects.length) {
                    def.resolve();
                }
                angular.forEach(projects, function(p) {
                    var project = p.value;
                    //remove all data to add or update for this project
                    changes = {
                        commentsToAdd: [],
                        defectsToAdd: [],
                        defectsToUpd: [],
                        drawingsToUpd: [],
                        attachments: {
                            toAdd: [],
                            toUpd: [],
                            toDelete: []
                        }
                    };
                    if (project.isModified) {
                        //sync all data for modified projects
                        //method to store in changes all drawings that have to be updated
                        getModifiedDrawings(project);
                        //method to store in changes all defects that have to be added or updated
                        getModifiedDefects(project);
                        delete project.isModified;

                        var subcontr = project.subcontractors || [];
                        syncDefects(changes).then(function(res) {
                            var updDefectsPrm = updateDefects(res),
                                updDrawsPrm = updateDrawings(res),
                                saveComments = syncComments(res.commentsToAdd),
                                saveAttachments = syncAttachments(res.attachments),
                                saveSubcontr = syncSubcontractors(subcontr); //TODO: check is subcontr ok

                            Promise.all([updDefectsPrm, updDrawsPrm, saveComments, saveAttachments]).then(function(s) {
                                count++;
                                if (count >= projects.length)
                                    def.resolve();
                            }, function(e) {
                                count++;
                                if (count >= projects.length)
                                    def.resolve();
                            })
                        }, function(e) {
                            count++;
                            if (count >= projects.length)
                                def.resolve();
                        })
                    } else {
                        count++;
                        if (count >= projects.length)
                            def.resolve();
                    }
                })

            })

            function getModifiedDefects(project) {
                angular.forEach(project.defects, function(defect) {
                    //store all new defects for this project
                    if (typeof defect.isNew != 'undefined') {
                        delete defect.isNew;
                        changes.defectsToAdd.push(defect);

                        angular.forEach(defect.photos, function(pic) {
                            console.log(pic);
                            //store new attachments to be synced
                            if (!pic.id) {
                                changes.attachments.toAdd.push(pic);
                            }
                        })
                    }

                    if (typeof defect.isModified != 'undefined') {
                        //store new comments for the defect
                        angular.forEach(defect.comments, function(comment) {
                            //store new comments to be synced
                            if (typeof comment.isNew != 'undefined') {
                                delete comment.isNew;
                                changes.commentsToAdd.push(comment);
                            }
                        })

                        //store new attachments
                        angular.forEach(defect.photos.pictures, function(pic) {
                            //store new attachments to be synced
                            if (!pic.id) {
                                changes.attachments.toAdd.push(pic);
                            }
                        })

                        //add photos to be updated
                        angular.extend(changes.attachments.toUpd, defect.photos.toBeUpdated);
                        //add photos to be deleted
                        angular.extend(changes.attachments.toDelete, defect.photos.toBeDeleted);
                        //store all modified defects for this project
                        changes.defectsToUpd.push(defect);
                    }
                    delete defect.isNew;
                    delete defect.isModified;
                })
            }

            function getModifiedDrawings(project) {
                angular.forEach(project.drawings, function(draw) {
                    //store modified drawings
                    if (typeof draw.isModified != 'undefined') {
                        delete draw.isModified;
                        changes.drawingsToUpd.push(draw);
                    }
                })
            }

            function syncSubcontractors(subcontractors) {
                var defer = $q.defer(),
                    count = 0;
                if (!subcontractors.length)
                    defer.resolve();
                angular.forEach(subcontractors, function(subcontr) {
                    //store modified subcontractors to server
                    if (typeof subcontr.isModified != 'undefined') {
                        PostService.post({
                            method: 'PUT',
                            url: 'subcontractor',
                            data: subcontr
                        }, function(result) {
                            count++;
                            delete subcontr.isModified;
                            if (count >= subcontractors.length)
                                defer.resolve();
                        }, function(error) {
                            count++;
                            delete subcontr.isModified;
                            if (count >= subcontractors.length)
                                defer.resolve();
                        })
                    } else {
                        count++;
                        if (count >= subcontractors.length)
                            defer.resolve();
                    }
                })
                return defer.promise;
            }

            function syncComments(comments) {
                var defer = $q.defer(),
                    count = 0;
                if (!comments.length)
                    defer.resolve();
                angular.forEach(comments, function(comment) {
                    //add new comment for already existing defect
                    PostService.post({
                        method: 'POST',
                        url: 'defectcomment',
                        data: comment
                    }, function(result) {
                        count++;
                        if (count >= comments.length) {
                            defer.resolve();
                        }
                    }, function(error) {
                        count++;
                        if (count >= comments.length) {
                            defer.resolve();
                        }
                    })
                })
                return defer.promise;
            }

            function syncAttachments(attachments) {
                var defer = $q.defer();

                var doPost = function(attachments, url, method) {
                    var def = $q.defer(),
                        count = 0;
                    if (attachments.length == 0) {
                        def.resolve();
                    }
                    angular.forEach(attachments, function(attachment) {
                        //add new attachment or update an existing one for already existing defect
                        PostService.post({
                            method: method,
                            url: url,
                            data: attachment
                        }, function(result) {
                            count++;
                            if (count >= attachments.length)
                                def.resolve();
                        }, function(error) {
                            count++;
                            if (count >= attachments.length)
                                def.resolve();
                        })
                    })
                    return def.promise;
                };

                var addPrm = doPost(attachments.toAdd, 'defectphoto/uploadfile', 'POST'),
                    updatePrm = doPost(attachments.toUpd, 'defectphoto', 'PUT'),
                    deletePrm = '';
                if (attachments.toDelete.length) {
                    deletePrm = PostService.post({
                        method: 'POST',
                        url: 'defectphoto',
                        data: attachments.toDelete
                    }, function(result) {}, function(error) {});
                }
                Promise.all([addPrm, updatePrm, deletePrm]).then(function(res) {
                    defer.resolve();
                })
                return defer.promise;
            }

            function addDefect(oldDefect, changes) {
                var defer = $q.defer(),
                    defect = ConvertersService.get_defect_for_create(oldDefect);
                //save defect on server
                PostService.post({
                    method: 'POST',
                    url: 'defect',
                    data: defect
                }, function(res) {
                    //set for the new added defect the id stored on server
                    defect.id = res.data;

                    //if the created defect has related defects that are not added yet to the server,
                    //add it to defectsToUpd list and update it after the related defects get on server
                    for (var i = 0; i < oldDefect.related_tasks.length; i++) {
                        if (oldDefect.related_tasks[i].isNew) {
                            defect.related_tasks = oldDefect.related_tasks;
                            changes.defectsToUpd.push(defect);
                            i = defect.related_tasks.length;
                        }
                    }

                    var setRelatedTaskId = function(defects, oldId, newId) {
                        angular.forEach(defects, function(d) {
                            //search through all other defects' related tasks the new defect
                            if (d.related_tasks.length != 0 && oldId != d.id) {
                                for (var i = 0; i < d.related_tasks.length; i++) {
                                    if (d.related_tasks[i].id == oldId) {
                                        //set the new assigne id for the related task
                                        d.related_tasks[i].id = newId;
                                        delete d.related_tasks[i].isNew;
                                    }
                                }
                            }
                        })
                    }

                    //if there is an updated defect having the current defect as related, update its id
                    setRelatedTaskId(changes.defectsToUpd, oldDefect.id, res.data);
                    //if there is a new defect having the current defect as related, update its id
                    setRelatedTaskId(changes.defectsToAdd, oldDefect.id, res.data);

                    if (oldDefect.drawing) {
                        //get the drawing of the new added defect from the array of drawings to be updated
                        var d = $filter('filter')(changes.drawingsToUpd, {
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

                    //set the new id of the added defect as defect_id for all its new attachments
                    angular.forEach(changes.attachments.toAdd, function(pic) {
                        pic.defect_id = res.data;
                    })

                    //set the new id of the added defect as defect_id for all its comments
                    angular.forEach(changes.commentsToAdd, function(comment) {
                        comment.defect_id = res.data;
                    })
                    defer.resolve(changes);
                }, function(error) {
                    defer.resolve(changes); //TODO: reject
                    console.log(error);
                })
                return defer.promise;
            }

            function syncDefects(changes) {
                var defer = $q.defer();
                if (changes.defectsToAdd == null || changes.defectsToAdd.length == 0) {
                    defer.resolve(changes); //TODO: reject
                    return defer.promise;
                }
                var count = 0;

                angular.forEach(changes.defectsToAdd, function(defect) {
                    addDefect(defect, changes).then(function(res) {
                        count++;
                        if (count >= changes.defectsToAdd.length) {
                            defer.resolve(res);
                        }
                    }, function(error) {
                        count++;
                        if (count >= changes.defectsToAdd.length) {
                            defer.resolve(error); //TODO: reject
                        }
                    })
                })
                return defer.promise;
            }

            function updateDrawings(changes) {
                var defer = $q.defer(),
                    count = 0;
                if (!changes.drawingsToUpd.length)
                    defer.resolve();
                angular.forEach(changes.drawingsToUpd, function(draw) {
                    PostService.post({
                        method: 'PUT',
                        url: 'drawing',
                        data: ConvertersService.get_drawing_for_update(draw)
                    }, function(result) {
                        count++;
                        if (count >= changes.drawingsToUpd.length)
                            defer.resolve();
                    }, function(error) {
                        count++;
                        if (count >= changes.drawingsToUpd.length)
                            defer.resolve();
                    })
                })
                return defer.promise;
            }

            function updateDefects(changes) {
                var defer = $q.defer(),
                    count = 0;
                if (!changes.defectsToUpd.length)
                    defer.resolve();

                var defects = changes.defectsToUpd;
                // updateRelatedDefectsId(defects);
                angular.forEach(defects, function(defect) {
                    defect = ConvertersService.get_defect_for_update(defect);
                    //if the defect to be updated was added on server during this sync, it has no reporter set
                    //get the defect from server and set the reporter_id, then update it
                    if (!defect.reporter_id || !defect.assignee_id) {
                        PostService.post({
                            method: 'GET',
                            url: 'defect',
                            params: {
                                id: defect.id
                            }
                        }, function(result) {
                            defect.reporter_id = result.data.reporter_id;
                            defect.assignee_id = result.data.assignee_id;
                            PostService.post({
                                method: 'PUT',
                                url: 'defect',
                                data: defect
                            }, function(result) {
                                count++;
                                if (count >= defects.length)
                                    defer.resolve();
                            }, function(error) {
                                count++;
                                if (count >= defects.length)
                                    defer.resolve();
                            })
                        }, function(error) {
                            count++;
                            //TODO: reject could not update defect
                            if (count >= defects.length)
                                defer.resolve();
                        })
                    } else {
                        PostService.post({
                            method: 'PUT',
                            url: 'defect',
                            data: defect
                        }, function(result) {
                            count++;
                            if (count >= defects.length)
                                defer.resolve();
                        }, function(error) {
                            count++;
                            if (count >= defects.length)
                                defer.resolve();
                        })
                    }
                })
                return defer.promise;
            }
            return def.promise;
        }
    }
]);
