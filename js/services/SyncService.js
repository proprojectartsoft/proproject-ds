angular.module($APP.name).factory('SyncService', [
    '$q',
    '$http',
    '$rootScope',
    '$indexedDB',
    '$state',
    '$timeout',
    '$ionicPopup',
    '$ionicPlatform',
    '$filter',
    'orderByFilter',
    'ProjectService',
    'DrawingsService',
    'SubcontractorsService',
    'DefectsService',
    'DownloadsService',
    function($q, $http, $rootScope, $indexedDB, $state, $timeout, $ionicPopup, $ionicPlatform, $filter, orderBy, ProjectService, DrawingsService, SubcontractorsService, DefectsService, DownloadsService) {
        return {
            sync: function() {
                $timeout(function() {
                    var deferred = $q.defer();
                    var failed = false;

                    if (typeof navigator.connection == 'undefined' || (navigator.connection.type != Connection.NONE && navigator.connection.type != Connection.UNKNOWN)) {
                        var syncPopup = $ionicPopup.alert({
                            title: "Syncing",
                            template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                            content: "",
                            buttons: []
                        });

                        function storeNewDefects(project) {
                            var comments = localStorage.getObject('commentsToAdd') || [];
                            var defects = localStorage.getObject('defectsToAdd') || [];
                            var defectsToUpd = localStorage.getObject('defectsToUpd') || [];
                            angular.forEach(project.defects, function(defect) {
                                if (typeof defect.isNew != 'undefined') {
                                    delete defect.isNew;
                                    defects.push(defect);
                                }
                                if (typeof defect.isModified != 'undefined') {
                                    angular.forEach(defect.comments, function(comment) {
                                        if (typeof comment.isNew != 'undefined') {
                                            delete comment.isNew;
                                            comments.push(comment);
                                        }
                                    })
                                    delete defect.isModified;
                                    defectsToUpd.push(defect.completeInfo);
                                }
                                delete defect.isNew;
                                delete defect.isModified;
                            })
                            localStorage.setObject('commentsToAdd', comments);
                            localStorage.setObject('defectsToAdd', defects);
                            localStorage.setObject('defectsToUpd', defectsToUpd);
                        }

                        function storeUpdatedDrawings(drawings) {
                            var drawingsToUpd = [];
                            angular.forEach(drawings, function(draw) {
                                if (typeof draw.isModified != 'undefined') {
                                    delete draw.isModified;
                                    drawingsToUpd.push(draw);
                                }
                            })
                            localStorage.setObject('drawingsToUpd', drawingsToUpd);
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

                        function syncComments(comments) {
                            angular.forEach(comments, function(comment) {
                                DefectsService.create_comment(comment).then(function(res) {
                                    if (comments[comments.length - 1] === comment) {
                                        localStorage.setObject('commentsToAdd', []);
                                    }
                                }, function(err) {
                                    if (comments[comments.length - 1] === comment) {
                                        localStorage.setObject('commentsToAdd', []);
                                    }
                                })
                            })
                        }

                        function addComments(comments, defect_id, defer, doDefer) {
                            if (comments.length == 0 && doDefer) {
                                localStorage.setObject('defectsToAdd', []);
                            }
                            angular.forEach(comments, function(comment) {
                                // update defect id for new comments
                                comment.defect_id = defect_id;
                                DefectsService.create_comment(comment).then(function(res) {
                                    if (comments[comments.length - 1] === comment && doDefer) {
                                        localStorage.setObject('defectsToAdd', []);
                                        defer.resolve();
                                    }
                                }, function(err) {
                                    if (comments[comments.length - 1].id == comment.id && doDefer) {
                                        localStorage.setObject('defectsToAdd', []);
                                        defer.resolve();
                                    }
                                })
                            })
                        }

                        function syncDefects(defects) {
                            var defer = $q.defer();
                            if (defects == null || defects.length == 0) {
                                localStorage.setObject('changedDefects', []);
                                defer.resolve();
                                return defer.promise;
                            }
                            var changed = localStorage.getObject('changedDefects') || [];
                            angular.forEach(defects, function(defect) {
                                var draw = defect.draw;
                                DefectsService.create(defect.completeInfo).then(function(res) {
                                    // update defect id for new markers
                                    $filter('filter')(draw.markers, {
                                        defect_id: defect.id
                                    })[0].defect_id = res;
                                    DrawingsService.update(draw).then(function(drawingupdate) {
                                        addComments(defect.comments, res, defer, defects[defects.length - 1].id == defect.id);
                                    }, function(err) {
                                        addComments(defect.comments, res, defer, defects[defects.length - 1].id == defect.id);
                                    });

                                    changed.push({
                                        old: defect.id,
                                        new: res
                                    })
                                    if (defects[defects.length - 1].id == defect.id)
                                        localStorage.setObject('changedDefects', changed);
                                }, function(err) {
                                    if (defects[defects.length - 1].id == defect.id) {
                                        localStorage.setObject('defectsToAdd', []);
                                        localStorage.setObject('changedDefects', changed);
                                        defer.resolve();
                                    }
                                })
                            })
                            return defer.promise;
                        }

                        function updateDrawings(drawings) {
                            angular.forEach(drawings, function(draw) {
                                DrawingsService.update(draw).then(function(result) {
                                    if (drawings[drawings.length - 1] === draw) {
                                        localStorage.setObject('drawingsToUpd', []);
                                    }
                                }, function(err) {
                                    if (drawings[drawings.length - 1] === draw) {
                                        localStorage.setObject('drawingsToUpd', []);
                                    }
                                })
                            })
                        }

                        function updateDefects(defects) {
                            updateRelatedDefectsId(defects);
                            angular.forEach(defects, function(defect) {
                                DefectsService.update(defect).then(function(res) {
                                    if (defects[defects.length - 1].id === defect.id) {
                                        localStorage.setObject('defectsToUpd', []);
                                    }
                                }, function(err) {
                                    if (defects[defects.length - 1].id === defect.id) {
                                        localStorage.setObject('defectsToUpd', []);
                                    }
                                })
                            })
                        }

                        function updateRelatedDefectsId(defects) {
                            angular.forEach(defects, function(defect) {
                                if (defect.related_tasks.length != 0 && localStorage.getObject('changedDefects').length != 0) {
                                    for (var i = 0; i < defect.related_tasks.length; i++) {
                                        for (var j = 0; j < localStorage.getObject('changedDefects').length; j++) {
                                            if (defect.related_tasks[i].id == localStorage.getObject('changedDefects')[j].old) {
                                                defect.related_tasks[i].id = localStorage.getObject('changedDefects')[j].new;
                                                j = localStorage.getObject('changedDefects').length;
                                                i = defect.related_tasks.length;
                                            }
                                        }
                                    }
                                }
                            })
                            localStorage.setObject('changedDefects', []);
                        }

                        function syncData() {
                            localStorage.setObject('commentsToAdd', []);
                            localStorage.setObject('defectsToAdd', []);
                            localStorage.setObject('defectsToUpd', []);

                            var def = $q.defer();
                            $indexedDB.openStore('projects', function(store) {
                                store.getAll().then(function(projects) {
                                    if (projects.length != 0) {
                                        angular.forEach(projects, function(project) {
                                            if (project.isModified) {
                                                storeUpdatedDrawings(project.drawings);
                                                storeNewDefects(project);
                                                syncSubcontractors(project);
                                                delete project.isModified;
                                            }
                                        })

                                        syncComments(localStorage.getObject('commentsToAdd'));
                                        updateDrawings(localStorage.getObject('drawingsToUpd'));
                                        syncDefects(localStorage.getObject('defectsToAdd')).then(function(res) {
                                            updateDefects(localStorage.getObject('defectsToUpd'));
                                            def.resolve();
                                        })
                                    } else {
                                        def.resolve();
                                    }
                                })
                            })
                            return def.promise;
                        }

                        function createDefects(project) {
                            DefectsService.list_small(project.id).then(function(defects) {
                                project.defects = defects;
                                angular.forEach(project.defects, function(defect) {
                                    DefectsService.get(defect.id).then(function(result) {
                                        defect.completeInfo = result;
                                        angular.forEach(project.drawings, function(draw) {
                                            if (defect.completeInfo.drawing != null && draw.id == defect.completeInfo.drawing.id) {
                                                defect.completeInfo.drawing.pdfPath = draw.pdfPath;
                                            }
                                        })
                                    })
                                    DefectsService.list_comments(defect.id).then(function(result) {
                                        defect.comments = result;
                                    })
                                    DefectsService.list_photos(defect.id).then(function(result) {
                                        defect.attachements = result;
                                    })
                                })
                            })
                        }

                        function createSubcontractors(project) {
                            SubcontractorsService.list(project.id).then(function(subcontractors) {
                                project.subcontractors = subcontractors;
                                angular.forEach(project.subcontractors, function(subcontr) {
                                    SubcontractorsService.list_defects(project.id, subcontr.id).then(function(result) {
                                        subcontr.related = result;
                                    })
                                })
                            })
                        }

                        function createLightDrawings(project) {
                            DrawingsService.list_light(project.id).then(function(result) {
                                project.light_drawings = result;
                                angular.forEach(result, function(draw) {
                                    var d = $filter('filter')(project.drawings, {
                                        id: draw.id
                                    })[0];
                                    draw.path = d.pdfPath;
                                    draw.resized_path = draw.path;
                                })
                            })
                        }

                        function createDrawings(drawings, doDownload, path, def) {
                            angular.forEach(drawings, function(draw) {
                                DrawingsService.list_defects(draw.draw.id).then(function(result) {
                                    draw.draw.relatedDefects = result;
                                })
                                DrawingsService.get_original(draw.draw.id).then(function(result) {
                                    draw.draw.base64String = result.base64String;
                                    if (doDownload) {
                                        DownloadsService.downloadPdf(result, path).then(function(downloadRes) {
                                            if (downloadRes == "") {
                                                failed = true;
                                                draw.draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                                if (drawings[drawings.length - 1] === draw)
                                                    def.resolve();
                                            } else {
                                                draw.draw.pdfPath = downloadRes;
                                                if (drawings[drawings.length - 1] === draw)
                                                    def.resolve();
                                            }
                                        })
                                    } else {
                                        draw.draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                        if (drawings[drawings.length - 1] === draw)
                                            def.resolve();
                                    }
                                })
                            })
                        }

                        function getAllDrawings(projects, doDownload, path) {
                            var def = $q.defer();
                            var draws = [];

                            var cnt = 0;
                            angular.forEach(projects, function(project) {
                                DrawingsService.list(project.id).then(function(drawings) {
                                    cnt++;
                                    project.drawings = drawings;
                                    for (var i = 0; i < project.drawings.length; i++) {
                                        draws.push({
                                            "proj": project,
                                            "draw": project.drawings[i]
                                        })
                                    }
                                    if (projects[projects.length - 1] === project) {
                                        if (draws.length == 0) {
                                            def.resolve();
                                            return;
                                        }
                                        var orderedDraws = orderBy(draws, 'draw.drawing_date', true);
                                        createDrawings(orderedDraws, doDownload, path, def);
                                    }
                                })
                            })
                            return def.promise;
                        }

                        function createData(doDownload, path, def) {
                            ProjectService.list().then(function(projects) {
                                getAllDrawings(projects, doDownload, path).then(function() {
                                    angular.forEach(projects, function(project) {
                                        createLightDrawings(project);
                                        createSubcontractors(project);
                                        createDefects(project);
                                        ProjectService.users(project.id).then(function(result) {
                                            project.users = result;
                                        })
                                        if ((projects[projects.length - 1] === project)) {
                                            $timeout(function() {
                                                def.resolve(projects)
                                            }, 5000);
                                        }
                                    })
                                })
                            })
                        }

                        function getProjects() {
                            var def = $q.defer();
                            syncData().then(function() {
                                $ionicPlatform.ready(function() {
                                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                                        DownloadsService.createDirectory("ds-downloads").then(function(res) {
                                            if (res == 'fail') {
                                                failed = true;
                                                createData(false, res, def);
                                            } else
                                                createData(true, res, def);
                                        })
                                    } else {
                                        createData(false, "", def);
                                        failed = true;
                                    }
                                })
                            })
                            return def.promise;
                        }

                        function storeToIndexDb(projects) {
                            $indexedDB.openStore('projects', function(store) {
                                store.clear();
                            }).then(function(e) {
                                angular.forEach(projects, function(project) {
                                    $indexedDB.openStore('projects', function(store) {
                                        project.op = 0;
                                        store.insert(project).then(function(e) {
                                            if (projects[projects.length - 1] === project) {
                                                syncPopup.close();
                                                deferred.resolve('sync_done');
                                                $state.go('app.projects');
                                            }
                                        });
                                    })
                                })
                            })
                        }

                        getProjects().then(function(projects) {
                            if (failed == true) {
                                var downloadPopup = $ionicPopup.alert({
                                    title: "Download stopped",
                                    template: "<center>Not enough space to download all files</center>",
                                    content: "",
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive',
                                        onTap: function(e) {
                                            downloadPopup.close();
                                            location.reload();
                                        }
                                    }]
                                });
                            }
                            storeToIndexDb(projects);
                        })
                    } else {
                        var savedCredentials = localStorage.getObject('dsremember');
                        var offlinePopup = $ionicPopup.alert({
                            title: "You are offline",
                            template: "<center>You cannot sync your data when offline</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                    }
                    return deferred.promise;
                })
            }
        }
    }
]);
