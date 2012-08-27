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
	
	if(!req['query']) {
		writeError(res, "no query under req!"); return;
	}

	if(!req['query']['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}

	var playlistName = req['query']['playlistName'];
	
	if(playlistName == "Favorites") {
		writeError(res, "playlist can't be named \"Favorites\"");
		return;
	}

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

	if(!req['query']) {
		writeError(res, "no query under req!"); return;
	}

	if(!req['query']['playlistID']) {
		writeError(res, "no playlistID given"); return;
	}
	
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
		if(doc['favId'].equals(playlistID)) {
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
					if(playlistRefs[i]['_id'].equals(playlistID)) {
						pos = i; break;
					}
				}
				// found a reference to the playlist in the user doc
				if(pos != -1) {
					playlistRefs.splice(pos, 1);
					// update user doc to reflect deletion
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

// renames a given playlist to a given name
function renamePlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "no userID"); return;}

	if(!req['query']) {
		writeError(res, "no query under req!"); return;
	}

	if(!req['query']['newPlaylistName']) {
		writeError(res, "no newPlaylistName provided"); return;
	}

	if(!req['query']['playlistID']) {
		writeError(res, "no playlistID provided"); return;
	}

	var newPlaylistName = req['query']['newPlaylistName'];
	var playlistID = new ObjectID(req['query']['playlistID']);

	// make sure user isn't trying to rename a playlist to Favorites
	if(newPlaylistName == "Favorites") {
		writeError(res, "cannot rename a playlist to \"Favorites\""); return;
	}

	usersCollection.findOne({'_id': userID}, function(err, userDoc) {
		if(err) { writeError(res, "error finding user document"); return; }
		if(!userDoc) { 
			writeError(res, "user doesn't exist in system"); return; 
		}

		// disallow renaming Favorites playlist
		if(userDoc['favId'].equals(playlistID)) {
			writeError(res, "cannot rename Favorites playlist"); return;
		}
		var pos = -1;
		// disallow renaming a playlist to an already-used name
		var playlistRefs = userDoc['playlists'];
		// is this good enough for long playlists?
		for(var i = 0; i < playlistRefs.length; i++) {
			if(playlistRefs[i]['name'] == newPlaylistName) {
				writeError(res, "\""+newPlaylistName + "\" already used"); 
				return;
			}
			if(playlistRefs[i]['_id'].equals(playlistID))
				pos = i;
		}
		if(pos == -1) {
			writeError(res, "no reference to "+playlistID +" in user doc");
			return;
		}

		// rename the playlist
		playlists.update({'_id': playlistID, 'owner': userID}, 
			{'$set': {'name': newPlaylistName}},
			function(err) {
				if(err) { writeError(res, "error renaming playlist"); return; }

				playlistRefs[pos]['name'] = newPlaylistName;	

				// update the user's doc
				usersCollection.update({'_id': userID},
					{'$set': {'playlists': playlistRefs}}, 
					function (err) {
						if(err) { writeError(res, err); return; }
						writeSuccess(res);
					}
				);
			}
		);
	});
}

function run() {
	var req = new Object();
	req['user'] = "50329ad3ac6815bf24000001";
	req['query'] = new Object();
	req['query']['playlistID'] = "503adc14dd62abcf44000001";
	req['query']['playlistName'] = 'honolulu';
	req['query']['newPlaylistName'] = 'melbourne';

	//addPlaylist(req);
	//removePlaylist(req);
	renamePlaylist(req);
	//usersCollection.update({'name': 'Bo Ning Han'}, {'$set': {'favId': new ObjectID("503aaebcb631338a45000001")}});
}

