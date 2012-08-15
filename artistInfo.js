var http = require('http');
var mongodb = require('mongodb');
//var mongoserver = new mongodb.Server('10.112.0.110', 26374);
var mongoserver = new mongodb.Server('localhost', 26374);
var dbConnector = new mongodb.Db('uenergy', mongoserver);
var artists;
  
  dbConnector.open(function(err, db) {
    db.collection('artists', function(err, collection) {
      if(err) {
        console.log(err);
      } else {
	    artists = collection;
	}
});
});

	function get(res, query){
        artists.findOne({_id: query.id}, function(err, object) {
          if(err) {
            console.log('Error finding artist: ' + err);
          }
          else {
			 res.writeHead(200, {
		          'Content-Type' : 'application/json'
		        });
            res.end(JSON.stringify(object));
          }
        });
      }

	function getBio(res, query){
		artists.findOne({_id: query.id}, {"biographies":true},function(err, object){
			if(err){
				console.log("error: "+err);
			}
			else{
				for(var i = 0; i < object.biographies.length; i++){
					if(object.biographies[i].site == 'wikipedia'){
						res.writeHead(200, {
					          'Content-Type' : 'application/json'
					        });
						var bio = { 'text': object.biographies[i].text,
									'url':object.biographies[i].url}
			            res.end(JSON.stringify(bio));
					}
				}
			}
		});
	}
exports.get = get;
exports.getBio = getBio;