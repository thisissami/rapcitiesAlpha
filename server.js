var cluster = require('cluster'),
    numCPUs = require('os').cpus().length;

    
if(cluster.isMaster){
  console.log(numCPUs + ' cores on this machine.');
  for(var i = 0; i < numCPUs; i++)
    cluster.fork();
    
  cluster.on('exit', function(worker){
    console.log('worker ' + worker.process.pid + ' died.');
    cluster.fork();
  });
  process.on("SIGTERM", process.exit);
  process.on("SIGINT", process.exit);
  process.on("SIGKILL", process.exit);
  /*process.on("SIGTERM", websiteDown);
  process.on('exit',websiteDown);
  process.on('SIGINT', websiteDown);*/
}
else{
  connect = require('connect'),
  url = require('url'),
  path = require('path'),
  fs = require('fs');
  //artistInfo = require('./artistInfo');
  locations = require('./locs');
  users = require('./user');
  http = require('http');
  passport = require('passport');
  fpass = require('passport-facebook').Strategy;
  redistore = require('connect-redis')(connect);
  qs = require('querystring');
  indexor = require('./indexCreator');

passport.serializeUser(function(userid,done){
	done(null, userid);
});
passport.deserializeUser(function(userid,done){
	done(null,userid);
});

passport.use(new fpass({
		clientID:'300271166724919',
		clientSecret:'b4ba0065d5002941b871610d00afd80b',
		//clientID:'134659439991720', //rapcities proper
		//clientSecret:'43c2b1a5bc972868418383d74a51bfa4', // DON'T FORGET TO SWITCH LOCALHOST HERE
		callbackURL:'http://localhost:8888/auth/facebook/callback',
		passReqToCallback: true
	},
	function(req, accessToken, refreshToken, fbUserData, done){
		var toUpload = {
			'name':fbUserData._json.name,
			'birthday':fbUserData._json.birthday,
			'location':fbUserData._json.location,
			'email':fbUserData._json.email,
			'gender':fbUserData._json.gender,
			'fbid':fbUserData._json.id,
			'accessToken':accessToken
		}
		users.createUser(toUpload, function (err, id) {
		      if (err) { return done(err); }
		      done(null, id);
		}, req.session);
	}
));
	function returnNone(res){
		res.writeHead(404);
		res.end();
	}
	function userRouter(req,res,next){
		var arr = req.url.split('?')[0];
	    switch(arr){
			case '/user/noWelcome': users.noWelcome(req,res); break;
		  	case '/user/addPlaylist': users.addPlaylist(req, res); break;
			case '/user/removePlaylist': users.removePlaylist(req, res); break;
			case '/user/renamePlaylist': users.renamePlaylist(req, res); break;
			case '/user/getPlaylist': users.getPlaylist(req, res); break;
			case '/user/getPlaylists': users.getPlaylists(req, res); break;
			case '/user/addVideo': users.addVideo(req, res); break;
			case '/user/removeVideo': users.removeVideo(req, res); break;
			case '/user/scUpdate': users.scUpdate(req,res); break;
			case '/user/fbRecommend': users.fbRecommend(req,res); break;
			default: 
				if(authorized(req.user))
					next();
				else
					returnNone(res);
		}
	}
	
	function authRouter(req,res,next){
		var arr = req.url.split('?')[0];
	    switch(arr){
	    	case '/loc/newtype': locations.newType(req,res); break;
			case '/loc/getTypeIconID': locations.getTypeIconID(req,res); break;
			case '/loc/newloc': locations.newLoc(req,res); break;
			case '/loc/deleteLoc': locations.deleteLoc(req,res); break;
			case '/loc/search': locations.searchLoc(req,res); break;
			case '/loc/editLoc': locations.editLoc(req,res); break;
			case '/loc/editLocation': locations.editLocation(req,res); break;
			case '/loc/edittype': locations.editType(req,res); break;
			case '/loc/addCity': locations.addCity(req,res); break;
			case '/loc/createAnalogue': locations.createAnalogue(req,res); break;
			default: returnNone(res);
		}
	}
	
  function router(req, res, next) {
    var arr = req.url.split('?')[0];

    switch(arr){
		case '/user/getInfo': users.getInfo(req,res); break;
		case '/user/lastLocation': users.lastLocation(req,res); break;
		case '/loc/getTypes': locations.getTypes(req,res); break;
		case '/loc/getTypeIcon': locations.getTypeIcon(req,res); break;
		case '/loc/browse': locations.browseLoc(req,res); break;
		case '/loc/view': locations.view(req,res); break;
		case '/loc/getCities': locations.getCities(req,res); break;
		default: 
			if(req.user)
				next();
			else
				returnNone(res);
    }
  }

function authorized(req){
	if(req == '504bc0819ce06e4c02000002' || req == '4fe77c671588a57e47000001' || req == '4fe42f6ecef89ced3d000004' || req == '4fe23f9b363283a404000001')
		return true;
	else return false;
}

	function checkWWW(req, res, next){
		if(req.headers.host.match(/^www/)){
			console.log('www');
			res.writeHead(301, {'location':'http://'+req.headers.host.replace(/^www\./,'')+req.url});
			res.end();
		} 
		else
			next();
	}
	
	function checkLoggedIn(req, res, next){
		if(req.user){
			if(req.url == '/logout'){
				req.logOut();
				res.writeHead(302, {'location':'http://localhost:8888/login'});
				res.end();
			}
			else if(req.url.split('/')[1] == 'l')
				indexor.returnIndexL(req.url,res);
			else if(req.url.split('/')[1] == 'a')
				indexor.returnIndexA(req.url,res);
			else
				next();
		}
		else if(req.url.split('/')[1] == 'l'){
			if(req.session) req.session.beenHere = 'Y';
			indexor.returnIndexL(req.url,res);
		}
		else if(req.url.split('/')[1] == 'a')
			indexor.returnIndexA(req.url,res);		
		else if(req.url == '/logN'){
			req.session.beenHere = 'N';
			fs.readFile(__dirname + '/files/html/landing.html',function(error,content){
				res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
	        	res.end(content);
			});
		}
		else{
			console.log('\nNot LOGGED IN\n');
			if(req.socket.remoteAddress || req.socket.socket.remoteAddress == '127.0.0.1'){
		      	var folder,contentType;
				console.log('req url = '+req.url);
	  		   	if(req.url == '/landing.png'){
					folder = __dirname+'/files/images/landing.png';
					contentType = 'image/png';
				}
				else if(req.url == '/facebookLanding.png'){
					folder = __dirname+'/files/images/facebookLanding.png';
					contentType = 'image/png';
				}
				else if(req.url == '/auth/facebook'){
					passport.authenticate('facebook', {scope: ['email','user_location','user_birthday']})(req,res,next);
					return;
				}
				else if(req.url.split('?')[0] == '/auth/facebook/callback'){
					passport.authenticate('facebook', {failureRedirect: '/failbook', 'successRedirect':'http://localhost:8888/'})(req, res, next);
					return;
				}
				else if(req.url.split('?')[0] == '/failbook'){
					console.log('failed log in');
					res.writeHead(401);
					res.end('Your login attempt with Facebook failed. If this is an error, please try logging in again or get in touch with Facebook.');
					return;
				}
				else if(req.session.beenHere == 'Y'){
					next();
					return;
				}
				else{
		        	folder = __dirname + '/files/html/landing.html';
		        	contentType = 'text/html; charset=utf-8';
			    }
				if(folder){
					console.log('got to folder part\n\n');
			        fs.readFile(folder, function(error, content){
			          if(error){
			            res.writeHead(500);
			            res.end();
			          }
			          else{
			            res.writeHead(200, {'Content-Type': contentType});
			            res.end(content);
			          }
			        });
			      }
				  else{ res.writeHead(500); res.end();}
			}
			else if(req.cookie.INU) next();
			else {res.writeHead(500); res.end();}
		}
	}
	
  connect.createServer(
	checkWWW,
	connect.logger(),
	connect.cookieParser(),
	connect.bodyParser(),
	connect.session({store: new redistore, secret:'jibblym87543dxj'}),
	connect.query(),
	passport.initialize(),
	passport.session(),
	checkLoggedIn,
    require('./fileServer')(),
    connect.compress({memLevel:9}),
	router,
	userRouter,
    //authRouter).listen(80);
	authRouter).listen(8888);
  console.log('Server has started.');
}

