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
  if(type == "html")
    res.writeHead(200, {'Content-Type': 'text/html'});
  else if(type == "json")
    res.writeHead(200, {'Content-Type': 'application/json'});
}

function writeError(res, value) {
  writeHeader(res, "json");
  if(value)
    res.end('{"response": "error", "value": ' + value + '}');
  else
    res.end('{"response": "error"}');
}

function writeSuccess(res, value) {
  writeHeader(res, "json");
  if(value)
    res.end('{"response": "success", "value": ' + value + '}');
  else
    res.end('{"response": "success"}');
}

// creates a new playlist for a given user
function createPlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(userID == null) { writeError(res, "no userID"); return;}
	
	/*var query = getQueries(req);

	if(!query['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}
	var playlistName = query['playlistName'];
	*/
	
	
	var playlist = new Object();
	playlist['name'] = req['playlistName'];
	playlist['creator'] = userID;
	playlist['owner'] = userID;
	playlist['subscribers'] = new Array(userID);
	playlist['videos'] = new Array();
	
	playlists.insert(playlist);
}

// returns info about user's favorites playlist if it exists
// creates favorites playlist otherwise and returns info
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
	getFavorite(userId);
}
