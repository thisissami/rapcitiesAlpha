/*
	playlist item needs
	1) date+time added (definite), using javascript Date()
	2) _id (definite)
	3) locTitle (definite)
	4) RID (if _id refers to a list)
	5) itemTitle (possible)

	playlists is hashmap
	playlist is array
	video is object with those attributes
*/

var mongodb = require('mongodb'),
  ObjectID = mongodb.ObjectID,
  //mongoserver = new mongodb.Server('10.112.0.110', 26374),
  mongoserver = new mongodb.Server('localhost', 26374),
  dbConnector = new mongodb.Db('uenergy', mongoserver),
  artists, usersCollection;

dbConnector.open(function(err, db){
  if(err) {
    console.log('connector.open error (login.js)');
    console.log(err.message);
  } else {
    console.log('DB opened successfully (login.js)');
    db.createCollection('artistLocations2', function(err, collection) {
      if(err) {
        console.log('error creating songs collection (login.js)');
        console.log(err.message);
      } else {
        artists = collection;
      }
    });
    db.createCollection('users', function(err, collection) {
      if(err) {
        console.log('error creating users collection (login.js)');
        console.log(err.message);
      } else {
        collection.ensureIndex({fbid:1}, function(err) {
          if(err) console.log(err);
        });
        usersCollection = collection;
      }
    });
  }
});

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
  writeHeader(res, "json");
  if(value != null)
    res.end('{"response": "success", "value": ' + value + '}');
  else
    res.end('{"response": "success"}');
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
function createPlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;	
	}
	var userID = new ObjectID(req['user']);
	if(userID == null) { writeError(res, "no userID"); return;}
	
	var query = getQueries(req);

	if(!query['playlistName']) {
		writeError(res, "no playlistName given"); return;
	}
	var playlistName = query['playlistName'];

	// find the document associated with $userID
	usersCollection.findOne({'_id': userID}, function(err, document) {
		if(err) { console.log(err); writeError(res); return; }
		if(document == null)
		{
			writeError(res, "User " + userID + " not found"); return;
		}
		
		if(!document['playlists']) {
			writeError(res, "no playlists in document"); return;		
		}
		var playlists = document['playlists'];
		
		// if playlist $playlistName already exists, return an error
		// else create a new playlist $playlistName in $playlists
		if(!playlists[playlistName]) {
			writeError(res, "playlist " + playlistName + " already exists");
		} else {
			playlists[playlistName] = new Array();
		}

		// update $usersCollection with new document associated with $userID
		usersCollection.update(
			{'_id': userID}, 
			{'$set': {'playlists': playlists}}, 
			function(err, count) {
				if(err) { console.log(err); writeError(res); return; }
				writeSuccess(res);
			}
		);
	});
}

// renames a playlist for a given user
function renamePlaylist(req, res, next) {
	if(!req['user']) {
		writeError(res, "no user given"); return;
	}

	var userID = new ObjectID(req['user']);
	if(userID == null) { writeError(res, "userID null"); return; }
	
	var query = getQueries(req);
	
	if(!query['oldPlaylistName']) {
		writeError(res, "oldPlaylistName nonexistent"); return;	
	}
	var oldPlaylistName = query['oldPlaylistName'];
	
	if(oldPlaylistName == "Favorites") {
		writeError(res, "cannot rename Favorites playlist"); return;	
	}
	
	if(!query['newPlaylistName']) {
		writeError(res, "newPlaylistName nonexistent"); return;	
	}
	var newPlaylistName = query['newPlaylistName'];
	
	if(newPlaylistName == "Favorites") {
		writeError(res, "cannot rename a playlist to Favorites"); return;	
	}

	// find the document associated with $userID
	usersCollection.findOne({'_id': userID}, function(err, document) {
		if(err) { console.log(err); writeError(res); return; }
		if(document == null)
		{
			writeError(res, "User " + userID + " not found"); return;
		}

		if(!document['playlists']) {
			writeError(res, "no playlists in document"); return;		
		}		
		var playlists = document['playlists'];
		
		// if playlist $oldPlaylistName doesn't exist, return an error
		// else rename the playlist
		if(!playlists[oldPlaylistName]) {
			writeError(res, "playlist " + oldPlaylistName + " nonexistent");
		} else {
			playlists[newPlaylistName] = playlists[oldPlaylistName];
			delete playlists[oldPlaylistName];
		}

		// update $usersCollection with new document associated with $userID
		usersCollection.update(
			{'_id': userID}, 
			{'$set': {'playlists': playlists}}, 
			function(err, count) {
				if(err) { console.log(err); writeError(res); return; }
				writeSuccess(res);
			}
		);
	});
}

function addSong(req, res, next) {
  var query = getQueries(req);
  
  var userid = new ObjectID(req.user);
  var songid = query.songid;
  if(!songid) {
    writeError(res, "no userid or songid");
  } else {
    usersCollection.findOne({'_id': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        var favs = document.favs;
        var dates = document.dates;
        if(favs.indexOf(songid) != -1) {
          writeError(res, "Already fav'd");
        } else {
          favs.push(songid);
          dates.push(new Date());
        }
        usersCollection.update({'_id': userid}, {'$set': {'favs': favs, 'dates': dates}}, function(err, count) {
          if(err) {
            console.log(err);
            writeError(res);
            return;
          }
          writeSuccess(res);
        });
      } else {
        writeError(res, "No such user");
        return;
      }
    });
    /*
    songsCollection.findOne({'_id': songid, 'likers': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        songsCollection.update({'_id': songid}, {'$pull': {'likers': userid}},
          {'safe': true}, function(err, count) {
            if(count == 1) writeSuccess(res, "liker removed from song");
            else writeError(res, "count was " + count);
          });
      } else {
        songsCollection.update({'_id': songid}, {'$push': {'likers': userid}},
          {'safe': true}, function(err, count) {
            if(count == 1) writeSuccess(res, "liker added to song");
            else writeError(res, "count was " + count);
          });
      }
    });*/
  }
}

function removeSong(req, res, next) {
  var query = getQueries(req);
  
  var userid = new ObjectID(req.user);
  var songid = query.songid;
  if(!songid) {
    writeError(res, "no songid");
  } else {
    usersCollection.findOne({'_id': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        var favs = document.favs;
        var dates = document.dates;
        var favIndex = favs.indexOf(songid);
        if(favIndex == -1) {
          writeError(res, "No such fav!");
        } else {
          favs.splice(favIndex, 1);
          dates.splice(favIndex, 1);
          usersCollection.update({'_id': userid}, {'$set': {'favs': favs, 'dates': dates}}, function(err, count) {
            if(err) {
              console.log(err);
              writeError(res);
              return;
            }
            writeSuccess(res);
          });
        }
      } else {
        writeError(res, "No such user");
        return;
      }
    });
  }
}

function isFav(req, res, next) {
  var query = getQueries(req);
  
  var userid = new ObjectID(req.user);
  var songid = query.songid;
  if(!songid) {
    writeError(res, "no userid or songid");
  } else {
    usersCollection.findOne({'_id': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        if(document.favs.indexOf(songid) != -1) {
          writeSuccess(res, 'true');
        } else {
          writeSuccess(res, 'false');
        }
      } else {
        writeError(res, 'No such user');
      }
    });
  }
}

function seeSongs(req, res, next) {
  var userid = new ObjectID(req.user);
 /* var query = getQueries(req);
  var page = query.page;
  if(!page) page = 1;
  var sortBy = query.sortBy;
  if(!sortBy) sortBy = 'title';
  var order = query.order;
  if(!order) order = 'asc';*/
  var page = 1;
  var sortBy = 'title';
  var order = 'asc';

    usersCollection.findOne({'_id': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        var documents = [], index = 0, favs = document.favs, dates = document.dates;
console.log(favs);
        // Tail-recursive loop to get past asynchronous querying:
        var loopThrough = function() {
          if(index < favs.length) {
            fullid = favs[index].split(' ');
            artists.findOne({'RID': fullid[0]}, function(err, document) {
              if(document) {
                var i, pos; 
                for(i = 0; i < document.topTracks.length; i++){
                  if(document.topTracks[i].RID == fullid[1]){
                    pos = true;
                    break;
                  }
                }
                if(pos)
                  documents.push({'artist':document.name,'song':document.topTracks[i].title,'date':dates[index],'fullid':favs[index]});
                ++index;
                loopThrough();
              }
            });
          } else {
            console.log("breaking out...found " + index);
            // Breakout point of recursive loop
            writeHeader(res, "html");
            // do sorting options
            var titleString = '\'song\'';
            var artistString = '\'artist\'';
            //var genreString = '\'song.genre\'';
            var dateString = '\'date\'';
            var titleArrow = '';
            var artistArrow = '';
            //var genreArrow = '';
            var dateArrow = '';
            if(sortBy == 'title') {
              if(order == 'asc') {
                titleString += ', \'desc\'';
                titleArrow = ' &#x25B2;';
              } else {
                titleString += ', \'asc\'';
                titleArrow = ' &#x25BC;';
              }
            } else if(sortBy == 'artist') {
              if(order == 'asc') {
                artistString += ', \'desc\'';
                artistArrow = ' &#x25B2;';
              } else {
                artistString += ', \'asc\'';
                artistArrow = ' &#x25BC;';
              }
            } /*else if(sortBy == 'song.genre') {
              if(order == 'asc') {
                genreString += ', \'desc\'';
                genreArrow = ' &#x25B2;';
              } else {
                genreString += ', \'asc\'';
                genreArrow = ' &#x25BC;';
              }
            }*/ else if(sortBy == 'date') {
              if(order == 'asc') {
                dateString += ', \'desc\'';
                dateArrow = ' &#x25B2;';
              } else {
                dateString += ', \'asc\'';
                dateArrow = ' &#x25BC;';
              }
            }
            res.write('<table id="userFavs"><thead><tr><td></td>' +
              '<td><a href="javascript:void(0)" onclick="showAndFillOverlay(' + titleString + ')">Title' + titleArrow + '</a></td>' +
              '<td><a href="javascript:void(0)" onclick="showAndFillOverlay(' + artistString + ')">Artist' + artistArrow + '</a></td>' +
              //'<td><a href="javascript:void(0)" onclick="showAndFillOverlay(' + genreString + ')">Genre' + genreArrow + '</a></td>' +
              '<td><a href="javascript:void(0)" onclick="showAndFillOverlay(' + dateString + ')">Date' + dateArrow + '</a></td>' +
              '</tr></thead><tbody>');
            
            documents.sort(function(a, b) {
              var out;
              switch(sortBy) {
              case 'title':
              default:
                out = ((a.title == b.title) ? 0 : ((a.title > b.title) ? 1 : -1));
                break;
              case 'artist':
                out = ((a.artist == b.artist) ? 0 : ((a.title > b.artist) ? 1 : -1));
                break;
              /*case 'song.genre':
                out = ((a.song.genre == b.song.genre) ? 0 : ((a.song.title > b.song.genre) ? 1 : -1));
                break;*/
              case 'date':
                out = ((a.date == b.date) ? 0 : ((a.date > b.date) ? 1 : -1));
                break;
              }
              if(order == 'asc') return out;
              return out * -1;
            });
            var d,j;
            for(j=0; j<documents.length; j++) {
              var d = documents[j];
              res.write('<tr><td><a href="javascript:void(0)" onclick="toggleFav(this, \'' + d.fullid + '\')"><img src="http://localhost:8888/heart.svg" width="20" height="20" border="0" /></a></td>');
              res.write('<td><a href="javascript:void(0)" onclick="playSong(0,\''+d.fullid+'\')">' + d.song + '</a></td>');
              res.write('<td><a href="javascript:void(0)" onclick="playSong(1,\''+d.fullid+'\')">' + d.artist + '</a></td>');
              //res.write('<td>' + d.song.genre + '</td>');
              res.write('<td>' + (d.date.getMonth()+1) + '/' + d.date.getDate() + '/' + d.date.getFullYear() + '</td>');
              res.write('</tr>');
            }
            res.end('</tbody></table>');
          }
        };
        loopThrough();
      } else {
        writeError(res, "No such user");
      }
    });
}

function countSongs(req, res, next) {
  var userid = new ObjectID(req.user);

    usersCollection.findOne({'_id': userid}, function(err, document) {
      if(err) {
        console.log(err);
        writeError(res);
        return;
      }
      if(document) {
        writeSuccess(res, document.favs.length);
      } else {
        writeError(res, "No such user!");
      }
    });
}

function fbCreate(fbData, callback) {
	usersCollection.findOne({'fbid':fbData.fbid}, function(err, user){
		if(err){
			console.log(err);
			callback("error finding user in database");
		}
		else if(user){
			callback(null,user._id)
		}
		else {
			console.log('FBCREATE:\n\n' + JSON.stringify(fbData));
			
			//fbData['favs'] = []; fbData['dates'] = [];
			// create a new associative array in fbData that stores the playlists
			fbData['playlists'] = new Object();
			// create a default Favorites playlist
			fbData['playlists']['Favorites'] = new Array();
			usersCollection.insert(fbData, {'safe': true}, function(err, records) {
		        if(err) { console.log(err); callback("insertion error"); }
				console.log('_id: '+records[0]._id);
				callback(null,records[0]._id);
		    });
		}
	});
}

exports.createPlaylist = createPlaylist;
exports.addSong = addSong;
exports.removeSong = removeSong;
exports.seeSongs = seeSongs;
exports.countSongs = countSongs;
exports.isFav = isFav;
exports.fbCreate = fbCreate;
