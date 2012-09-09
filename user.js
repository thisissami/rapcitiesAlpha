var mongodb = require('mongodb'),
  ObjectID = mongodb.ObjectID,
  //mongoserver = new mongodb.Server('10.112.0.110', 26374),
  mongoserver = new mongodb.Server('localhost', 26374),
  dbConnector = new mongodb.Db('uenergy', mongoserver),
  usersCollection, playlists;
var graph = require('fbgraph');


dbConnector.open(function(err, db){
  if(err) {
    console.log('connector.open error (login.js)');
    console.log(err.message);
  } else {
    db.createCollection('users', function(err, collection) {
      if(err) {
        console.log('ERROR      creating users collection (login.js)');
        console.log(err.message);
      } else {
        collection.ensureIndex({fbid:1}, function(err) {
          if(err) console.log(err);
        });
        usersCollection = collection;
      }
    });
	db.createCollection('playlists', function(err, playcol) {
		if(err) {
			console.log('ERROR     creating playlists collection');
			console.log(err.message);
			return;
		}
		playlists = playcol;
	});
  }
});

/*
playlist item needs
1) date+time added (definite), using javascript Date()
2) _id (definite)
3) locTitle (definite)
4) RID (if _id refers to a list)
5) itemTitle (possible)
playlists is Object
playlist is Object, playlist referred to by name
playlist contains video list, possibly others
video is object with those attributes
*/

function getQueries(req) {
 parser = require('url');
 var url = parser.parse(req.url, true);
 return url.query;
}

function writeHeader(res, type) {
  if(type == "html")
    res.writeHead(200, {'Content-Type': 'text/html'});
  else if(type == "json")
    res.writeHead(200, {'Content-Type': 'application/json'});
}

function writeError(res, value) {
  writeHeader(res, "json");
  if(value != null)
    res.end('{"response": "error", "value": ' + value + '}');
  else
    res.end('{"response": "error"}');
}

function writeSuccess(res, value) {
	if(!value)
		value = new Object();
	value["success"] = true;

	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify(value));
}

function writeCursor(res, cursor) {
  writeHeader(res, "json");
  cursor.toArray(function(err, docs) {
    if(err) {
      console.log(err);
      writeError(res, "Error changing cursor to array");
      return;
    }
    res.end(JSON.stringify(docs));
  });
}

// creates a new playlist for a given user
function addPlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "ObjectID creation error"); return;}
	
	if(!req['query']) {
		writeError(res, "no query under req!"); return;
	}
	var query = req['query'];

	if(!query['playlistName']) {
		writeError(res, "query['playlistName'] doesn't exist"); return;
	}
	var playlistName = query['playlistName'];
	
	if(playlistName == "Favorites") {
		writeError(res, "playlist can't be named \"Favorites\"");
		return;
	}

	var date = new Date();

	var playlist = {
		'name': playlistName,
		'owner': userID,
		'videos': new Array(),
		'date': date
	};
	
	// inserts a playlist into the playlists collection
	// updates the user's info with a reference to the inserted playlist
	function insertPlaylist() {
		playlists.insert(playlist, function(err, result) {
			if(err) { writeError(res, err); return }

			var playlistID = result[0]['_id'];

			var playlistRef = {
				'name': playlistName,
				'_id': playlistID,
				'date': date
			};

			// update with reference to playlists in user doc
			usersCollection.update(
				{'_id': userID},
				{'$push': {'playlists': playlistRef}}, 
				function(err, count) {
					if(err) { writeError(res, err); return; }
				
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
			if(err) { writeError(res, err); return; }
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
		writeError(res, "req['query'] doesn't exist"); return;
	}
	var query = req['query'];

	if(!query['playlistID']) {
		writeError(res, "query['playlistID'] doesn't exist"); return;
	}
	var playlistID = new ObjectID(query['playlistID']);
	
	// find the user doc, check that playlistID is not the favorites
	// remove the playlist from playlists
	// remove the reference to the playlist from the user doc
	usersCollection.findOne({'_id': userID}, function(err, doc) {
		if(err) { writeError(res, err); return; }
		if(!doc) {
			writeError(res, "user "+userID+" doesn't exist in system"); 
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
				if(err) { writeError(res, err); return;}
				
				var pos = -1;			
				var playlistRefs = doc['playlists'];

				for(var i = 0; i < playlistRefs.length; i++) {
					if(playlistRefs[i]['_id'].equals(playlistID)) {
						pos = i; break;
					}
				}
				if(pos == -1) {
					writeError(res, 
						"no reference to "+playlistID +" in user doc"); return;
				}

				// found a reference to the playlist in the user doc
				playlistRefs.splice(pos, 1);
				// update user doc to reflect deletion
				usersCollection.update(
					{'_id': userID},
					{'$set': {'playlists': playlistRefs}}, 
					function(err, count) {
						if(err) { writeError(res,err); return; }
					
						writeSuccess(res);
					}
				);
			}
		);
	});
}

// renames a given playlist to a given name
function renamePlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "userID creation error"); return;}

	if(!req['query']) {
		writeError(res, "req['query'] doesn't exist"); return;
	}
	var query = req['query'];

	if(!query['newPlaylistName']) {
		writeError(res, "query['newPlaylistName'] doesn't exist"); 
		return;
	}
	var newPlaylistName = query['newPlaylistName'];

	if(!query['playlistID']) {
		writeError(res, "query['playlistID'] doesn't exist"); return;
	}
	var playlistID = new ObjectID(query['playlistID']);

	// make sure user isn't trying to rename a playlist to Favorites
	if(newPlaylistName == "Favorites") {
		writeError(res, "cannot rename a playlist to \"Favorites\"");
		return;
	}

	usersCollection.findOne({'_id': userID}, function(err, userDoc) {
		if(err) { 
			writeError(res, err); return; 
		}
		if(!userDoc) { 
			writeError(res, "user " + userID + " doesn't exist in system"); 
			return; 
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
				writeError(res, "'"+newPlaylistName + "' already used"); 
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
				if(err) { writeError(res, err); return;	}

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

// returns info about user's favorites an other playlists
function getPlaylists(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "userID creation error"); return;}

	usersCollection.findOne({'_id': userID}, function(err, userDoc){
		if(err) { writeError(res, err); return; }
		if(!userDoc) { 
			writeError(res, "user doesn't exist in system"); return; 
		}

		if(!userDoc['favId']) {
			writeError(res, "favId field under user doc nonexistent"); return;	
		}

		writeSuccess(res, {
			'favId': userDoc['favId'], 
			'playlists': userDoc['playlists']
		});
	});
}

// returns info about a given playlist, doesn't care if requester is owner
function getPlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "userID creation error"); return;}

	if(!req['query']) {
		writeError(res, "req['query'] doesn't exist!"); return;
	}
	var query = req['query'];
	if(!query['playlistID']) {
		writeError(res, "no playlistID provided"); return;
	}
	var playlistID = new ObjectID(query['playlistID']);

	playlists.findOne({'_id': playlistID}, function(err, playlist) {
		if(err) { writeError(res, err); return; }
		else if(!playlist) {
			writeError(res, "playlist "+playlistID+" doesn't exist in system"); 
			return;
		} else
			writeSuccess(res, playlist);
	});
}

// adds a video to a given playlist, user needs to own the playlist, for now
function addVideo(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "userID creation error"); return;}

	if(!req['query']) {
		writeError(res, "req['query'] doesn't exist!"); return;
	}
	var query = req['query'];

	if(!query['playlistID']) {
		writeError(res, "query['playlistID'] doesn't exist"); return;
	}
	var playlistID = new ObjectID(query['playlistID']);

	var date = new Date();

	// Object that stores video information
	var video = new Object();

	if(!query['locationID']) {
		writeError(res, "query['locationID'] doesn't exist"); return;
	}
	video['locationID'] = query['locationID'];

	if(!query['locTitle']) {
		writeError(res, "query['locTitle'] doesn't exist"); return;
	}
	video['locTitle'] = query['locTitle'];

	if(query['RID']) video['RID'] = query['RID'];

	if(video['RID']) {
		if(!query['itemTitle']) {
			writeError(res, "query['itemTitle'] doesn't exist"); return;
		} else {
			video['itemTitle'] = query['itemTitle'];
		}
	}

	video['date'] = date;

	// doing it this way because permission to modify may extend to other users
	/* not checking owner until playlist is retrieved, so permission policy
	   may be modified easily
	*/
	playlists.findOne({'_id': playlistID}, function(err, playlistDoc) {
		if(err) { writeError(res, err); return; }
		if(!playlistDoc) {
			writeError(res,"playlist "+playlistID+" does not exist"); return;
		}

		if(playlistDoc['owner'].equals(userID) == false) {
			writeError(res, 
				"user "+userID+" not allowed to modify "+playlistID); return;
		}
		var videos = playlistDoc['videos'];
		if(!videos) videos = new Array();
		// check if video already contained in the playlist
		for(var i = 0; i < videos.length; i++) {
			if(videos[i]['locationID'] == video['locationID']) {
				if(video['RID']) {
					if(videos[i]['RID'] == video['RID']) {
						writeError(res, "video already in playlist"); return;
					}
				} else {
					writeError(res, "video already in playlist"); return;
				}
			}
		}

		// add video to playlist
		videos.push(video);
		playlists.update({'_id': playlistID}, {'$set': {'videos': videos}},
			function(err) {
				if(err) { writeError(res,err); return; }
				writeSuccess(res);
			}
		);
	});
}

// removes video from given playlist, user needs to own playlist, for now
function removeVideo(req, res, next) {
	if(!req['user']) {
		writeError(res, "req['user'] doesn't exist"); return;
	}
	var userID = new ObjectID(req['user']);
	if(!userID) { writeError(res, "userID creation error"); return;}

	if(!req['query']) {
		writeError(res, "req['query'] doesn't exist!"); return;
	}
	var query = req['query'];

	if(!query['playlistID']) {
		writeError(res, "query['playlistID'] doesn't exist"); return;
	}
	var playlistID = new ObjectID(query['playlistID']);

	if(!query['locationID']) {
		writeError(res, "query['locationID'] doesn't exist"); return;
	}
	var locationID = query['locationID'];

	if(query['RID']) var RID = query['RID'];

	// doing it this way because permission to modify may extend to other users
	/* not checking owner until playlist is retrieved, so permission policy
	   may be modified easily
	*/
	playlists.findOne({'_id': playlistID}, function(err, playlistDoc) {
		if(err) { writeError(res, err); return; }
		if(!playlistDoc) {
			writeError(res, "playlist "+playlistID+" does not exist"); return;
		}

		if(playlistDoc['owner'].equals(userID) == false) {
			writeError(res, 
				"user "+userID+" not allowed to modify "+playlistID); return;
		}
		var videos = playlistDoc['videos'];
		// check for position of video in the playlist
		var pos = -1;
		for(var i = 0; i < videos.length; i++) {
			if(videos[i]['locationID'] == locationID) {
				if(videos[i]['RID']) {
					if(videos[i]['RID'] == RID) {
						pos = i;
					}
				} else {
					pos = i;
				}
			}
		}
		if(pos == -1) {
			writeError(res, "video is not in the playlist"); return;
		}

		// remove video from playlist
		videos.splice(pos, 1);
		playlists.update({'_id': playlistID}, {'$set': {'videos': videos}},
			function(err) {
				if(err) { writeError(res,err); return; }
				writeSuccess(res);
			}
		);
	});	
}

//update the streetcredit value
function scUpdate(req, res){
	if(req.body.streetCreditCur && req.body._id){
		var userID = new ObjectID(req['user']);
		var incnum = parseInt(req.body.streetCreditCur);
		usersCollection.update(
			{_id:userID},
			{'$inc': {'streetCredit': incnum}}, 
			function(err, user) {
				if(err) { 
					console.log(err + '\n scupdate');
					writeError(res,err);
				}
				else{
					writeSuccess(res);
				}
			}
		);
	}	
}

//get basic info about a user. confirm they exist.
function getInfo(req, res){
	if(req.user){
		var userID = new ObjectID(req['user']);
		usersCollection.findOne({_id:userID},function(err,user){
			if(err){
				writeError(res,'no such user!');
			}
			else if(user){
				res.writeHead(200, {'Content-Type': 'application/json'});
				var sc = user.streetCredit;
				if(!sc) sc = 0;
				var returned = {'success':true,'exists':true,'streetCredit':sc,
					lastLocation: user.lastLocation, lastRID:user.lastRID,
					noWelcome: user.noWelcome};
				res.end(JSON.stringify(returned));
			}
		});
	}
	else writeError(res,'no user!');
}

//set lastLocation for next time
function lastLocation(req,res){
	var postdata = req.query;
	if(!postdata.lastRID) postdata.lastRID = null;
	if(req.user){
		var userID = new ObjectID(req['user']);
		usersCollection.update(
			{'_id': userID},
			{'$set': postdata}, 
			function(err) {
				if(err) writeError(res,err.message);
				else writeSuccess(res);
			}
		);
	} else if(req.session){
		req.session.lastLocation = postdata.lastLocation;
		req.session.lastRID = postdata.lastRID;
		writeSuccess(res);
	}
	else writeError(res,'no session or user');
}

//function to either initialize or pull a user to/from the database
function createUser(fbData, callback, session) {
	usersCollection.findOne({'fbid':fbData.fbid}, function(err, user){
		if(err){
			console.log(err);
			callback("error finding user in database");
		}
		else if(user){
			callback(null,user._id)
		}
		else {
			//console.log('FBCREATE:\n\n' + JSON.stringify(fbData));
			fbData['streetCredit'] = 0;
			if(session){
				fbData.lastLocation = session.lastLocation;
				fbData.lastRID = session.lastRID;
			}
			usersCollection.insert(
				fbData, 
				{'safe': true}, 
				function(err, records) {
				    if(err) { console.log(err); callback("insertion error"); }
					//console.log('_id: '+records[0]._id);
					
					var favorites = {
						'name': "Favorites",
						'owner': records[0]['_id'],
						'videos': new Array(),
						'date': new Date()
					};
					playlists.insert(favorites, function(err, result) {
						if(err) { callback("insertion error playlists"); }

						// update with reference to favorites in user doc
						usersCollection.update(
							{'_id': records[0]['_id']},
							{'$set': {'favId': result[0]['_id']}}, 
							function(err, count) {
								if(err) { 
									callback("update error usersCollection");
								}
						
								callback(null,records[0]._id);
							}
						);
					});
				}
			);
		}
	});
}

//recommend the current video on wall
function fbRecommend(req, res){
	if(req.user && req.body){
		var userID = new ObjectID(req['user']);
		usersCollection.findOne({_id:userID},function(err,user){
			if(err){
				writeError(res,'no such user!');
			}
			else if(user){
				var postdata = {};
				var posturl = 'http://localhost:8888/l/'+req._id;
				if(req.RID) posturl += "/" + req.RID;
				if(req.type == 'artist') postdata['song'] = posturl;
				else postdata['video'] = posturl;
				//send request to facebook
				graph.setAccessToken(user.accessToken)
				.post("/me/samihost:recommend", postdata,function(err,data){
					if(err) console.log(err)
					else console.log(data)
				});
			}	
		});
	}
}

//disables welcome message
function noWelcome(req,res){
	var userID = new ObjectID(req['user']);
	usersCollection.update(
		{'_id': userID},
		{'$set': {noWelcome:true}}, 
		function(err) {
			if(err) writeError(res,err.message);
			else writeSuccess(res);
		}
	);
}
exports.noWelcome = noWelcome;
exports.lastLocation = lastLocation;
exports.fbRecommend = fbRecommend;
exports.scUpdate = scUpdate;
exports.getInfo = getInfo;
exports.addPlaylist = addPlaylist;
exports.removePlaylist = removePlaylist;
exports.renamePlaylist = renamePlaylist;
exports.getPlaylist = getPlaylist;
exports.getPlaylists = getPlaylists;
exports.addVideo = addVideo;
exports.removeVideo = removeVideo;
exports.createUser = createUser;