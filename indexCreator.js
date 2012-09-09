	var mongodb = require('mongodb');
	//var mongoserver = new mongodb.Server('10.112.0.110', 26374);
	var mongoserver = new mongodb.Server('localhost', 26374);
	var dbConnector = new mongodb.Db('uenergy', mongoserver);
	var locs, cities, bottom;

	require('fs').readFile(__dirname + '/files/html/indexhalf.html', function(error, content){
    	if(error){
		    console.log(error);
    	}
		else{
			bottom = content;
		}
	});
	
	dbConnector.open(function(err, DB){
	    if(err){
	      console.log('oh shit! connector.open error!');
	      console.log(err.message);
	    }
	    else{
	      db = DB;
	      db.createCollection('cities', function(err, city){
	      if(err){
	        console.log('oh shit! db.createCollection error!');
	        console.log(err);
	        return;
	      }
		  cities = city;
			locs = {};
			cities.find({}).each(function(err,doc){
				if(err)console.log('OH NO AN ERROR!!!'+err.message);
				else if(doc){
					db.createCollection(doc._id+'Locs',function(err,curloc){
						if(err)console.log('oh shit erroooorrr!!! '+ err.message);
						else
							locs[doc._id] = curloc;
					});
				}
				else
					console.log('index creatorized');
			});					
	});
	}
	});
			      
    function returnIndexL(url, res){
		var splitURL = url.split('/');
		locs['NYC'].findOne({'_id':splitURL[2]}, function(err,loc){
			if(err) console.log('error finding loc: ' + err);
			else if(loc){
				if(splitURL[3] && loc.list){
					for(var i = 0; i < loc.list.length; i++){
						if(loc.list[i].RID == splitURL[3]){
							returnPage(url, res, loc.title, loc.list[i].title,loc.type);
							return;
						}
					}
					returnPage(url, res, loc.title,null,loc.type);
				}
				else{
					returnPage(url, res, loc.title,null,loc.type);
				}
			}
			else console.log('nothing!');
		});
	}
	
	function returnIndexA(url,res){
		var splitURL = url.split('/');
		locs['NYC'].findOne({'alternate':splitURL[2]}, function(err,loc){
			if(err) console.log('error finding loc: ' + err);
			else{
				var newrl = 'http://localhost:8888/l/'+loc._id;
		    	res.writeHead(302, {'location':newrl});
				res.end();
			}
		});
	}
    
    function returnPage(url, res, locName, locSub,type){
		var title=''; //facebook title
		var ftype = 'video'; //facebook type
		if(locSub){ 
			title = locSub;
			if(type = 'artist'){
				title += ' by ';
				ftype = 'song';
			}
			else title+= ' at ';
		}
		title+=locName;
		
      var top = '<html> <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# rapcities: http://ogp.me/ns/fb/rapcities#">'
	  +'<meta property="fb:app_id" content="134659439991720" />'
	  +'<meta property="og:type"   content="rapcities:'+ftype+'" />'
	  +'<meta property="og:url"    content="http://localhost:8888'+url+'" />' 
	  +'<meta property="og:title"  content="'+title+ '" />' 
	  +'<meta property="og:description" content="Broadcasting Hip-Hop 24/7 from a virtual city of music and culture." />'
	  +'<meta property="og:image"  content="http://localhost:8888/fblogo.png" />'
	   +' <title>RapCities - '+title+'</title>';
      
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(top + bottom);
    }
        
exports.returnIndexL = returnIndexL;
exports.returnIndexA = returnIndexA;