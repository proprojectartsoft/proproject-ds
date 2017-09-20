importScripts('../../lib/lovefield/dist/lovefield.js');

var schemaBuilder,
	dsDb,
	projects;

self.addEventListener('message', function (e) {
	var params = e.data.data,
		operation = e.data.operation;

	// SQL equivalent: CREATE DATABASE IF NOT EXISTS projects
	// This schema definition (or data definition commands in SQL, DDL) is not
	// executed immediately. Lovefield uses builder pattern to build the schema
	// first, then performs necessary database open/creation later.
	try {
		schemaBuilder = lf.schema.create('DS', 10);
	} catch (e) {
		console.log('Error creating new DB: ', e);
		self.postMessage({
			totalCount: 0,
			rowCount: 0,
			noRecords: 0,
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
		self.postMessage({
			finished: true
		});
		return false;
	}

	// Start of the Promise chaining
	schemaBuilder.connect({"onUpgrade": null, "storeType": lf.schema.DataStoreType.INDEXED_DB}).then(function (db) {
		dsDb = db;
		projects = db.getSchema().table('projects');

		switch (operation) {
			case 'setProjects':
				try {
					self.setProjects(params, function (records) {
						try {
							self.postMessage({
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
					self.getProjects(function (result) {
						self.postMessage({
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
					self.getProject(params, function (result) {
						self.postMessage({
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
					.then(function () {
							self.postMessage({
								results: 0,
								finished: true
							});
					});
				break;
		}
	});
}, false);

self.setProjects = function (data, callback) {
	var insertData = function (data) {
			// now try to insert
			try {
				// insert or update the db
				dsDb.insertOrReplace()
					.into(projects)
					.values(data)
					.exec()
					.then(
						function (resp) {
							callback(resp);
						});
			} catch (e) {
				console.log('Error :', e);
				callback(false);
			}
		},
		parseData = function (data) {
			var dt = [],
				object = false;
			for (var i = 0; i < data.length; i++) {
				// create lovefield row type
				object = projects.createRow(
					{
						'id': data[i].id,
						'pr_id': data[i].id,
						'value': data[i].value
					}
				);
				dt.push(object);
			}
			insertData(dt);
		};
	parseData(data);
};

self.getProjects = function (callback) {
	dsDb
		.select()
		.from(projects)
		.exec()
		.then(
			function (res) {
				callback(res);
			});
};

self.getProject = function (param, callback) {
	dsDb
		.select()
		.from(projects)
		.where(projects.id.eq(param.id))
		.exec()
		.then(
			function (res) {
				callback(res);
			});
};
