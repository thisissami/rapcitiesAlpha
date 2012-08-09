/* @pjs preload="http://localhost:8888/facebook,http://localhost:8888/info,http://localhost:8888/miniNYC.png,http://localhost:8888/logo";*/
boolean started;
PFont font;
color[] colorsold;
color[] outlineColors;
Hashmap genres;
HashMap longText; //used for long text
Current current; //used to display current song info and controls
SidePane sidePane; //displays the sidepane
Map nyc;

final int NOSORT = 0;
final int HOTSORT = 1;
final int LHOTSORT = 2;

final int GENRE = 0;
final int STYLE = 1;
final int MOOD = 2;

int sortSongs = NOSORT;
boolean genreArray = false;
int genreDisplay = MOOD; 
int filterPopRock = 0;

var grid,gridLoad;

//positions of different sections of the screen
final int ZOOM = 0;
final int SCROLL = 1;
int WIDTH,HEIGHT,YBASE,XBASE;
int xgrid,ygrid;
int bannerX, bannerY, bannerXFull, bannerYFull;
int MINIMAXY; 

void setup(){
  WIDTH = max(700,$(window).width());//screen.width;//950;
  HEIGHT = max(870,$(window).height());//screen.height;// 635;
setUpLocations();
var pathArray = window.location.pathname.split( '/' );
if(pathArray.length > 0 && pathArray[0] != "songid"){
	if(pathArray.length < 3)
		sponsor = pathArray[1];
	else
		sponsor = pathArray[3];
	//alert(sponsor);
}
  logo = loadImage("http://localhost:8888/logo");
$("#parent").css("width",WIDTH).css("height",HEIGHT);
  if(WIDTH == 700 || HEIGHT == 870){
	$("body").css("overflow","visible");
	//$("#dialogWindow").css("position","fixed");
  }
//else $("#dialogWindow").css("position","absolute");
  bannerXFull = 1920;
  bannerYFull = 1000;
  bannerX = 20;//WIDTH/bannerXFull*300;
  bannerY = 30;//HEIGHT/bannerYFull*300;
  YBASE = 30;
  XBASE = 0;
  ygrid = 8*950;
  xgrid = 8*1000;
togglePlayer();
recentlyPlayed = new ArrayList();
		
	
  size(WIDTH, HEIGHT);
  frameRate(30);
  smooth();
  rectMode(CORNERS);
  ellipseMode(CENTER_RADIUS);
  started = false;
  font = createFont("Arial", 13);
  textFont(font);
  setUpColors();
  songs = new ArrayList();
  longText = new HashMap();
  sidePane = new SidePane(WIDTH-bannerX-284,bannerY);
  current = new Current();
  nyc = new Map();
	grid = new Array(8);
	gridLoad = new Array(8);
	for(int i = 0; i < 8; i++){
		grid[i] = new Array(8);
		gridLoad[i] = new Array(8);
		for(int j = 0; j < 8; j++)
			gridLoad[i][j] = false;
	}
  facebook = loadImage("http://localhost:8888/facebook");
  //youtube = loadImage("http://localhost:8888/youtube");
  //info = loadImage("http://localhost:8888/info");
  //heart = loadImage("http://localhost:8888/heart");
  //twitter = loadImage("http://localhost:8888/twitter");
  //money = loadImage("web_money.jpg")
}


void setUpSize(width,height){
	if(width != WIDTH || height != HEIGHT){
		WIDTH = width;
		HEIGHT = height;
		$("#parent").css("width",width).css("height",height);
		 YBASE = 30;
		 XBASE = 0;
		//MINIMAXY = HEIGHT-30;
		size(WIDTH,HEIGHT);
		xlength = WIDTH;
		ylength = HEIGHT;
		PANEMINX = WIDTH-bannerX-284;
	    //INFOMINY = PANEMINY+controlLength;
	    //PANEMINY = bannerY;
		PANEMAXX = WIDTH-bannerX;
		//PANEMAXY = HEIGHT-300;
		miniRedX = map(xlength,0,xgrid,0,284);
		miniRedY = map(ylength,0,ygrid,0,270);
		nyc.setMins();
		volX = PANEMINX+40;
		
		//yloc = PANEMAXY - 15;
	    current.play.newPos(PANEMINX+72, yloc);
	    current.ffwd.newPos(PANEMAXX-20, yloc);
		seekLeft = PANEMINX+95;
		volX = PANEMINX+40;
		seekRight = PANEMAXX - 40 - timeDisplacement;
	
		curLeft = PANEMINX; curRight = PANEMAXX; //curTop = PANEMAXY - 230; curBottom = PANEMAXY;
	  //$('#dialogWindow').css('right',bannerX + "px").css('top',PANEMAXY-200+"px");
	}
}

//PShapeSVG info;
PImage facebook, youtube, money,info,heart,facebook2,twitter;

void setUpColors(){
  colorMode(RGB);
  colorsold = new color[10];
  outlineColors = new color[10];
  colorsold[0] = color(255,0,0);
  colorsold[1] = color(255,103,0);
  colorsold[2] = color(255,182,0);
  colorsold[3] = color(231,255,0);
  colorsold[4] = color(0,255,18);
  colorsold[5] = color(0,255,212);
  colorsold[6] = color(0,104,155);
  colorsold[7] = color(149,0,255);
  colorsold[8] = color(248,0,255);
  colorsold[9] = color(255,3,141);
  outlineColors[0] = color(0,153,153);
  outlineColors[1] = color(100,168,209);
  outlineColors[2] = color(133,133,232);
  outlineColors[3] = color(230,113,255);
  outlineColors[4] = color(255,128,157);
  outlineColors[5] = color(255,176,128);
  outlineColors[6] = color(255,195,100);
  outlineColors[7] = color(249,243,140);
  outlineColors[8] = color(222,244,130);
  outlineColors[9] = color(204,255,123);
}

void draw(){
  nyc.draw();
  imageMode(CORNER);
  image(logo,0,0);//,logo.width,logo.height);
  //draws the current song controller
  sidePane.draw();
current.draw();
  if(curloc > -1)
		drawHoverInfo(curloc);
}

var icons = new HashMap();
var media = {}
var colors = {}
//new HashMap();
//var media = new HashMap();

var locations = new ArrayList();
void setUpLocations(){
	$.getJSON('http://localhost:8888/loc/browse?city=NYC&hasLoc=8', function(results){      
      if(results && results.locs){
        for(int i = 0; i < results.locs.length; i++){
            locations.add(results.locs[i]);
		}
      }
    });
	$.getJSON('http://localhost:8888/loc/getTypes',function(results){
		if(results && results.types){
			for(int i = 0; i < results.types.length; i++){
				icons.put(results.types[i]._id, requestImage('http://localhost:8888/loc/getTypeIcon?_id='+results.types[i]._id));
				colors[results.types[i]._id] = color(results.types[i].r, results.types[i].g, results.types[i].b);
				media[results.types[i]._id] = results.types[i].mediaType;
			}
		}
	});
}

int minX, minY, maxX, maxY;
int xlength, ylength, miniRedX,miniRedY;

int curloc = -1;
void loadMapPiece(int i, int j){
	var title;
	if((i == 0) || (i == 1 && j < 1)){
		title = "0";
		title += String(i*8+j+1)+'.large.grid';
	}
	else
		title = String(i*8+j+1)+'.large.grid';
	gridLoad[i][j] = true;
	grid[i][j] = loadImage('http://localhost:8888/'+title);
}

void keyPressed(){
	nyc.keyPressed();
}
int miniMidX,miniMidY,midX,midY;
class Map{
	PImage NYC, miniNYC;
	int NYCx = 1000;
	int NYCy = 711;
	int ox, oy, ocx, ocy;
	int allX, allY;//grid
	var widths, heights;//lengths
	int ominx, ominy;
	int minix, miniy, maxix, maxiy;
	boolean opressed = false;
	boolean miniPressed = false;
	Map(){
		//NYC = loadImage("http://localhost:8888/NYC.gif");
		miniNYC = loadImage("http://localhost:8888/miniNYC.png");
		ox = oy = -1;
		/*ominx = minX = NYCx - xdif;//map(NYCx - xdif,0,2000,725.056,935.131);
		maxX = NYCx + xdif;//map(NYCx + xdif,0,2000,725.056,935.131);
		ominy = minY = NYCy - ydif;//map(NYCy - ydif,0,1422,701.865,950.945);
		maxY = NYCy + ydif;//map(NYCy + ydif,0,1422,701.865,950.945);*/
		//531.749 231.083 853 810
		prep();
	}
//	2000 x 1422
	/*
	"bottom right", "x" : "935.1310068607902", "y" : "850.9446986836866", "_id" : ObjectId("4f650989a0651c0372000003") }
	{ "name" : "top left", "x" : "725.0560652572382", "y" : "701.8649879537509", "_id" : ObjectId("4f6509e2a0651c0372000004") }
	
	*/

	
	void draw(){
		drawMap();
		drawLocations();
		drawCurrent();
		fill(0);
		noStroke();
		rectMode(CORNERS);
		drawMini();
	}
	
	void drawMap(){
		imageMode(CENTER);
		var totX = 0;//widths[0];
		var totY = 0;//heights[0];
		int i;
		for(i = 0; i < 8; i++){
			totX+=widths[i];
			if(totX > midX)
					break;
//				print(grid[0][i].width + " ");
		}
		int j;
		for(j = 0; j < 8; j++){
			totY += heights[j];
			if(totY > midY)
					break;
//				print(grid[j][0].height + " ");
		}
		grimage(j,i,0+xlength/2-(widths[i]/2-(totX-midX)),0+ylength/2-(heights[j]/2-(totY-midY)));
		if(j > 0)
			grimage(j-1,i,0+xlength/2-(widths[i]/2-(totX-midX)),0+ylength/2-heights[j] - (heights[j-1]/2-(totY-midY))+1);
		if(i > 0)
			grimage(j,i-1,0+xlength/2-widths[i]-(widths[i-1]/2-(totX-midX))+1,0+ylength/2-(heights[j]/2-(totY-midY)));
		if(j < 7)
			grimage(j+1,i,0+xlength/2-(widths[i]/2-(totX-midX)),0+ylength/2+heights[j+1]/2+(totY-midY)-1);
		if(i < 7)
			grimage(j,i+1,0+xlength/2+widths[i+1]/2+(totX-midX)-1,0+ylength/2-(heights[j]/2-(totY-midY)));
		if(j>0 && i>0)
			grimage(j-1,i-1,0+xlength/2-widths[i]-(widths[i-1]/2-(totX-midX))+1,0+ylength/2-heights[j] - (heights[j-1]/2-(totY-midY))+1);
		if(j>0 && i<7)
			grimage(j-1,i+1,0+xlength/2+widths[i+1]/2+(totX-midX)-1,0+ylength/2-heights[j] - (heights[j-1]/2-(totY-midY))+1);
		if(j<7 && i<7)
			grimage(j+1,i+1,0+xlength/2+widths[i+1]/2+(totX-midX)-1,0+ylength/2+heights[j+1]/2+(totY-midY)-1);
		if(j<7 && i>0)
			grimage(j+1,i-1,0+xlength/2-widths[i]-(widths[i-1]/2-(totX-midX))+1,0+ylength/2+heights[j+1]/2+(totY-midY)-1);
		//println("x: "+midX+"  y: "+midY);
		//println("i: " + i + "j: " + j);*/
	}
	
	void grimage(int j, int i, int one, int two){
		if(grid[j][i])
			image(grid[j][i],one,two);
		else if(!gridLoad[j][i]){
			loadMapPiece(j,i);
			rectMode(CENTER);
			fill(150); noStroke();
			rect(one, two, 1000,1000);
		}
	}
	
	void drawMini(){
		imageMode(CORNERS);
		image(miniNYC,PANEMINX,PANEMAXY,PANEMAXX,MINIMAXY);
		/*minix = map(minX, 0, 2000, 0, 284);
		maxix = map(maxX, 0, 2000, 0, 284);
		miniy = map(minY, 0, 1422, 0, 270);
		maxiy = map(maxY, 0, 1422, 0, 270);*/
		rectMode(CENTER);
		noFill();
		strokeWeight(1);
		stroke(colorsold[0]);
		rect(PANEMINX+miniMidX,PANEMAXY+miniMidY,miniRedX,miniRedY);
		ellipseMode(CENTER);
		for(int i = 0; i < locations.size(); i++){
			var cur = locations.get(i);
			fill(colors[cur.type]); stroke(colors[cur.type]);
			if(cur == location)
				ellipse(map(cur.x, 531.749,531.749+853,PANEMINX,PANEMAXX),map(cur.y,231.083,231.083+810,PANEMAXY,MINIMAXY),5,5);
			else
				ellipse(map(cur.x, 531.749,531.749+853,PANEMINX,PANEMAXX),map(cur.y,231.083,231.083+810,PANEMAXY,MINIMAXY),3,3);
		}
	//	fill(255); rect(PANEMAXX,PANEMAXY+270,10,10);
		//rect(PANEMINX+minix,PANEMAXY+miniy,PANEMINX+maxix,PANEMAXY+maxiy);
	}
	/*
	widths:
	1018 1027 1017 1028 1017 1028 1017 1037 
	heights
	950 970 970 969 979 970 970 979 
	totx:9207toty: 8707
	*/
	void prep(){
		xlength = WIDTH;
		ylength = HEIGHT;
		miniRedX = map(xlength,0,xgrid,0,284);
		miniRedY = map(ylength,0,ygrid,0,270);
		midX = 2600;
		midY = 4100;
		miniMidX = map(midX,0,xgrid,0,284);
		miniMidY = map(midY,0,ygrid,0,270);
		widths = new Array(1000,1000,1000,1000,1000,1000,1000,1000);
		heights = new Array(950,950,950,950,950,950,950,950);
		allX = 1000*8; allY = 950*8;
		setMins();
	}
	void miniMousePressed(){
		if(mouseX>PANEMINX && mouseY>PANEMAXY && mouseX<PANEMAXX && mouseY<MINIMAXY){
			miniPressed = true;
			miniMidX = min(max(miniRedX/2,mouseX - PANEMINX),284-miniRedX/2);
			miniMidY = min(max(miniRedY/2,mouseY - PANEMAXY),270-miniRedY/2);
			miniToMaxi();
		}
	}
	
	void miniMouseDragged(){
		if(miniPressed){
			miniMidX = min(max(miniRedX/2,mouseX - PANEMINX),284-miniRedX/2);
			miniMidY = min(max(miniRedY/2,mouseY - PANEMAXY),270-miniRedY/2);
			miniToMaxi();
		}
	}
	void miniToMaxi(){
		midX = map(miniMidX,0,284,0,xgrid);
		midY = map(miniMidY,0,270,0,ygrid);
		setMins();
	}
	
	void miniMouseReleased(){
		miniPressed = false;
	}
	boolean once = false;
	
	void keyPressed(){
		if(key == CODED){
			switch(keyCode){
				case(UP): miniMidY = max(miniMidY-1,miniRedY/2); miniToMaxi(); break;
				case(DOWN): miniMidY = min(miniMidY+1,270-miniRedY/2); miniToMaxi();break;
				case(LEFT): miniMidX = max(miniMidX-1, miniRedX/2); miniToMaxi();break;
				case(RIGHT): miniMidX = min(miniMidX+1, 284-miniRedX/2); miniToMaxi();break;
			}
		}
	}
	
	void mousePressed(){
		ox = mouseX;
		oy = mouseY;
		ocx = midX; //original cur
		ocy = midY;
		ominx = minX;
		ominy = minY;
		opressed = true;
	}
	
	void mouseDragged(){
		if(opressed){
			midX = ocx - (mouseX-ox);
			midY = ocy - (mouseY-oy);
			if(midX > xgrid-xlength/2)
				midX = xgrid-xlength/2;
			if(midX < xlength/2)
				midX = xlength/2;
			if(midY < ylength/2)
				midY = ylength/2;
			if(midY > ygrid - ylength/2)
				midY = ygrid - ylength/2;
			miniMidX = map(midX,0,xgrid,0,284);
			miniMidY = map(midY,0,ygrid,0,270);
			
			setMins();
			/*
			minX = ominx + ocx - midX;
			maxX = minX + xdif*2;
			minY = ominy + ocy - curNYCy;
			maxY = minY + ydif*2;*/
		}
	}
	
	void setMins(){
		minX = map(midX-xlength/2,0,xgrid,531.749,531.749+853);
		maxX = map(midX+xlength/2,0,xgrid,531.749,531.749+853);
		minY = map(midY-ylength/2,0,ygrid,231.083,231.083+810);
		maxY = map(midY+ylength/2,0,ygrid,231.083,231.083+810);
	}
	
	void mouseReleased(){
		opressed = false;
		//setUpArtists();
	}
	void mouseOut(){
		opressed = false;
	}
	
	void drawLocations(){
		imageMode(CENTER);
		curloc = -1;
		for(int i = 0; i < locations.size(); i++){
			var cur = locations.get(i);
			if(cur.x < maxX+10 && cur.x > minX-10 && cur.y < maxY+15 && cur.y > minY-15 && icons.get(cur.type).width > 0){
				var x = map(cur.x,minX,maxX,0,WIDTH);
				var y = map(cur.y,minY,maxY,0,HEIGHT);
				if(mouseX < x+15 && mouseX > x-15 && mouseY < y+15 && mouseY > y-15
					&& (mouseX < PANEMINX || mouseX > PANEMAXX || mouseY < PANEMINY || mouseY > MINIMAXY)){
					image(icons.get(cur.type),x,y);
					curloc = i;
				}
				else if(location && cur._id==location._id){
					image(icons.get(cur.type),x,y);
				    textSize(18);
				    int xlength = textWidth(cur.title);
				    stroke(colors[cur.type]);
				    fill(0);
					rectMode(CENTER);
				    rect(x, y-40,xlength+12, 26,10);

				      fill(colors[cur.type]);
				     // fill(outlineColors[genres.get(songs.get(hoverSong).genre)]);
				    textAlign(LEFT,TOP);
				    text(cur.title, x-xlength/2, y-50);
			    }
				else
					image(icons.get(cur.type),x,y);
			}
		}
	}
		
	void drawCurrent(){
		if(iconrequested && curicon.width>0){
			iconready = true;
			if(!iconset){
				iconx = map(mouseX, 0, width, minX, maxX);
				icony = map(mouseY, 0, height, minY, maxY); 
				image(curicon, map(iconx,minX,maxX,0,WIDTH),map(icony,minY,maxY,0,HEIGHT));
			}
			else{
				image(curicon, map(iconx,minX,maxX,0,WIDTH),map(icony,minY,maxY,0,HEIGHT));
			}
		}
	}
	
}

var curicon; var iconrequested = false; var iconready = false; var _id;
var iconset = false; var iconx, icony;
var location; var curVid = -1; var curloc = -1;

void mouseClicked(){
  if(curloc >= 0){
	location = locations.get(curloc);
	console.log(location);
	$("#curid").html(location._id);
	playingVideo = 0;
	loadVideo();
  }
	else if(curVid >= 0){
		playingVideo = curVid;
		loadVideo();
		//getSong(artist.topTracks[curSong].id);
	}
	else if(mouseX < PANEMINX || mouseX > PANEMAXX || mouseY < PANEMINY || mouseY > MINIMAXY){
		if(mouseButton == LEFT){
			if(iconready){			
				if(iconset){
					$.ajax({
						url: "http://localhost:8888/loc/editLocation",
						data: {_id:_id, x:iconx+'', y:icony+'',city:'NYC'},
						success: function(response){if(response){
							if(response.success && response.object){ 
								var found = false;
								for(int i = 0; i < locations.size(); i++){
									if(locations.get(i)._id == _id){
										locations.remove(i);
										locations.add(response.object);
										
										found = true;
										break;
									}
								}
								if(!found) locations.add(response.object);
								var str = 'Operation Successful';
								if(response.message) str += '\n' + response.message;
								curicon = null;
								iconready = false;
								iconset = false;
								iconrequested = false;
								alert(str);
							} else alert('There seems to be an error:\n\n'+response.message);
						}}
					});
				}
				else{
					iconset = true;
				}
			}
			else{
				_id = document.input._id.value;
				if(_id && _id.length > 6){
					curicon = requestImage("http://localhost:8888/loc/getTypeIconID?city=NYC&_id="+_id);
					iconrequested = true;
				}
			}	
		}
		else{
			curicon = null;
			iconready = false;
			iconset = false;
			iconrequested = false;
		}
	}
}

void drawHoverInfo(int i){
    var loc = locations.get(i);
    textSize(18);
    int xlength = textWidth(loc.title);
    stroke(colors[loc.type]);
    fill(0);
	rectMode(CORNERS);
    rect(mouseX, mouseY-33,mouseX+xlength+12, mouseY-7,10);

      fill(colors[loc.type]);
     // fill(outlineColors[genres.get(songs.get(hoverSong).genre)]);
    textAlign(LEFT,TOP);
    text(loc.title, mouseX+6, mouseY-30);
}
	
void getSong(int id){
	$.getJSON('http://localhost:8888/getTrack?id=' + id, function(data){
		if(started) stopSong();
		startSong(data.url);
	});
}
void startSong(String url){
	    song = soundManager.createSound({
	      id: url,
	      url: url,
	      autoLoad: true,
	      autoPlay: true,
	      volume: volume,
	      onfinish: function(){ createNext(); }
	    });
	    started = true;
	    if(muted)
	      song.mute();
	  }
	  void stopSong(){
	    started = false;
	    song.stop();
	    song.unload();
	    song.destruct();
	  }

void mousePressed(){
  if(mouseY < curBottom && mouseY > curTop && mouseX < curRight && mouseX > curLeft){
    current.mousePressed();
  }
  else if(mouseX > PANEMINX && mouseX < PANEMAXX && mouseY > PANEMINY && mouseY < MINIMAXY){
	if(mouseY < PANEMAXY)
    	sidePane.mousePressed();
 	else
		nyc.miniMousePressed();
  }
  else
	nyc.mousePressed();
}


void mouseDragged(){
  current.mouseDragged();
  nyc.mouseDragged();
  nyc.miniMouseDragged();
}
void mouseOut(){
	nyc.mouseOut();
	current.mouseReleased();
}

void mouseReleased(){
  current.mouseReleased();
  nyc.mouseReleased();
  nyc.miniMouseReleased();
}

int hoverSong = -1;
//float[][] temp = new float[36][2]; //used to show the entirely returned json

int songGlow = 1;
int songGlowWait = 0;
boolean songGlowUp = true;

  
void resetSongs(){
  for(int i = songs.size()-1; i > -1; i--){
    if(i==curSong&&started)
      songs.get(i).stopSong();
    songs.remove(i);
  }
  curSong = -1;
  song = null;
}



abstract class Button{
  int x, y, hw, hh;//x and y coordinates, followed by half the WIDTH and HEIGHT
  boolean invert;
  boolean pressedHere; // boolean to check whether button was pressed originally vs a different one
  Button(int x, int y, int hw, int hh)
  {
    this.x = x;
    this.y = y;
    this.hw = hw;
    this.hh = hh;
  }
  
  boolean pressed()
  {
    return mouseX > x - hw && mouseX < x + hw && mouseY > y - hh && mouseY < y + hh;
  }
  
  void newPos(int x, int y){
	this.x = x;
	this.y = y;
  }
  abstract void mousePressed();
  abstract void mouseReleased();
  abstract void draw();
}

class Play extends Button{
  boolean play;
    
  Play(int x, int y, int hw, int hh) 
  { 
    super(x, y, hw, hh); 
    play = true;
  }
  

  boolean paused()
  {
    return play;
  }
  
  // code to handle playingVideo and pausing the file
  void mousePressed()
  {
    if (super.pressed()){
      invert = true;
      pressedHere = true;
    }
  }
  
  void mouseDragged(){
    if (super.pressed() && pressedHere)
      invert = true;
    else
      invert = false;
  }
  
  void mouseReleased()
  {
    if(invert && pressedHere){
      if(started && playMode == AUDIO)
        song.togglePause();
	  else if(playMode == VIDEO){
		if(player.getPlayerState()==2)
			player.playVideo();
		else
			player.pauseVideo();
	  }
      invert = false;
    }
    pressedHere = false;
  }
  
  // play is a boolean value used to determine what to draw on the button
  void update()
  {
    if(playMode == AUDIO && started){
      if (song != null && song.playState==1){
        if(song.paused){
          if(!changingPosition)
            play = true;
        }
        else
          play = false;
      }
      else 
        play = true;
    }
	else if(playMode == VIDEO){
      if (player.getPlayerState()==2||player.getPlayerState()==-1){
          if(!changingPosition)
            play = true;
        }
        else
          play = false;
      }
  }
  
  void draw()
  {
    if ( invert ){
      fill(255);
      noStroke();
    }
    else{
      noFill();
      if(super.pressed())
        stroke(255);
      else
        noStroke();
    }
    rect(x - hw, y - hh, x+hw, y+hh);
    if ( invert )
    {
      fill(0);
      noStroke();
    }
    else
    {
      fill(255);
      noStroke();
    }
    if ( play )
    {
      triangle(x - hw/2, y - hh/2, x - hw/2, y + hh/2, x + hw/2, y);
    }
    else
    {
      rect(x - hw/2, y - hh/2, x-1, y + hh/2);
      rect(x + hw/2, y - hh/2, x +1, y + hh/2);
    }
  }
}

class Forward extends Button{
  boolean invert;
  boolean pressed;
  
  Forward(int x, int y, int hw, int hh)
  {
    super(x, y, hw, hh);
    invert = false;
  }
  
  void mousePressed()
  {
    if (super.pressed()){ 
      invert = true;
      pressedHere = true;
    }
  }
  
  void mouseDragged(){
    if (super.pressed() && pressedHere)
      invert = true;
    else
      invert = false;
  }
  
  void mouseReleased()
  {
    if(invert && pressedHere){
      //code to skip to next song
      nextLocation();
      invert = false;
    }
    pressedHere = false;
  }

  void draw()
  {
    if ( invert ){
      fill(255);
      noStroke();
    }
    else{
      if(super.pressed()){
		textSize(14);
		var twidth = textWidth("Next Location");
		fill(0); stroke(255);
		rect(x-twidth/2-3,y+15,x+twidth/2+3,y+35);
		textAlign(CENTER,TOP);
        fill(255); text("Next Location",x,y+17);
		noFill();
	}
      else{
        noStroke();
		noFill();
		}
    }
    rect(x - hw, y - hh, x + hw, y+hh);
    if ( invert )
    {
      fill(0);
      noStroke();
    }
    else
    {
      fill(255);
      noStroke();
    }
    rect(x-3, y-hh/2, x-6, y + hh/2); 
    triangle(x, y - hh/2, x, y + hh/2, x + hw/2 +1, y);    
  }  
}

//create the next song
void createNext(){
  stopVideo();
  if(playingVideo < location.list.length-1){
  	playingVideo++;
	loadVideo();
	//getSong(artist.topTracks[playingVideo].id);
  }
  else
	nextLocation();
}

ArrayList recentlyPlayed;

void nextLocation(){
	boolean alreadyPlayed = false;
	for(int i = 0; i < recentlyPlayed.size(); i++){
		if(recentlyPlayed.get(i) == location._id){
			alreadyPlayed = true;
			break;
		}
	}
	if(!alreadyPlayed){
		recentlyPlayed.add(location._id);
	}
	for(int i = 0; i < locations.size(); i++){
		var cur = locations.get(i);
		if(cur.x > minX && cur.x < maxX && cur.y > minY && cur.y < maxY && !recentlyPlayed.contains(cur._id)){
			location = cur;
			playingVideo = 0;
			loadVideo();
			//prepareBio();			
		}
	}
}

function textPair(length,index){
  this.length = length;
  this.index = index;
}

void checkText(String string, int x, int y,int max,color col, int ybelow){
  if(textWidth(string)>max){
    var cur = longText.get(string + textWidth(string));
    if(cur == null){
      cur = new textPair(0,0);
      longText.put(string+textWidth(string),cur);
    }
    int i = cur.index;
    int slength = string.length();
    if(cur.length >= textWidth(string.charAt(i))){
      if(i < slength-1){
        cur.index++;
        i++;
        cur.length = 0;
      }
      else{
        cur.index = i = 0;
        cur.length = -40;
      }
    }
    int totalLength = textWidth(string.charAt(i))-cur.length;
    i++;
    while(totalLength < max && i < slength){
      totalLength += textWidth(string.charAt(i));
      i++;
    }
    text(string.substring(cur.index,i),x-cur.length,y);
    if(i == slength){
      totalLength += 40;
      int j = 0;
      while(totalLength < max){
        totalLength += textWidth(string.charAt(j));
        j++;
      }
      text(string.substring(0,j),x+textWidth(string.substring(cur.index,i))-cur.length + 40, y);
    }
    noStroke();
    fill(0);
	rectMode(CORNERS);
    rect(x-textWidth('W'),y+ybelow,x,y);
    rect(x+max,y,x+max+textWidth('W'),y+ybelow);
    fill(col);
    cur.length++;
    longText.put(string+textWidth(string),cur);
  }
  else
    text(string,x,y);
}

final int BASICINFO = 0;
final int SETTINGS = 1;

int curGenre = 0;
int PANEMINY, PANEMINX, PANEMAXY, PANEMAXX, controlLength, INFOMINY;
class SidePane{  
  int panel = BASICINFO;
  int margin = 10;
  int slant = 2;
  int num;
  int mouseMainPaneControl = -1;
  int mouseSort = -1;
  int mouseFilter = 0;
  int genreFilter = 0;
  boolean mouseOnTitle = 0;
  int mouseGenre = -1;
  var colorIcon, sortIcon;
  
  String[] names = {" Current Info"," Color Mode","Sorting"};
  color currentColor;

  SidePane(minx, miny){
    PANEMINX = minx;
    PANEMINY = miny;
    controlLength = 57;
    INFOMINY = PANEMINY+controlLength;
	PANEMAXX = WIDTH-bannerX;
	PANEMAXY = PANEMINY + 555;
	MINIMAXY = PANEMAXY + 270;
    num = names.length;
    textSize(16);
  }
  
  void draw(){
    drawControl();
	if(!location){printNoSong();}else{printLocation();}		
  }

 
	
			
  void mousePressed(){

  }
  
  void mouseReleased(){}
  
  void drawControl(){
	fill(0);
	//noStroke();
	strokeWeight(2);
    stroke(255);
	rectMode(CORNERS);
	//rect(PANEMINX,PANEMINY,PANEMAXX,PANEMAXY);
	rect(PANEMINX,INFOMINY,PANEMAXX+1,PANEMAXY);
    
    textSize(15);
	//line(PANEMAXX+1,INFOMINY,PANEMAXX+1,PANEMAXY);
    /*line(PANEMINX,PANEMINY,PANEMAXX,PANEMINY);
    line(PANEMINX, INFOMINY, PANEMAXX, INFOMINY);
    line(PANEMINX,PANEMINY,PANEMINX, PANEMAXY-1);
    line(PANEMAXX+1,PANEMINY,PANEMAXX+1,PANEMAXY-1);*/
	rectMode(CORNERS);
	noFill();
	rect(PANEMINX, MINIMAXY, PANEMAXX+1, PANEMAXY);
    /*for(int i = 0; i < 5; i++)
      line(PANEMINX + controlLength*(i+1), PANEMINY, PANEMINX + controlLength*(i+1),INFOMINY-1);
	imageMode(CORNERS);
	image(info, PANEMINX, PANEMINY,PANEMINX+controlLength,INFOMINY);
	image(facebook,PANEMINX+controlLength*2,PANEMINY,PANEMINX+controlLength*3,INFOMINY);
	image(heart,PANEMINX+controlLength,PANEMINY,PANEMINX+controlLength*2,INFOMINY);
	image(youtube,PANEMINX+controlLength*3,PANEMINY,PANEMINX+controlLength*4,INFOMINY);
	image(twitter,PANEMINX+controlLength*4,PANEMINY,PANEMINX+controlLength*5,INFOMINY);
    ellipseMode(CENTER_RADIUS);
    noStroke();*/
    /*for(int i = 0; i < 10; i++){
      fill(colorsold[(colorIcon.start + i)%10]);
      ellipse(PANEMINX+length+colorIcon.places[i*2],PANEMINY+colorIcon.places[i*2+1],4,4);
    }
    for(int i = 0; i < 10; i++){
      stroke(colorsold[(sortIcon.start + i)%10]);
      line(PANEMINX+length*2+7,PANEMINY+sortIcon.places[i], PANEMINX+length*3-8,PANEMINY+sortIcon.places[i]);
    }*/
    //checking da mouse
    /*mouseMainPaneControl = -1;
    stroke(255);
    noFill();
    //rect(PANEMINX+length*panel+2,PANEMINY+1,PANEMINX+length*(panel+1)-2,INFOMINY-2);
    if(mouseX > PANEMINX && mouseY > PANEMINY && mouseY < INFOMINY && mouseX < PANEMINX+controlLength*5){
      for(int i = 0; i < 5; i++){
        if(mouseX < PANEMINX + controlLength*(i+1)){
          rect(PANEMINX+controlLength*i+2,PANEMINY+1,PANEMINX+controlLength*(i+1)-2,INFOMINY-2);
          textAlign(LEFT,BASELINE);
          textSize(16);
          fill(255);
		  curMenu = i;
          title(PANEMINX,PANEMINY-7);
          mouseMainPaneControl = i;
          break;
        }
      }
    }
	else curMenu = -1;*/
  }
  
	/*void title(int x, int y){
		switch(curMenu){
			case 0: text("Artist Info",x,y);break;
			case 1: text("Heart Artist",x,y);break;
			case 2: text("Artist's Facebook Page",x,y);break;
			case 3: text("View Current Song Video",x,y);break;
			case 4: text("Tweet About Song",x,y); break;
		}
	}*/
	void printLocation(){
		textAlign(LEFT,TOP);
		textSize(22);
		fill(colors[location.type]);
		checkText(location.title,PANEMINX+10,INFOMINY+10, 200, 0,22);
		fill(255);
		textSize(16);
		curVid = -1;
		if(location.list){
			int tot = location.list.length;
			for(int i = 0; i < tot; i++){
				if(i == playingVideo){
					fill(colors[location.type]);
					checkText(location.list[i].title, PANEMINX+20, INFOMINY + 35 + i*22,248,colors[location.type],30);
					fill(255);
				}
				else if(mouseX>PANEMINX+20 && mouseY < INFOMINY+35+(i+1)*22&& mouseY>INFOMINY+35+i*22){
					fill(colors[location.type]);
					checkText(location.list[i].title, PANEMINX+20, INFOMINY + 35 + i*22,248,colors[location.type],30);
					curVid = i;
					fill(255);
				}
				else
					checkText(location.list[i].title, PANEMINX+20, INFOMINY + 35 + i*22,248,color(255),30);
			}
		}
		else{
			text(location.info,PANEMINX+20, INFOMINY+35,248,PANEMAXX-PANEMINX+20);
		}
	}
  //Basic Song Information
  void printNoSong(){
		textAlign(LEFT);
	fill(255);
    textSize(16);
    text("Welcome to RapCities! Here you can explore how the sound of Hip-Hop and Rap changes from neighborhood to neighborhood in New York City!\n\n"
    +"If you find an artist you want to check out, just click on their icon, and you'll get to sample some of their most popular tunes.\n\n"
    , PANEMINX+20, INFOMINY+35, PANEMAXX - PANEMINX - 40,HEIGHT-INFOMINY);
  }
}

int curSong = -1;
int playingVideo = -1;

boolean changingPosition = false; // used to alter where the drawing happens
int volume = 50;
boolean muted = false;
int timeDisplacement, seekLeft, volX;
int curRight, curLeft, curTop, curBottom, yloc;
  
//class used to control the current song. also displays current song info
class Current{
  Play play; //play button
        //Rewind rewind; //rewind button
  Forward ffwd; //ffwd button

  Current(){
	curLeft = PANEMINX; curRight = PANEMAXX; curTop = PANEMAXY - 230; curBottom = PANEMAXY;
    timeDisplacement = textWidth("0:00/0:00");
	seekLeft = PANEMINX+95;
	yloc = PANEMAXY-18;
    play = new Play(PANEMINX+72, yloc, 10, 10);
             //rewind = new Rewind(250, 50, 20, 10);
    ffwd = new Forward(PANEMAXX-20, yloc, 10, 10);
	volX = PANEMINX+40;
	volY = 15; volD = 0.3; //divider (make it twice volY divided by 100)
	volS = 20; // separatedeness of volume setter
	seekRight = PANEMAXX - 40 - timeDisplacement;
    textSize(15);
  }
  
  void draw(){
    if(playMode == VIDEO || (playMode == AUDIO && started)){
	
	rectMode(CORNERS);
      // draw the controls
      play.update();
      play.draw();
              //rewind.draw();
      ffwd.draw();  
      
     // draw the seekbar
      drawSeekBar();
    //  drawSongInfo();
      
     drawVolume();
      if(onVolGen)
        drawVolumeSetter();
      rectMode(CENTER);
      ellipseMode(CENTER_RADIUS);
    }
  }
  
  boolean pressedInSeekBar = false;
  /* FUUUUUUCK WASTE OF MY TIME! 
  void mouseClicked(){
    //play.mouseClicked();
    //ffwd.mouseClicked();
    seekBarClicked();
    volClicked();
  }
  */
  void mousePressed(){
    play.mousePressed();
            //rewind.mousePressed();
    ffwd.mousePressed();
    checkSeekBar();
    checkVol();
  }
  
  void mouseDragged(){
    play.mouseDragged();
              //rewind.mouseDragged();
    ffwd.mouseDragged();
    dragSeekBar();
    dragVol();
  }

  void mouseReleased()
  {
    play.mouseReleased();
              //rewind.mouseReleased();
    ffwd.mouseReleased();
    releaseSeekBar();
    releaseVol();
  }
  
  boolean onVolume(){
    if(mouseX > volX-10 && mouseX < volX+2 && mouseY > yloc-6 && mouseY < yloc+6)
      return true;
    return false;
  }
  boolean onVolumeSetter(){
    if(mouseX > volX-volS-10 && mouseX < volX+20 && mouseY > yloc-volY && mouseY < yloc+volY)
      return true;
    return false;
  }
  
  boolean onVol = false;
  boolean onVolGen = false;
  boolean volDragged = false;
  
  void drawVolume(){
    if(onVolume()){
      onVol = true;
      stroke(255);
    }
    else{
      noStroke();
      onVol = false;
    }
    fill(255);
    triangle(volX-10, yloc, volX, yloc-7, volX, yloc+7);
    rect(volX-10,yloc+3,volX-3, yloc-3);
    stroke(255);
    strokeWeight(2);
    noFill();
	ellipseMode(RADIUS);
    if(!muted){
      if(volume > 80)
        arc(volX+6, yloc, 12, 12, -(PI/3), PI/3);
      if(volume > 60)
        arc(volX+5, yloc, 9, 9, -(PI/3), PI/3);
      if(volume > 40)
        arc(volX+4, yloc, 6, 6, -(PI/3), PI/3);
      if(volume > 20)
        arc(volX+3, yloc, 3, 3, -(PI/3), PI/3);
    }
    else{
      stroke(colorsold[0]);
      line(volX-9,yloc-8,volX+2,yloc+7);
    }
    if(onVolumeSetter())
      onVolGen = true;
    else if(!volDragged)
      onVolGen = false;
  }  
  
  void checkVol(){
    if(onVol)
      toggleMute();
    else if(onVolGen && mouseX > volX-volS-5 && mouseX < volX-volS+5 && mouseY > yloc -volY && mouseY < yloc+volY){
		volDragged = true;
      volume = (yloc+volY - mouseY)/volD;
		if(playMode == AUDIO)
      		song.setVolume(volume);
		else if(playMode == VIDEO)
  			player.setVolume(volume);			
    }
  }

  void dragVol(){
    if(volDragged){
      if(mouseY > yloc+volY)
        volume = 0;
      else if(mouseY < yloc-volY)
        volume = 100;
      else
        volume = (yloc+volY - mouseY)/volD;
	  	if(playMode == AUDIO)
      		song.setVolume(volume);
		else if(playMode == VIDEO)
  			player.setVolume(volume);			
    }
  }
  
  void releaseVol(){
    if(volDragged){
      volDragged = false; 
    }    
  }
  
  void drawVolumeSetter(){
    stroke(255);
    strokeWeight(2);
    fill(0);
    rect(volX-volS-5, yloc-volY, volX-volS+5, yloc+volY);
    if(volume > 0){
      fill(colorsold[2]);
      noStroke();
      rect(volX-volS-4, yloc+volY-1, volX-volS+4, yloc+volY+1 - volume*volD);
    }
  }
  //toggle both real mute and our variable
  void toggleMute(){
	if(playMode == AUDIO && started)
    	song.toggleMute();
	else if(playMode == VIDEO){
		if(player.isMuted())
			player.unMute();
		else
			player.mute();
	}	
    muted = !muted;
  }
  
  boolean songPausedToBeginWith = false;
  
  //checks to see if user clicked somewhere in the seek bar
  void checkSeekBar(){
    //if song is loaded
    if((playMode == AUDIO && started)||playMode == VIDEO){
      //if it is within the seekbar range
      if(mouseX>seekLeft && mouseX<seekRight && mouseY>yloc-10 && mouseY<yloc+10){
        changingPosition = true;
        stillWithinSeekBar = true;
        if((playMode == AUDIO && song.paused) || (playMode == VIDEO && player.getPlayerState() == 2)) //save whatever state it was in
          songPausedToBeginWith = true;
        else
          songPausedToBeginWith = false;
		if(playMode == AUDIO)
        	song.pause();
		else
			player.pauseVideo();
      }
    }
  }
  /* fuuuuuuuuuuuuuuuuuuuck waaaaste of tiiiime!
  void seekBarClicked(){
    if(started){
      //if it is within the seekbar range
      if(mouseX>385 && mouseX<385+512 && mouseY>40 && mouseY<60){
        if(songs.get(curSong).song.readyState == 1)
          total = songs.get(curSong).song.durationEstimate;
        //if song is fully loaded
        else if(songs.get(curSong).song.readyState == 3)
          total = songs.get(curSong).song.duration;
        int seekPosition = (int)map(mouseX-385, 0, WIDTH/2, 0, total);
        /*if(!songPausedToBeginWith)
        songs.get(curSong).song.resume();  till here
        songs.get(curSong).song.setPosition(seekPosition);
      }
    }
  }
  */
  //checks to see if user let go of the mouse will in seekbar land
  void releaseSeekBar(){
    //if song is loaded
    if(playMode == VIDEO || (playMode == AUDIO && started)){
      //if click was initiated in seekbar
      if(changingPosition){
        //if within range still
        if(mouseX>seekLeft && mouseX<seekRight && mouseY>yloc-10 && mouseY<yloc+10){
          int total;
		  if(playMode == AUDIO){
          	if(song != null && song.readyState == 1)
	            total = song.durationEstimate;
	          //if song is fully loaded
	          else if(song != null && song.readyState == 3)
	            total = song.duration;
			 int seekPosition = (int)map(mouseX,seekLeft,seekRight, 0, total);
	          if(!songPausedToBeginWith)
	            song.resume();
	          song.setPosition(seekPosition);
		  }
		  else{
			int seekPosition = (int)map(mouseX,seekLeft,seekRight, 0, player.getDuration());
	          player.seekTo(seekPosition, true);
			  if(!songPausedToBeginWith)
	            player.playVideo();
			} 
          
        }
        changingPosition = false;
        stillWithinSeekBar = false;
        //make it play again if it's been paused in the transition process
        if(!songPausedToBeginWith){
			if(playMode == AUDIO)
          		song.resume();
			else
				player.playVideo();
		}
      }
    }
  }
  
  boolean stillWithinSeekBar;
  //makes the line follow where the mouse is while dragging around
  void dragSeekBar(){
    //if song is loaded
    if(playMode == VIDEO || (playMode == AUDIO && started)){
      //if click was initiated in seekbar
      if(changingPosition){
        //if within range still
        if(mouseX>seekLeft && mouseX<seekRight && mouseY>yloc-10 && mouseY<yloc+10)
          stillWithinSeekBar = true;
        else
          stillWithinSeekBar = false;
      }
    }
  }
  
  String totTime;
  int total;
  
  //draws the seekbar, along with the position of the song if it's playingVideo, as well as the time
  void drawSeekBar(){
    stroke(255);
    strokeWeight(3);
	if(playMode == VIDEO && player.getPlayerState() == -1){
		fill(255);
	      textSize(19);
	      textAlign(LEFT,CENTER);
			text("-:--/-:--",curRight-28-timeDisplacement,yloc);
		
	}
    if((playMode == AUDIO && song != null && song.readyState == 1) || playMode == VIDEO && player.getPlayerState() == 3){
		//draw song duration
      strokeWeight(1);
      line(seekLeft, yloc, seekRight, yloc);
      //draw amount loaded
      strokeWeight(3);
	float x;
		if(playMode == AUDIO)
      		 x = map(song.bytesLoaded, 0, song.bytesTotal, seekLeft, seekRight);
		else
			 x = map(player.getVideoBytesLoaded(), 0, player.getVideoBytesTotal(),seekLeft,seekRight);
      if(x>=0)
        line(seekLeft, yloc, x, yloc);
    }
    else
      line(seekLeft, yloc, seekRight, yloc);
    //if song is loaded/loading, draw position
    if((playMode == AUDIO && song != null && (song.readyState == 1 || song.readyState == 3)) || 
		(playMode == VIDEO && player.getPlayerState() > 0)){
      //take seek changes into account
      String curTime;

      if(!changingPosition || !stillWithinSeekBar){
		float x;
		if(playMode == AUDIO){
	        //if song is currently loading
	        if(song.readyState == 1){
	          total = song.durationEstimate;
	          totTime = makeTime(total/1000);
	        }
	        //if song is fully loaded
	        else if(song.readyState == 3){
	          total = song.duration;
	          totTime = makeTime(total/1000);
	        }
			curTime = makeTime(song.position/1000);
	        x = map(song.position, 0, total, seekLeft, seekRight);
		}
		else if(playMode == VIDEO){
			total = player.getDuration();
			totTime = makeTime(total);
			curTime = makeTime(player.getCurrentTime());
	        x = map(player.getCurrentTime(), 0, total, seekLeft, seekRight);
	        
		}
        if(x>=0)
          line(x, yloc-10, x, yloc+10);
      }
      else{
        line(mouseX, yloc-10, mouseX, yloc+10);
		float time = map(mouseX,seekLeft,seekRight,0,total);
		if(playMode == AUDIO)
			time /= 1000;
        curTime = makeTime(time);
      }
      fill(255);
      textSize(15);
      textAlign(LEFT,CENTER);
      //if(total != 0)
        //curTime += "/" + totTime;
      text(curTime+"/"+totTime,curRight-30-timeDisplacement,yloc);
    }
    strokeWeight(1);
  }
}

String makeTime(float time){ 
  int secs = (int) (time % 60);
  String minutes = (int) ((time % 3600) / 60);
  String seconds;
  //take care of sub-10 second cases
  if(secs == 0) 
    seconds = "00";
  else if(secs < 10)
    seconds = "0" + secs;
  else
    seconds = secs;
  return (minutes + ":" + seconds);
}  


void videoEnded(){
	if(location.list && playingVideo < location.list.length-1){
	  	playingVideo++;
		loadVideo();
  }
  else
	nextLocation();
}

void togglePlayer(){
	$("#ytplayer").html('<script type="text/javascript">var params = { allowScriptAccess: "always" };var atts = { id: "YouTubeP" };swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&version=3", "ytplayer", "283", "200", "8", null, null, params, atts);</script>');
}

var player; 
boolean playMode;
int AUDIO = 1;
int VIDEO = 2;

void prepPlayer(){
	player = document.getElementById('YouTubeP');
	playMode = VIDEO;
	player.setVolume(volume);
}

void loadVideo(){
   	if(location.list && location.list.length > 0){
	    player.loadVideoById(location.list[playingVideo].ytid);
	    //updateToolbox(location.list[playingVideo].RID, location._id, location.list[playingVideo].title, location.title);
	  }
	else if(location.ytid){
		player.loadVideoById(location.ytid);
		//updateToolbox();
	 //$("#ytplayer").html("<p>Couldn't find this song on YouTube</p>");
	}
}

void playVideo(newlocation, newsub){
	var newloc;
	if(newlocation == location._id)
		newloc = false;
	else
		newloc = true;
		
  for(int i = 0; i < locations.size(); i++){
    if(newlocation == locations.get(i)._id){
      location = locations.get(i);
			midX = map(location.x,531.749,531.749+853,0,xgrid);
			midY = map(location.y,231.083,231.083+810,0,ygrid);
			miniMidX = map(midX,0,xgrid,0,284);
			miniMidY = map(midY,0,ygrid,0,270);
			nyc.setMins(); 			
      if(newsub && location.list){
	for(int j = 0; j < location.list.length; j++){
	  if(location.list[j].RID == newsub){
	    playingVideo = j;
	    loadVideo(); //if(newloc)prepareBio();
	  }
	}
      }
      else{
	playingVideo = 0;
	loadVideo(); //if(newart)prepareBio();
      }
    }
  }
}

void prepareBio(){
    $.getJSON('http://localhost:8888/getBio?id='+artist.RID, function(results){      
      if(results != null){
        $("div#biolog").html('<b>'+artist.name+'</b><br /><p>' + results.text + '<br /><br />Source: <a href="' + results.url + '">Wikipedia</a></p>');
	  	$('div#biolog', window.parent.document).scrollTop(0);
	  }
	});
    
	if( !$("div#biolog").dialog("isOpen") ) {
		$("div#biolog").dialog("open");
	  }
}