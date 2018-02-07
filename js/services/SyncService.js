dsApp.service('SyncService', [
    '$q',
    '$http',
    '$state',
    '$timeout',
    '$ionicPlatform',
    '$filter',
    'orderByFilter',
    'DownloadsService',
    'AuthService',
    'IndexedService',
    'ConvertersService',
    'PostService',
    function($q, $http, $state, $timeout, $ionicPlatform, $filter, orderBy, DownloadsService, AuthService, IndexedService, ConvertersService, PostService) {

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

        service.login = function(callback) {
            //user already logged
            if (sessionStorage.getObject('isLoggedIn')) {
                callback("logged");
            } else if (localStorage.getObject('dsremember')) {
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
            } else {
                callback("error");
            }
        };

        service.sync = function() {
            var deferred = $q.defer();
            var failed = false;
            if (navigator.onLine) {
                service.login(function(res) {
                    if (res === "logged") {
                        PostService.post({
                            method: 'GET',
                            url: 'me',
                            data: {}
                        }, function() {
                            service.clearDb(function() {
                                buildData().then(
                                    function() {
                                        deferred.resolve('sync_done');
                                    },
                                    function(reason) {
                                        deferred.reject(reason);
                                    });
                            });

                            //method to provide a format for data received from server and store it in local db
                            var buildData = function() {
                                var def = $q.defer();
                                //get projects from server
                                getProjectsList().then(function(projects) {
                                    //no projects stored
                                    if (!projects.length) {
                                        def.resolve([]);
                                        return;
                                    }
                                    //download pdfs for all drawings of all projects
                                    downloadPdfs(projects).then(function(res) {
                                        //store the projects in indexedDB
                                        service.setProjects(res, function(proj) {
                                            def.resolve(proj);
                                        });
                                    });
                                }, function(reason) {
                                    def.reject('Error loading projects from the server. Reason: ' + reason);
                                });
                                return def.promise;
                            }

                            //method to get all projects from server
                            var getProjectsList = function() {
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
                                    def.reject(error);
                                })
                                return def.promise;
                            }

                            //method to download the pdfs for all drawings of all projects
                            var downloadPdfs = function(projects) {
                                var def = $q.defer();
                                $ionicPlatform.ready(function() {
                                    //create directory to download the pdfs
                                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                                        DownloadsService.createDirectory("ds-downloads").then(function(path) {
                                            var countProj = 0;
                                            angular.forEach(projects, function(proj) {
                                                if (!proj.value.drawings || proj.value.drawings && !proj.value.drawings.length) {
                                                    countProj++;
                                                    if (countProj >= projects.length)
                                                        def.resolve(projects);
                                                }
                                                //order drawings by date to download first the most recent drawings
                                                proj.value.drawings = orderBy(proj.value.drawings, 'draw.drawing_date', true);
                                                var count = 0;
                                                //download the pdf for every drawing
                                                angular.forEach(proj.value.drawings, function(draw) {
                                                    DownloadsService.downloadPdf(draw, path).then(function(downloadRes) {
                                                        count++;
                                                        draw.pdfPath = downloadRes;
                                                        //stop when all pdfs have been downloaded
                                                        if (count >= proj.value.drawings.length) {
                                                            countProj++;
                                                            if (countProj >= projects.length) {
                                                                def.resolve(projects);
                                                            }
                                                        }
                                                    }, function(reason) {
                                                        // SettingsService.close_all_popups();
                                                        // $timeout(function() {
                                                        //     SettingsService.show_message_popup("Download stopped", reason);
                                                        // }, 100);
                                                        def.resolve(projects);
                                                    })
                                                })
                                            })
                                        }, function(reason) {
                                            // SettingsService.close_all_popups();
                                            // $timeout(function() {
                                            //     SettingsService.show_message_popup("Download stopped", reason);
                                            // }, 100);
                                            def.resolve(projects);
                                        })
                                    } else {
                                        console.log("You are not on mobile. Files download not necessary.");
                                        def.resolve(projects);
                                    }
                                })
                                return def.promise;
                            }
                        }, function(e) {
                            if (!navigator.onLine) {
                                var loggedIn = localStorage.getObject('dsremember');
                                deferred.resolve({
                                    error: "You are offline",
                                    message: "You can sync your data when online"
                                });
                                // SettingsService.close_all_popups();
                                // $timeout(function() {
                                //     SettingsService.show_message_popup("You are offline", "You can sync your data when online");
                                // }, 100);
                            }
                            deferred.resolve({
                                error: "Error",
                                message: "An unexpected error occured during authentication and sync could not be done. Please try again."
                            });
                        })
                    } else {
                        deferred.reject("An unexpected error occured during authentication and sync could not be done. Please try again.");
                        $state.go('login');
                    }
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };

        //method to add/delete or update the given attachments
        service.syncAttachments = function(attachments) {
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

        //method to add the given comments to server
        service.syncComments = function(comments) {
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

        //method to add/update the given subcontractors
        service.syncSubcontractors = function(subcontractors) {
            var defer = $q.defer(),
                count = 0;
            if (!subcontractors.length)
                defer.resolve();
            angular.forEach(subcontractors, function(subcontr) {
                //store modified subcontractors to server
                if (subcontr.isModified) {
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

        service.syncData = function() {
            var def = $q.defer(),
                count = 0;
            service.login(function(response) {
                if (response === "logged") {
                    // console.log('we are syncing the data in Syncservice');
                    service.getProjects(function(projects) {
                        //no projects in local db
                        if (!projects.length) {
                            def.resolve();
                            return;
                        }
                        var changes = {},
                            //method to store in changes all defects that have to be added or updated
                            getModifiedDefects = function(project) {
                                angular.forEach(project.defects, function(defect) {
                                    //store all new defects for this project
                                    if (defect.isNew) {
                                        console.log("NEW: " + defect.id);
                                        delete defect.isNew;
                                        changes.defectsToAdd.push(defect);
                                    }

                                    if (defect.isModified) {
                                        console.log("MODIFIED: " + defect.id);
                                        delete defect.isModified;
                                        //store all modified defects for this project
                                        changes.defectsToUpd.push(defect);
                                    }
                                })
                            },
                            //method to store in changes all drawings that have to be updated
                            getModifiedDrawings = function(project) {
                                angular.forEach(project.drawings, function(draw) {
                                    //store modified drawings
                                    if (draw.isModified) {
                                        delete draw.isModified;
                                        changes.drawingsToUpd.push(draw);
                                    }
                                })
                            },
                            //method to add a given defect to server, and keep data to be synced
                            // (subcontractors, attachments, comments, drawing)
                            addDefect = function(changes, index, defer) { //oldDefect, changes
                                var oldDefect = changes.defectsToAdd[index],
                                    defect = ConvertersService.get_defect_for_create(oldDefect);
                                console.log("post defect with index " + index);
                                //save defect on server
                                PostService.post({
                                    method: 'POST',
                                    url: 'defect',
                                    data: defect
                                }, function(res) {
                                    //set for the new added defect the id stored on server
                                    defect.id = res.data;

                                    if(navigator.onLine) {
                                        //mixpanel people proprieties
                                        mixpanel.people.increment('Defects created: DS app', 1);
                                    }

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

                                    var attachments = {
                                        toAdd: [],
                                        toUpd: [],
                                        toDelete: []
                                    };
                                    //set the new id of the added defect as defect_id for all its new attachments
                                    angular.forEach(oldDefect.photos.pictures, function(pic) {
                                        pic.defect_id = res.data;
                                    })
                                    attachments.toAdd = oldDefect.photos.pictures || [];

                                    //set the new id of the added defect as defect_id for all its comments
                                    angular.forEach(oldDefect.comments, function(comment) {
                                        comment.defect_id = res.data;
                                    })
                                    var commPrm = service.syncComments(oldDefect.comments || []),
                                        attPrm = service.syncAttachments(attachments);
                                    Promise.all([commPrm, attPrm]).then(function(r) {
                                        index++;
                                        if (index < changes.defectsToAdd.length)
                                            addDefect(changes, index, defer);
                                        else
                                            defer.resolve(changes);
                                    })
                                }, function(error) {
                                    index++;
                                    if (index < changes.defectsToAdd.length)
                                        addDefect(changes, index, defer);
                                    else
                                        defer.resolve(changes);
                                })
                                return defer.promise;
                            },
                            //method to sync all defects for the given project
                            syncDefects = function(changes) {
                                var defer = $q.defer();
                                if (changes.defectsToAdd == null || changes.defectsToAdd.length == 0) {
                                    defer.resolve(changes);
                                    return defer.promise;
                                }
                                addDefect(changes, 0, defer);
                                return defer.promise;
                            },
                            //method to update the drawings
                            updateDrawings = function(changes) {
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
                            },
                            //method to update the defects
                            updateDefects = function(changes) {
                                var defer = $q.defer(),
                                    count = 0;
                                if (!changes.defectsToUpd.length)
                                    defer.resolve(changes);

                                var defects = changes.defectsToUpd,
                                    update = function(defect) {
                                        var d = $q.defer();
                                        PostService.post({
                                            method: 'PUT',
                                            url: 'defect',
                                            data: defect
                                        }, function(result) {
                                            d.resolve();
                                        }, function(error) {
                                            d.resolve();
                                        })
                                        return d.promise;
                                    }
                                // updateRelatedDefectsId(defects);
                                angular.forEach(defects, function(defect) {
                                    var oldDefect = angular.copy(defect);
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
                                            var attachments = {
                                                    toAdd: [],
                                                    toUpd: oldDefect.photos.toBeUpdated || [],
                                                    toDelete: oldDefect.photos.toBeDeleted || []
                                                },
                                                commToAdd = [];

                                            //store new comments for the defect
                                            angular.forEach(oldDefect.comments, function(comment) {
                                                //store new comments to be synced
                                                if (comment.isNew) {
                                                    delete comment.isNew;
                                                    commToAdd.push(comment);
                                                }
                                            })
                                            //store new attachments
                                            angular.forEach(oldDefect.photos.pictures, function(pic) {
                                                //store new attachments to be synced
                                                if (!pic.id) {
                                                    attachments.toAdd.push(pic);
                                                }
                                            })

                                            var commPrm = service.syncComments(commToAdd),
                                                attPrm = service.syncAttachments(attachments),
                                                updPrm = update(defect);
                                            Promise.all([updPrm, commPrm, attPrm]).then(function(r) {
                                                count++;
                                                if (count >= defects.length)
                                                    defer.resolve(changes);
                                            })
                                        }, function(error) {
                                            count++;
                                            if (count >= defects.length)
                                                defer.resolve(changes);
                                        })
                                    } else {
                                        var attachments = {
                                                toAdd: [],
                                                toUpd: oldDefect.photos.toBeUpdated || [],
                                                toDelete: oldDefect.photos.toBeDeleted || []
                                            },
                                            commToAdd = [];

                                        //store new comments for the defect
                                        angular.forEach(oldDefect.comments, function(comment) {
                                            //store new comments to be synced
                                            if (comment.isNew) {
                                                delete comment.isNew;
                                                commToAdd.push(comment);
                                            }
                                        })
                                        //store new attachments
                                        angular.forEach(oldDefect.photos.pictures, function(pic) {
                                            //store new attachments to be synced
                                            if (!pic.id) {
                                                attachments.toAdd.push(pic);
                                            }
                                        })
                                        var commPrm = service.syncComments(commToAdd),
                                            attPrm = service.syncAttachments(attachments),
                                            updPrm = update(defect);
                                        Promise.all([updPrm, commPrm, attPrm]).then(function(r) {
                                            count++;
                                            if (count >= defects.length)
                                                defer.resolve(changes);
                                        })
                                    }
                                })
                                return defer.promise;
                            };

                        angular.forEach(projects, function(p) {
                            var project = p.value;
                            //remove all data to add or update for this project
                            changes = {
                                defectsToAdd: [],
                                defectsToUpd: [],
                                drawingsToUpd: [],
                            };
                            if (project.isModified) {
                                //sync all data for modified projects
                                getModifiedDrawings(project);
                                getModifiedDefects(project);
                                delete project.isModified;

                                var subcontr = project.subcontractors || [];
                                syncDefects(changes).then(function(res) {
                                    var updDefectsPrm = updateDefects(res),
                                        updDrawsPrm = updateDrawings(res),
                                        saveSubcontr = service.syncSubcontractors(subcontr);

                                    Promise.all([updDefectsPrm, updDrawsPrm, saveSubcontr]).then(function(s) {
                                        count++;
                                        if (count >= projects.length)
                                            def.resolve();
                                    }, function(e) {
                                        count++;
                                        if (count >= projects.length)
                                            def.resolve();
                                    })
                                })
                            } else {
                                count++;
                                if (count >= projects.length)
                                    def.resolve();
                            }
                        })

                    }, function(err) {
                        def.resolve();
                    })
                } else {
                    def.reject("An unexpected error occured during authentication and sync could not be done. Please try again.")
                }
            })
            return def.promise;
        }
    }
]);
