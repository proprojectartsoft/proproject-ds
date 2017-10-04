dsApp.service('IndexedService', ['$q', function($q) {
    var schemaBuilder,
        dsDb,
        projects,
        settings,
        connectionReady,
        service = this;

    service.createDB = function(callback) {
        // SQL equivalent: CREATE DATABASE IF NOT EXISTS projects
        // This schema definition (or data definition commands in SQL, DDL) is not
        // executed immediately. Lovefield uses builder pattern to build the schema
        // first, then performs necessary database open/creation later.
        try {
            schemaBuilder = lf.schema.create('DS', 24);
        } catch (e) {
            console.log('Error creating new DB: ', e);
            callback({
                error: e,
                finished: true
            });
            return false;
        }

        // SQL equivalent:
        // CREATE TABLE IF NOT EXISTS projects (
        //   version AS STRING,
        //   projects_id AS STRING,
        //   event_type as STRING,
        //   event_id as STRING,
        //   PRIMARY KEY ON ('projects_id')
        // );
        try {
            schemaBuilder.createTable('projects')
                .addColumn('id', lf.Type.INTEGER)
                .addColumn('value', lf.Type.STRING)
                .addPrimaryKey(['id'])
                .addIndex('idxValue', ['value'], false, lf.Order.ASC);
        } catch (e) {
            console.log('Error creating table projects: ', e);
            callback({
                finished: true,
                error: e
            });
            return false;
        }
    };

    service.runCommands = function(e, callback) {
        var params = e.data,
            operation = e.operation;

        if (!connectionReady) {
            // Start of the Promise chaining
            connectionReady = schemaBuilder.connect({
                "onUpgrade": null,
                "storeType": lf.schema.DataStoreType.INDEXED_DB
            })
        }

        connectionReady.then(function(db) {
            dsDb = db;
            projects = db.getSchema().table('projects');
            // settings = db.getSchema().table('settings');

            switch (operation) {
                case 'setProjects':
                    try {
                        service.setProjects(params, function(records) {
                            try {
                                callback({
                                    finished: true
                                });
                            } catch (e) {
                                throw ('Error inserting:' + e);
                            }
                        });
                    } catch (e) {
                        throw ('Error uploading: ' + e);
                    }
                    break;
                case 'getProjects':
                    try {
                        service.getProjects(function(result) {
                            callback({
                                results: result,
                                finished: true
                            });
                        });
                    } catch (e) {
                        throw ('Error fetching:' + e);
                    }
                    break;
                case 'getProject':
                    try {
                        service.getProject(params, function(result) {
                            callback({
                                results: result,
                                finished: true
                            });
                        });
                    } catch (e) {
                        throw ('Error fetching:' + e);
                    }
                    break;
                case 'eraseDb':
                    dsDb.delete().from(projects).exec()
                        .then(function() {
                            callback({
                                results: 0,
                                finished: true
                            });
                        });
                    break;
            }
        });
    };

    service.setProjects = function(data, callback) {
        var insertData = function(data) {
                // now try to insert
                try {
                    // insert or update the db
                    dsDb.insertOrReplace()
                        .into(projects)
                        .values(data)
                        .exec()
                        .then(
                            function(resp) {
                                callback(resp);
                            });
                } catch (e) {
                    console.log('Error :', e);
                    callback(false);
                }
            },
            parseData = function(data) {
                var dt = [],
                    object = false;
                for (var i = 0; i < data.length; i++) {
                    // create lovefield row type
                    object = projects.createRow({
                        'id': data[i].id,
                        'value': data[i].value
                    });
                    dt.push(object);
                }
                insertData(dt);
            };
        parseData(data);
    };

    service.getProjects = function(callback) {
        dsDb
            .select()
            .from(projects)
            .exec()
            .then(
                function(res) {
                    callback(res);
                });
    };

    service.getProject = function(param, callback) {
        dsDb
            .select()
            .from(projects)
            .where(projects.id.eq(param.id))
            .exec()
            .then(
                function(res) {
                    callback(res);
                });
    };
}]);
