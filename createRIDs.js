	var mongodb = require('mongodb');
	var mongoserver = new mongodb.Server('10.112.0.110', 26374);
	//var mongoserver = new mongodb.Server('localhost', 26374);
	var dbConnector = new mongodb.Db('uenergy', mongoserver);

// USAGE node removeYouTubeURL STRING artist INT postionInTopTracks INT newPositionInTopTracks

	dbConnector.open(function(err, db) {
	  if(err) {
	    console.log(err.message);
	  } else {
		db.collection('artistLocations2', function(err,col){
			if (err){
				console.log(err);
			}
			else{
				var cursor = col.find({'RID':{'$exists':false}});
				cursor.count(function(err,count){
					if(err) console.log('count error');
				console.log(count + ' artists');
				cursor.each(function(err,artist){
					if(err) console.log(err)
					else if(artist != null){
						var top = artist.topTracks;
						var i; var flag = false;
						for(i = 0; i < top.length; i++){
							if(top[i].RID == null){
								top[i]['RID'] = top[i].video_id;
								flag = true;
							}
						}
						var settingness = {}
						if(flag)
							settingness['topTracks'] = top;
						if(artist.RID == null){
							settingness['RID'] = artist.echoID;
							flag = true;
						}
						if(flag){
						col.findAndModify({'echoID' : artist.echoID}, [['_id', 'asc']], {
			              $set : settingness},{safe:true}, function(err) {
			              if(err) {
			                console.log(err.message);
			              }
							else{ console.log(artist.name + ' = success'); count--; if(count == 0) process.exit();}
						});}
					}
				});});
			}
		});
	}
});

