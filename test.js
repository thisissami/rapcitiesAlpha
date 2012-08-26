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
		
		console.log("users collection finished");
		usersCollection = collection;

		if(playlists && usersCollection) {
			console.log("users collection last");			
			run();
		}
	});

	db.createCollection('playlists', function(err, collection) {
		if(err) {
			console.log('error creating playlists collection');
			console.log(err.message);
			return;
		}
		
		console.log("playlists collection finished");
		playlists = collection;

		if(usersCollection && playlists) {
			console.log("playlists collection last");			
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
	/*if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(userID == null) { writeError(res, "no userID"); return;}
	*/
	
	var userId = req['userId'];
	/*var query = getQueries(req);

	if(!query['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}
	var playlistName = query['playlistName'];
	*/
	var playlistName = req['playlistName'];
	
	var playlist = new Object();
	playlist['name'] = playlistName;
	playlist['owner'] = userId;
	playlist['videos'] = new Array();
	
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
				{'_id': userId},
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
		{'owner': userId, 'name': playlistName}, 
		function(err, doc) {
			if(doc) { 
				writeError(res, "playlist \""+playlistName+"\" exists already");
				return;
			}

			insertPlaylist();
		}
	);
}

// returns user's favorites playlist if it exists
function getFavorite(userId) {
	usersCollection.findOne({'_id': userId}, function(err, doc) {
		if(err) { return {'error': err}; }
		if(!doc) { return {'error': 'No such user'}; }
		
		// if favID is defined, return the favorites playlist
		// else create the favorites playlist for the user
		if(doc['favId']) {

		} else {
			var favorites = {
				'name': "Favorites",
				'owner': userId,
				'videos': new Array()
			};

			playlists.insert(favorites, function(err, result) {
				if(err) { return {'error': err}; }

				// update with reference to favorites in user doc
				usersCollection.update(
					{'_id': userId},
					{'$set': {'favId': result[0]['_id']}}, 
					function(err, count) {
						if(err) { return {'error': err}; }
						
						return {
							'name': 'Favorites',
							'_id': result[0]['_id']
						};
					}
				);
			});
		}
	});
}

// returns the user's favorites and other playlists
function getPlaylists() {

}

function run() {
	var userId = new ObjectID("50329ad3ac6815bf24000001");
	//getFavorite(userId);
	addPlaylist({'userId': userId, 'playlistName': '0'});
}
