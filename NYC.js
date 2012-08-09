	var mongodb = require('mongodb');
	var mongoserver = new mongodb.Server('10.112.0.110', 26374);
	//var mongoserver = new mongodb.Server('localhost', 26374);
	var dbConnector = new mongodb.Db('uenergy', mongoserver);
	var shortID = require('shortid').seed(18).worker(8);

// USAGE node port STRING artist/culture STRING example_id
var locs;
	dbConnector.open(function(err, db) {
	  if(err) {
	    console.log(err.message);
	  } else {
		db.collection('NYCLocs', function(err,col){
			if (err){
				console.log(err);
			}
			else{
				locs = col;
				var cursor = locs.find({});
				cursor.count(function(err,numba){
					if(err)console.log(err);
					else{
					total = numba;

				count = 0;
				cursor.each(function(err,doc){
					if(err) console.log(err)
					else if(doc){
						console.log('success - location:  ' + doc.title);
						locs.findAndModify({'_id':doc._id}, [['_id', 'asc']], {$set:{city:'NYC'}},{safe:true}, function(err,newloc){
							if(err) console.log(err);
							else{
								console.log(++count+' tot: '+total); if(count == total){
									console.log('all inserted!');
									process.exit();
								}
							}
						});
					}
					else{
						console.log('seem to have gotten through everything...');
					}
				});
			}
		});
	}});
	}
});