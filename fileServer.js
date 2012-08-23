
var fs = require('fs'),
  utils = require(__dirname + '/node_modules/connect/lib/utils'),
  zlib = require('zlib'),
  gzip = zlib.createGzip(),
  url = require('url'),
  files = {};
  //indexCreator = require('./indexCreator');

/**
 *   - `maxAge`  cache-control max-age directive, defaulting to 1 day
 *
 */

module.exports = function fileServer(maxage){
  var maxAge = maxage || 86400000;

  return function fileServer(req, res, next){
    if(req.socket.remoteAddress || req.socket.socket.remoteAddress == '127.0.0.1'){
    
    switch(req.url){
      case('/favicon.ico'):
        if (files.icon) {
          res.writeHead(200, files.icon.headers);
          res.end(files.icon.body);
        } else readfile('/files/icons/favicon.ico','image/x-icon','icon',false)
        break;
      case('/robots.txt'):
        res.writeHead(404);
        res.end();
        break;
      case('/areyouateapot'):
        res.writeHead(418);
        res.end('check the header!');
        break;
      case('/'):
	  case('/#_=_'):
      case('/hennessy'):
	  case('/smirnoff'):
	  case('/greygoose'):
	case('/ciroc'):
	case('/crownroyal'):
	case('/baileys'):
	case('/moet'):
	case('/belvedere'):
	case('/bacardi'):
	//culture
	case('/culture'):
        if (files.index) sendfile('index',true);
        else readfile('/files/index.html','text/html; charset=utf-8','index',true);
        break;
      case('/processing-1.3.6.min.js'):
        if (files.processingmin) sendfile('processingmin',true);
        else readfile('/files/lib/processing-1.3.6.min.js','text/javascript','processingmin',true)
        break;
      case('/soundmanager2.js'):
        if (files.sm2) sendfile('sm2',true);
        else readfile('/files/lib/soundmanager2-nodebug-jsmin.js','text/javascript','sm2',true)
        break;
      case('/soundmanager2.swf'):
        if (files.sm2f) sendfile('sm2f');
        else readfile('/files/lib/soundmanager2.swf','application/x-shockwave-flash','sm2f',false)
        break;
	  case('/upl0dder'):
	 	if(req.user == '4fe486215a805bcf53000001' || req.user == '4fe77c671588a57e47000001' || req.user == '4fe42f6ecef89ced3d000004' || req.user == '4fe23f9b363283a404000001'){
			if (files.upl0dder) sendfile('upl0dder',true);
			else readfile('/files/locs/upload.html','text/html','upl0dder',true)
	      }
		  break;
	  case('/pl0dder'):
	 	if(req.user == '4fe486215a805bcf53000001' || req.user == '4fe77c671588a57e47000001' || req.user == '4fe42f6ecef89ced3d000004' || req.user == '4fe23f9b363283a404000001'){
			if (files.pl0dder) sendfile('pl0dder',true);
			else readfile('/files/locs/uploader.html','text/html','pl0dder',true)
		}
		break;
	  case('/jquery-ui-1.8.18.custom.css'):
		if (files.jqcss) sendfile('jqcss',true);
		else readfile('/files/css/jquery-ui-1.8.18.custom.css','text/css','jqcss',true)
		break;
	  case('/images/ui-icons_454545_256x240.png'):
	    if (files.icon1) sendfile('icon1');
	    else readfile('/files/images/ui-icons_454545_256x240.png','image/png','icon1',false)
	    break;
	  case('/images/ui-icons_cccccc_256x240.png'):
	    if (files.icon2) sendfile('icon2');
	    else readfile('/files/images/ui-icons_cccccc_256x240.png','image/png','icon2',false)
	    break;
	  case('/images/ui-bg_highlight-soft_75_000000_1x100.png'):
	    if (files.bg2) sendfile('bg2');
	    else readfile('/files/images/ui-bg_highlight-soft_75_000000_1x100.png','image/png','bg2',false)
	    break;
	  case('/images/ui-bg_flat_75_000000_40x100.png'):
	    if (files.bg1) sendfile('bg1');
	    else readfile('/files/images/ui-bg_highlight-soft_75_000000_1x100.png','image/png','bg1',false)
	    break;
	  case('/heart.svg'):
          if (files.heart) sendfile('heart');
		  else readfile('/files/icons/heart.svg', 'image/svg+xml', 'heart', false);
          break;
        case('/greyHeart.svg'):
          if (files.greyHeart) sendfile('greyHeart');
          else readfile('/files/icons/greyHeart.svg', 'image/svg+xml', 'greyHeart', false);
          break;
		 case('/processing.js'):
			if (files.processingjs) sendfile('processingjs',true);
          	else readfile('/files/lib/processing.js', 'text/javascript', 'processingjs', true);
          	break;
		  case('/logo'):
			if (files.logo) sendfile('logo');
        	else readfile('/files/images/logo.png', 'image/png', 'logo', false);
        	break;
		  case('/info'):
			if (files.info) sendfile('info');
        	else readfile('/files/icons/info.png', 'image/png', 'info', false);
        	break;
		  case('/facebook'):
			if (files.facebook) sendfile('facebook');
        	else readfile('/files/icons/facebook.png', 'image/png', 'facebook', false);
        	break;
	      case('/exit.png'):
			if (files.exit) sendfile('exit');
        	else readfile('/files/icons/exit.png', 'image/png', 'exit', false);
        	break;
	      case('/wikibio.png'):
			if (files.wikibio) sendfile('wikibio');
        	else readfile('/files/icons/wikibio.png', 'image/png', 'wikibio', false);
        	break;
		  case('/heartbasket.png'):
			if (files.heartbasket) sendfile('heartbasket');
        	else readfile('/files/icons/heartbasket.png', 'image/png', 'heartbasket', false);
        	break;
		  case('/miniNYC.png'):
			if (files.miniNYC) sendfile('miniNYC');
        	else readfile('/files/images/miniNYC.png', 'image/png', 'miniNYC', false);
        	break;

      default: 
		next();
    } 
	
	  var folder,contentType;
	 
    var requrl = url.parse(req.url, true).pathname;
    if(requrl.indexOf('/css/') == 0) {
      var strippedString = requrl.replace('/', '');
      if(files[strippedString]) sendfile(strippedString)
      else readfile('/files' + requrl, 'text/css', strippedString, true);
    } else if(requrl.indexOf('/js/') == 0) {
      var strippedString = requrl.replace('/', '');
      if(files[strippedString]) sendfile(strippedString)
      else readfile('/files' + requrl, 'text/javascript', strippedString, true);
    } /*else if(requrl.indexOf('/song/') == 0){ //songID
		res.writeHead(302, {'location':'http://rapcities.com'});
		res.end();
    }*/ else if(req.url == '/upl0d.pde'){                        // FROM HERE PLZ!
		folder = __dirname + '/files/locs/uploadxy.pde';
		contentType = 'text/processing';
	}
	else if(req.url == '/indexold.html'){
        folder = __dirname + '/pde/indexold.html';
        contentType = 'text/html; charset=utf-8';
      }
	else if(req.url == '/rapcities.pde'){
        folder = __dirname + '/pde/rapcitiesAlpha.pde';
        contentType = 'text/processing';
      }//*/

	  else{
		var parsed = url.parse(req.url,true);
		var pathname = parsed.pathname;
		var ext = path.extname(pathname);
		if(ext == '.grid'){
			if(req.url.split('.')[1]=='art'){
				folder = __dirname + '/files/grid/art_'+req.url.split('/')[1].split('.')[0]+'.gif';
				contentType = 'image/png';
			}
			else if(req.url.split('.')[1]=='large'){
				folder = __dirname + '/files/grid/standard_'+req.url.split('/')[1].split('.')[0]+'.gif';
				contentType = 'image/png';
			}
			else{
				folder = __dirname + '/files/grid/standard_'+req.url.split('/')[1].split('.')[0]+'.gif';
				contentType = 'image/gif';
			}
		}
	}
 
      if(folder){
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
    
}
 //icon, index, sm2, sm2f, sm2f9, processing, info, fbook, ytube;   
    function sendfile(file,compress){
      var acceptEncoding = req.headers['accept-encoding'];
      if (!acceptEncoding || !compress) {
		res.writeHead(200, files[file].headers);
        res.end(files[file].body);
      }
      else if (acceptEncoding.trim() == '*' || acceptEncoding.match(/\bgzip\b/)) {
        res.writeHead(200, files[file+'g'].headers);
        res.end(files[file+'g'].body);
      }
      else if (acceptEncoding.match(/\bdeflate\b/)) {
        res.writeHead(200, files[file+'d'].headers);
        res.end(files[file+'d'].body);
      }
      else{ 
        res.writeHead(200, files[file].headers);
        res.end(files[file].body);
      }
    }
    //if compress, then create gzip and deflate as well, otherwise, just a regular copy
    function readfile(path,contentType,file,compress){
      fs.readFile(__dirname + path, function(err, buf){
        if (err) return next(err);
        files[file] = {
          headers: {
             'Content-Type': contentType,
             'Content-Length': buf.length,
             'ETag': '"' + utils.md5(buf) + '"',
             'Cache-Control': 'public, max-age=' + (maxAge / 1000)
          }, body: buf
        };
        if(compress){
          zlibBuffer(zlib.createGzip({level:zlib.Z_BEST_COMPRESSION,memLevel:zlib.Z_MAX_MEMLEVEL}),buf,function(err,gzip){
            files[file+'g'] = {
              headers: {
                 'Content-Type': contentType,
                 'Content-Encoding':'gzip',
                 'Content-Length': gzip.length,
                 'ETag': '"' + utils.md5(gzip) + '"',
                 'Cache-Control': 'public, max-age=' + (maxAge / 1000)
              }, body: gzip
            };
          });
          zlibBuffer(zlib.createDeflate({level:zlib.Z_BEST_COMPRESSION,memLevel:zlib.Z_MAX_MEMLEVEL}),buf,function(err,deflate){
            files[file+'d'] = {
              headers: {
                 'Content-Type': contentType,
                 'Content-Encoding':'deflate',
                 'Content-Length': deflate.length,
                 'ETag': '"' + utils.md5(deflate) + '"',
                 'Cache-Control': 'public, max-age=' + (maxAge / 1000)
              }, body: deflate
            };
          });
        }
        res.writeHead(200, files[file].headers);
        res.end(buf);
      });
    }
    //zippify!
    function zlibBuffer(engine, buffer, callback) {
      var buffers = [];
      var nread = 0;

      engine.on('error', function(err) {
        engine.removeListener('end');
        engine.removeListener('error');
        callback(err);
      });

      engine.on('data', function(chunk) {
        buffers.push(chunk);
        nread += chunk.length;
      });

      engine.on('end', function() {
        var buffer;
        switch(buffers.length) {
          case 0:
            buffer = new Buffer(0);
            break;
          case 1:
            buffer = buffers[0];
            break;
          default:
            buffer = new Buffer(nread);
            var n = 0;
            buffers.forEach(function(b) {
              var l = b.length;
              b.copy(buffer, n, 0, l);
              n += l;
            });
            break;
        }
        callback(null, buffer);
      });

      engine.write(buffer);
      engine.end();
    }
  };
};
