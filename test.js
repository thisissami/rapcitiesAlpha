var mongodb = require('mongodb'),
  ObjectID = mongodb.ObjectID,
  //mongoserver = new mongodb.Server('10.112.0.110', 26374),
  mongoserver = new mongodb.Server('localhost', 26374),
  dbConnector = new mongodb.Db('uenergy', mongoserver),
  artists, usersCollection, playlists;

dbConnector.open(function(err, db) {
	if(err) {
		console.log('connector.open error');
		console.log(err.message);
		return;
	}
	console.log('DB opened successfully');
	
	db.createCollection('users', function(err, collection) {
		if(err) {
			console.log('error creating users collection');
			console.log(err.message);
			return;
		}

		collection.ensureIndex({fbid:1}, function(err) {
			if(err) { console.log(err); return; }
		});
		
		usersCollection = collection;

		if(playlists && usersCollection) {
			run();
		}
	});

	db.createCollection('playlists', function(err, collection) {
		if(err) {
			console.log('error creating playlists collection');
			console.log(err.message);
			return;
		}
		
		playlists = collection;

		if(usersCollection && playlists) {
			run();
		}
	});
});

function writeHeader(res, type) {
  /*if(type == "html")
    res.writeHead(200, {'Content-Type': 'text/html'});
  else if(type == "json")
    res.writeHead(200, {'Content-Type': 'application/json'});*/
	console.log(type);
}

function writeError(res, value) {
  /*writeHeader(res, "json");
  if(value)
    res.end('{"response": "error", "value": ' + value + '}');
  else
    res.end('{"response": "error"}');*/
	console.log(value);
}

function writeSuccess(res, value) {
  /*writeHeader(res, "json");
  if(value)
    res.end('{"response": "success", "value": ' + value + '}');
  else
    res.end('{"response": "success"}');*/
	console.log(value);
}

// creates a new playlist for a given user
function addPlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "no userID"); return;}
	
	/*var query = getQueries(req);

	if(!query['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}
	var playlistName = query['playlistName'];
	*/
	var playlistName = req['playlistName'];
	
	var playlist = {
		'name': playlistName,
		'owner': userID,
		'videos': new Array()
	};
	
	// inserts a playlist into the playlists collection
	// updates the user's info with a reference to the inserted playlist
	function insertPlaylist() {
		playlists.insert(playlist, function(err, result) {
			if(err) { writeError(res, "error inserting playlist"); return }

			var playlistRef = {
				'name': playlistName,
				'_id': result[0]['_id']
			};

			// update with reference to playlists in user doc
			usersCollection.update(
				{'_id': userID},
				{'$push': {'playlists': playlistRef}}, 
				function(err, count) {
					if(err) { 
						writeError(res, "error updating user doc"); 
						return; 
					}
				
					writeSuccess(res, result);
				}
			);
		});
	}
	
	// if a playlist exists with this name under this user, return error
	// otherwise insert the playlist
	// is this fast enough?
	playlists.findOne(
		{'owner': userID, 'name': playlistName}, 
		function(err, doc) {
			if(doc) { 
				writeError(res, "playlist \""+playlistName+"\" exists already");
				return;
			}

			insertPlaylist();
		}
	);
}

// remove a given playlist for a given user
function removePlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "no userID"); return;}

	/*var query = getQueries(req);

	if(!query['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}
	var playlistName = query['playlistName'];
	*/
	var playlistID = new ObjectID(req['playlistID']);
	
	// find the user doc, check that playlistID is not the favorites
	// remove the playlist from playlists
	// remove the reference to the playlist from the user doc
	usersCollection.findOne({'_id': userID}, function(err, doc) {
		if(err) { writeError(res, "error finding user document"); return; }
		if(!doc) {
			writeError(res, "user doesn't exist in system"); 
			return; 
		}		
		// error if trying to delete Favorites playlist
		if(doc['favId'] == userID) {
			writeError(res, "cannot delete Favorites playlist"); return;
		}
		
		// remove playlist from playlists for user
		playlists.remove(
			{'_id': playlistID, owner: userID}, 
			function(err, result) {
				if(err) { writeError(res, "error removing playlist"); return;}
				
				var pos = -1;			
				var playlistRefs = doc['playlists'];

				for(var i = 0; i < playlistRefs.length; i++) {
					console.log(playlistRefs[i]['_id']);
					if(playlistRefs[i]['_id'].equals(playlistID)) {
						pos = i; break;
					}
				}

				// found a reference to the playlist in the user doc
				if(pos != -1) {
					playlistRefs.splice(pos, 1);
					usersCollection.update(
						{'_id': userID},
						{'$set': {'playlists': playlistRefs}}, 
						function(err, count) {
							if(err) { return {'error': err}; }
						
							writeSuccess(res);
						}
					);
				}
			}
		);
	});
	
}

function run() {
	var user = "50329ad3ac6815bf24000001";
	var playlistID = "503a8b6d4f286ebf38000001";
	//addPlaylist({'user': user, 'playlistName': '1'});
	removePlaylist({'user': user, 'playlistID': playlistID});
}

