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
						if(err) { writeError(err); return; }
					
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

		// contains _id of the favId
		// contains Array of names and _ids of playlists
		var favAndPlaylists = new Object();
		if(!userDoc['favId']) {
			writeError(res, "favId field under user doc nonexistent"); return;	
		}
		favAndPlaylists['favId'] = userDoc['favId'];

		if(userDoc['playlists'])
			favAndPlaylists['playlists'] = userDoc['playlists'];
		writeSuccess(res, favAndPlaylists);
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
		if(!playlist) {
			writeError(res, "playlist "+playlistID+" doesn't exist in system"); 
			return;
		}
		// if html specified, return html
		// return json otherwise		
		if(query['type'] == 'html') {
			var videos = playlist['videos'];
			var sortBy = 'locTitle'; var order = 'asc';

			// this could probably be simplified, especially the switch
			writeHeader(res, "html");
			var locTitleString = '\'location\'';
			var itemTitleString = '\'item\'';
			var dateString = '\'date\'';
			var locTitleArrow = ''; var itemTitleArrow = ''; var dateArrow = '';
			switch(sortBy) {
				case 'locTitle':
					if(order == 'asc') { 
						locTitleString += ', \'desc\'';
						locTitleArrow += ' &#x25B2;'; 
					} else {
						locTitleString += ', \'asc\'';
						locTitleArrow += ' &#x25B2;'; 
					}
					break;
				case 'itemTitle':
					if(order == 'asc') { 
						itemTitleString += ', \'desc\'';
						itemTitleArrow += ' &#x25B2;'; 
					} else {
						itemTitleString += ', \'asc\'';
						itemTitleArrow += ' &#x25B2;'; 
					}
					break;
				case 'date':
					if(order == 'asc') { 
						dateString += ', \'desc\'';
						dateArrow += ' &#x25B2;'; 
					} else {
						dateString += ', \'asc\'';
						dateArrow += ' &#x25B2;'; 
					}
					break
			}
			var outHtml = '<table id="userFavs"><thead><tr><td></td>' +
				'<td>'+
					'<a href="javascript:void(0)" onclick="showAndFillOverlay('+
					locTitleString+')">Location Title'+locTitleArrow+'</a>'+
				'</td>'+
				'<td>'+
					'<a href="javascript:void(0)" onclick="showAndFillOverlay('+
					itemTitleString+')">Item Title'+itemTitleArrow+'</a>'+
				'</td>'+
				'<td>'+
					'<a href="javascript:void(0)" onclick="showAndFillOverlay('+
					dateString+')">Date'+dateArrow+'</a>'+
				'</td>'+
				'</tr></thead><tbody>';
			videos.sort(function(a, b) {
				var out;
				var compareA; var compareB;
				switch(sortBy) {
					case 'locTitle':
					default:
						compareA = a.locTitle; compareB = b.locTitle;
						break;
					case 'itemTitle':
						compareA = a.itemTitle; compareB = b.itemTitle;
						break;
					case 'date':
						compareA = a.date; compareB = b.date;
						break;
				}
				if(compareA > compareB) out = 1;
				else if(compareA < compareB) out = -1;
				else out = 0;

				if(order == 'asc') return out;
				else return out * -1;
			});
			for(var i = 0; i < videos.length; i++) {
				var video = videos[i];
				outHtml += '<tr><td><a href="javascript:void(0)" onclick="toggleFav(this, \''+video['locationID']+'\',\''+video['RID']+'\',\''+playlistID+'\')"><img src="http://localhost:8888/heart.svg" width="20" height="20" border="0" /></a></td>';
				outHtml += '<td><a href="javascript:void(0)" onclick="playVideo(\''+video['locationID']+'\',\''+video['RID']+'\')">' + video['locTitle'] + '</a></td>';
				outHtml += '<td><a href="javascript:void(0)" onclick="playVideo(\''+video['locationID']+'\',\''+video['RID']+'\')">' + video['itemTitle'] + '</a></td>';
				outHtml += '<td>' + (video['date'].getMonth()+1) + '/' + video['date'].getDate() + '/' + video['date'].getFullYear() + '</td>');
				outHtml += '</tr>';	
			}
			outHtml += '</tbody></table>';
			console.log(outHtml);
			return;
		}
		writeSuccess(res, playlist);
	});
}

// adds a video to a given playlist, user needs to own the playlist, for now
function addVideo(req, res, next) {
	console.log("SUCCESS!!!!!");
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
			writeError("playlist "+playlistID+" does not exist"); return;
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
				if(err) { writeError(err); return; }
				writeSuccess(res);
			}
		);
	});
}

// removes a video to a given playlist, user needs to own the playlist, for now
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
				if(err) { writeError(err); return; }
				writeSuccess(res);
			}
		);
	});	
}

function run() {
	var req = new Object();
	req['user'] = "50329ad3ac6815bf24000001";
	req['query'] = new Object();
	req['query']['playlistID'] = "503d4e1c91b354bf07000001";
	req['query']['playlistName'] = 'melbourne';
	req['query']['newPlaylistName'] = 'kharkov';
	req['query']['locationID'] = '2';
	req['query']['locTitle'] = "Two";
	req['query']['RID'] = '1';
	req['query']['itemTitle'] = 'One';
	req['query']['type'] = 'html';
	//addPlaylist(req);
	//removePlaylist(req);
	//renamePlaylist(req);
	//usersCollection.update({'name': 'Bo Ning Han'}, {'$set': {'favId': new ObjectID("503aaebcb631338a45000001")}});
	//getPlaylists(req);
	//getPlaylist(req);
	addVideo(req);
	//removeVideo(req);
}

