var mongodb = require('mongodb'),
  //mongoserver = new mongodb.Server('10.112.0.110', 26374),
  mongoserver = new mongodb.Server('localhost', 26374),
  dbConnector = new mongodb.Db('uenergy', mongoserver);
var fs = require('fs');
var gridStore = mongodb.GridStore;
var shortID = require('shortid').seed(18).worker(8);
var locs, types, cities;
dbConnector.open(function(err, DB){
    if(err){
      console.log('oh shit! connector.open error!');
      console.log(err.message);
    }
    else{
      db = DB;
      console.log('opened successfully');
      db.createCollection('cities', function(err, city){
      if(err){
        console.log('oh shit! db.createCollection error!');
        console.log(err);
        return;
      }
	  cities = city;
		locs = {};
			db.createCollection('types', function(err, tipps){
				if(err){
					console.log('fuck, types didnt get made: \n'+err);
				}
				else{
					types = tipps;
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
							console.log(' locations + types created');
					});					
				}
			});	
});
}
});

function addCity(req, res){
	if(req.body && req.body._id){
		cities.insert(req.body,{safe:true},function(err,doc){
			if(err) returnError(res,'city insertion: '+err.message);
			else returnSuccess(res);
		});
	}
}
function getCities(req,res){
	cities.find({}).toArray(function(err,docs){
		if(err) returnError(res,'city retrieval: '+err.message);
		else returnSuccess(res,null,docs);
	});
}
function newType(req, res){
	//console.log(req.files.icon);
	var newtype = req.body;
	gridStore.exist(db, 'typeIcon/'+newtype._id, function(err, exists){
		if(exists){
			returnError(res,'Type with this ID already exists. Please choose a different abbreviation and make sure you aren\'t duplicating anything.');
		}
		else{
			if(newtype.list == 'solo')
				newtype.list = false;
			else newtype.list = true;
			var cur = 0; var fields = new Array();
			while(newtype[cur+'']){
				var now = {	'name':newtype[cur+'']	}
				if(newtype['r'+cur]=='yes')
					now['required']=true;
				else now['required'] = false;
				
				delete newtype[cur+''];
				delete newtype['r'+cur];
				fields.push(now);
				cur++;
			}
			if(cur!=0)
				newtype['fields'] = fields;
			newtype['mediaType'] = 'youtube';
			newtype.r = parseInt(newtype.r);
			newtype.g = parseInt(newtype.g);
			newtype.b = parseInt(newtype.b);
			var GS = new gridStore(db, 'typeIcon/'+newtype._id, 'w', {'content_type':req.files.icon.type});
			GS.open(function(err, gs){
				if(err){returnError(res, 'gs open failure: '+err.message)}
				else{
					gs.writeFile(req.files.icon.path, function(err, obj){
						if(err){returnError(res, 'gs write failure: '+err.message)}
						else{
							GS.close(function(err, result){
								if(err)returnError(res,'gs close error: '+ err.message);
								else{
								types.insert(newtype,{safe:true},function(err,doc){
									if(err)returnError(res,'type insertion failure\n'+err.message);
									else{
										console.log(doc);
										returnSuccess(res);
									}
								});
							}});
						}
					});
				}
			});
		}
	});	
}

function editType(req, res){
	//console.log(req.body);
	if(req.files && req.files.icon){
		//var grid = new Grid(dbConnector, 'fs');
		//grid.delete(req.body._id)
		var GS = new gridStore(db, 'typeIcon/'+req.body._id, 'w', {'content_type':req.files.icon.type});
		GS.open(function(err, gs){
			if(err){returnError(res, 'gs open failure: '+err.message)}
			else{
				gs.writeFile(req.files.icon.path, function(err, obj){
					if(err){returnError(res, 'gs write failure: '+err.message)}
					GS.close(function(err,result){
						if(err){returnError(res, 'gs close failure: ' + err.message);}
						else if(req.body.r) editTypeColor(req, res);
						else returnSuccess(res);
					});
				});
			}
		});
	}
	else if(req.body.r){
		console.log('bjsdlfkj');
		editTypeColor(req, res);
	}
	else returnError(res,'nothing to insert');

}

function editTypeColor(req, res){
	var r = parseInt(req.body.r);
	var g = parseInt(req.body.g);
	var b = parseInt(req.body.b);
	
	types.findAndModify({'_id':req.body._id},[['_id', 'asc']],{$set:{r:r,g:g,b:b}},{safe:true},function(err,doc){
		if(err)returnError(res,'type color modification failure\n'+err.message);
		else{
			returnSuccess(res);
		}
	});
}

function newLoc(req, res){
	var newloc = req.body;
	newloc['_id'] = shortID.generate();
	if(newloc['list']){ newloc['list'] = new Array(); newloc['listnum'] = 0;}
	else newloc['viewcount'] = 0;
	newloc.visible = false;
//	var newnewloc = JSON.parse(JSON.stringify(newloc));
//	console.log(newnewloc);
	locs[req.body.city].insert(newloc,{'safe':true},function(err,doc){
		if(err) returnError(res,'aww shit locinsertion error!\n\n'+err.message);
		else{
			console.log(doc[0]);
			returnSuccess(res,"The ID of the location you just added is: "+doc[0]['_id']+'\n\nYOU NEED THAT ID TO PLOT THE LOCATION!'
		+'\n\nIf you\'re gonna add more locations of the same type, you can just reset the fields and resubmit. anything else will require the menu up top');
		}
	});
}

function editLoc(req,res){
	if(req.body){
		var loc = req.body;
		locs[loc.city].findOne({_id:loc._id}, function(err,doc){
			if(err){returnError(res,'editing loc fail: '+err.message)}
			else{
				if(doc.x){loc.x = doc.x; loc.y = doc.y;}
				if(loc.visible == "visible") loc.visible = true;
				else loc.visible = false;
				if(loc.list){
					if(loc.listnum){
						var i; var list = new Array();
						for(i = 0; i < loc.listnum; i++){
							if(loc['title'+i]){
								var curlist = {
									title: loc['title'+i],
									ytid: loc['ytid'+i],
									RID: loc['RID'+i]
								}
								if(loc['streetcred'+i]){
									curlist['streetcred'] = loc['streetcred'+i];
									console.log('akdjf');
								}
								var j; var curid = curlist.RID; var found = false;
								for(j = 0; j < doc.listnum; j++){
									if(curid == doc.list[j].RID){
										curlist['viewcount'] = doc.list[j].viewcount;
										found = true;
										break;
									}
								}
								if(!found){
									curlist['viewcount'] = 0;
								}
								list.push(curlist);
							}
							delete loc['title'+i];
							delete loc['ytid'+i];
							delete loc['RID'+i];
							delete loc['streetcred'+i];
						}
						loc.list = list;
					}else{
						loc.listnum = doc.listnum;
						loc.list = doc.list;
					}
				}
				else{loc.viewcount = doc.viewcount}
				locs[loc.city].findAndModify({'_id':loc._id}, [['_id', 'asc']], loc,{safe:true}, function(err,newloc) {
	              if(err) {
	                console.log(err.message); returnError(res,'editloc insertion error: '+err.message);
	              }
					else{ returnSuccess(res);}
				});		
			}
		});
	}
}

function editLocation(req,res){
	if(req.query && req.query._id && req.query.x && req.query.y &&req.query.city){
		locs[req.query.city].findOne({_id:req.query._id},function(err,doc){
			if(err){returnError(res,'edit location findone error: '+err.message)}
			else{
				//doc.x = req.query.x; 
				//doc.y = req.query.y;
				locs[req.query.city].findAndModify({'_id':req.query._id}, [['_id', 'asc']], {$set : {
	                'x' : parseFloat(req.query.x), 'y': parseFloat(req.query.y)}},{safe:true}, function(err,newloc) {
	              if(err) {
	                console.log(err.message); returnError(res,'edit location insertion error: '+err.message);
	              }
					else{
						//console.log(newloc);
						returnSuccess(res, null, newloc);
					}
				});		
				
			}
		});
	}
}

function getTypeIconID(req,res){
	console.log(req.query);
	if(req.query && req.query._id && req.query.city){
		locs[req.query.city].findOne({_id:req.query._id},function(err,doc){
			if(err){returnError(res,'gettypeiconid findone error: '+err.message)}
			else if(!doc) returnError(res,'ID does not match anything in the database.');
			else{
				req.query._id = doc.type;
				getTypeIcon(req,res);
			}
		});
	}
}

function searchLoc(req,res){
	if(req.body){
		if(!req.body._id) delete req.body._id;
		else delete req.body.title;
		var city = req.body.city;
		delete req.body.city;
		
		// NEEDS FRONT END
		
		locs[city].find(req.body).toArray(function(err,docs){returnBrowse(err,docs,res)});
	}
}

function isEmptyCity(obj) {
	if(Object.keys(obj).length > 1)
  		return false;
	else return true;
}

function browseLoc(req,res){
	if(req.query.city && !isEmptyCity(req.query)){
		if(req.query.private)
			locs[req.query.city].find({'visible':false}).toArray(function(err,docs){returnBrowse(err,docs,res)});
		else if(req.query.public)
			locs[req.query.city].find({'visible':true}).toArray(function(err,docs){returnBrowse(err,docs,res)});
		else if(req.query.hasLoc)
			locs[req.query.city].find({'x':{$exists:true}}).toArray(function(err,docs){returnBrowse(err,docs,res)});
		else if(req.query.hasLoc && req.query.public)
			locs[req.query.city].find({'x':{$exists:true},'visible':true}).toArray(function(err,docs){returnBrowse(err,docs,res)});
	}
	else if(req.query.city){
		locs[req.query.city].find({}).toArray(function(err,docs){if(err)console.log(err);returnBrowse(err,docs,res)});
	}
}

function returnBrowse(err,docs,res){
	if(err) returnError(res,'Error getting locations: '+err.message)
	else {
		var returnable = {'locs':docs}
		res.writeHead(200, {'Content-Type':'application/json'});
		res.end(JSON.stringify(returnable));
	}
}

function getTypes(req, res){
	types.find({}).toArray(function(err,lestypes){
		if(err) returnError(res,'Error getting types: '+err.message)
		else {
			var returnable = {'types':lestypes}
			res.writeHead(200, {'Content-Type':'application/json'});
			res.end(JSON.stringify(returnable));
		}
	});
}

function getTypeIcon(req,res){
	if(req.query && req.query._id){
		var GS = new gridStore(db, 'typeIcon/'+req.query._id, 'r');
		GS.open(function(err, gs){
			if(err) returnError(res, 'Error opening gs: '+err.message)
			else{
				gs.read(function(err,icon){
					if(err) returnError(res, 'Error reading icon: '+err.message)
					else{
						res.writeHead(200, {'Content-Type':gs.contentType});
						res.end(icon);
					}
				});
			}
		});
	}
	else returnError(res, 'query issue');
}

function view(req,res){
	if(req.query && req.query._id && req.query.city){
		if(req.query.position){
			var listkey = {}
			listkey['list.'+req.query.position+'.viewcount'] =1;
			locs[req.query.city].update({'_id':req.query._id},{$inc: listkey});
		}
		else
			locs[req.query.city].update({_id:req.query._id},{$inc: {'viewcount':1}});
	}
	res.end();
}

function showType(req,res){
	console.log('yeeeaaah');
	res.writeHead(200, {'Content-Type': 'image/jpeg'});
	fs.readFile(__dirname + 'testtime.jpg', function(err,data){
		if(err)
			console.log('oh no!');
		else
			res.end(data);
	})
}

function returnSuccess(response, message, object){
	response.writeHead(200, {'Content-Type': 'application/json'});
	var returned = {'success':true}
	if(message)
		returned['message'] = message;
	if(object)
		returned['object'] = object;
	response.end(JSON.stringify(returned));
}

function returnError(response, message){
	console.log("\n\n\nERRROOOOORRR!!!  "+message+"\n\n\n");
	response.writeHead(200, {'Content-Type': 'application/json'});
	var returned = {'success':false,'message':message+"\n\n(Please email Sami ASAP about this if you don't know how to fix the mistake)"};
	response.end(JSON.stringify(returned));
}
function uploadEvent(response, query){
	query.sponsor = query.sponsor.toLowerCase();
	events.insert(query, {safe:true}, function(err,doc){
		if(err){console.log('ruh-h! event upload failed!'); console.log(err); }
		else{
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.end(JSON.stringify(doc[0]));
		}
	});
}

function getEvents(response, query){
	var sponsor = query.sponsor.toLowerCase();
	var query = {}
	if(sponsor != "all")
		query['sponsor'] = sponsor;
	events.find(query).toArray(function(err, results){
        if(!err){
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify(results));
        }
    });
}

/*function getLocs(response, query){
   /* if(query.minX){
        var minX = parseFloat(query.minX);
        var minY = parseFloat(query.minY);
        var maxX = parseFloat(query.maxX);
        var maxY = parseFloat(query.maxY);
        var maxL = Math.min(maxX-minX,maxY-minY)/6.0;
        sort = query.sort;
        if(minX < 0 || maxX > 1 || minY < 0 || maxY > 1){
                console.log('getSongs attempt with inappropriate bounds');
                return;
              }
			  
          var results = new Array();
          var mnx, mxx, mxy, mny; //current min and max x and ys
          var px, py; //current x/y pos
          var count = 36;
          for(var i = 0; i<6; i++){
            if(i == 0)
              mnx = minX;
            else
              mnx = mxx;
            mxx = lerp(minX, maxX, (i+1)/6);
            for(var j = 0; j<6; j++){
              if(j == 0)
                mny = minY;
              else
                mny = mxy;
              mxy = lerp(minY, maxY, (j+1)/6);
              
              var pos = {}
              if(!sort){// && maxL > 0.025){
                //console.log('mnx '+mnx+' mxx '+mxx+' mny '+mny+' mxy '+mxy);
                px = map(parseFloat(Math.random()),0,1,mnx,mxx);
                py = map(parseFloat(Math.random()),0,1,mny,mxy);
                //console.log('px: ' + px + '  py: '+py+'\n');
                pos['$near'] = [px,py]; 
                pos['$maxDistance'] = maxL;//0.02;
              }
                //console.log(JSON.stringify(pos));
              else{
                var within = {}
                within['$box'] = [[mnx,mny],[mxx,mxy]];
                pos['$within'] = within;
              }
              
              var doc = {'pos':pos};
              if(sort==1){locs.find(doc, {'sort':[['hottness','desc']],'limit':1},postFind);}
              else if(sort==2){locs.find(doc, {'sort':[['hottness','asc']],'limit':1},postFind);}
              else{locs.findOne(doc, postFind);}
              
function postFind(err, returned){
  if(err){
    console.log('oh shit! error using geo.find!');
    console.log(err.message);
      count--;
      if(count == 0)
        sendData(results, response);
    }
    else if(sort){returned.nextObject(songFunc);}
    else{songFunc(err,returned);}
    
}

function songFunc(err, artist){
  if(err){
    console.log('oh shit! error using returned.nextObject!');
    console.log(err);
    count--;
    if(count == 0)
      sendData(results, response);
  }
    else if(artist != null){
        results.push(artist);
        count--;
        if(count == 0){
          sendData(results, response);
        }
  }
  else{
    count--;
    if(count == 0){
      sendData(results, response);
    }
  }
}             
              
              
            }
          }

function sendData(results, response){
  var data = {}
  data['results'] = results;
  response.writeHead(200, {'Content-Type': 'application/json'});
  response.end(JSON.stringify(results));
}

function map(num, minold, maxold, minnew, maxnew){
  return ((num-minold)/(maxold - minold))*(maxnew - minnew) + minnew;
}

function lerp(min, max, i){
  return min+((max-min)*i);
}

    }//UP TO HERE BO HAN
    if(query.all){
	 	locs[req.query.city].find(/*,{'_id':true,'topTracks':true,'7id':true,'x':true,'y':true}).toArray(function(err, results){
            if(!err){
                //var data = {}
                //data['results'] = results;
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(results));
            }
        });
    }//if no query variables
    else{
	    locs[req.query.city].find({'visible':true},{'_id':true,'topTracks':true,'7id':true,'x':true,'y':true}).toArray(function(err, results){
            if(!err){
                //var data = {}
                //data['results'] = results;
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(results));
            }
        });
    }
}*/

exports.newType = newType;
exports.getTypes = getTypes;
exports.getTypeIcon = getTypeIcon;
exports.getTypeIconID = getTypeIconID;
exports.newLoc = newLoc;
exports.searchLoc = searchLoc;
exports.browseLoc = browseLoc;
exports.editLoc = editLoc;
exports.editLocation = editLocation;
exports.view = view;
exports.editType = editType;
exports.addCity = addCity;
exports.getCities = getCities;