#RapCities Overview

The site RapCities runs using several distinct technologies that mesh beautifully well together. This overview gives a brief introduction to how the code itself is organized. Following the introduction, you will find sections of this document dedicated to each of the different aspects of the site. Each section will have its own introduction, followed by details that should help you get you acclimated to the code and be able to navigate your way around the logic of the site. 

You should read through the entirety of this document to get a good sense of the flow of things.

If you want to know how to run the code, please jump to the section entitled "Running the Code".

##Organizational Introduction

The site is organized using 3 main distinct units of code (as well as 2 databases - see Databases section for more details). The first unit is the server or backend. The second unit is the client or front end (the public interface and only part that most people will ever see). The third unit is the content management system that let's our non-coding team plot content onto the site without. This is also (technically speaking) a client that interfaces with the backend, but it is one that is only accessible to the content curators of RapCities. (On your local builds, you will be able to access this system just fine.)

#Public Front End 

The front end of the site that the public sees is built mainly using ProcessingJS. There are some jquery elements used (for example, the pop-ups that show the site's privacy policy/terms of use/etc.), but for the most part, everything is coded entirely in ProcessingJS. If you want to code something for the front end but want it to be outside of ProcessingJS, you need to receive explicit permission to do so first. The ProcessingJS code is interspersed with regular JavaScript.

http://processingjs.org/

##Files Involved

There are 3 distinct files that are involved with the front end.

1) /files/index.html - this is the file that people receive when they go to rapcities.com (or when you go to localhost:8888). Inside this file is embedded an obfuscated and minified version of the PDE file mentioned below. You will never have to worry about this file.

2) /pde/indexold.html - this is the equivalent of the above file used for development. The main difference is that instead of containing an embedded PDE file, it sources the following file.

3) /pde/rapcitiesAlpha.pde - this is where the magic of rapcities.com takes place. This defines basically the entirety of the interface of rapcities. Whenever you make changes to the frontend, this is where you will be altering or adding code. 

When you are working on the frontend, in order to see any of the changes you've made to rapcitiesAlpha.pde, you will need to point your browser to localhost:8888/indexold.html.

##rapcitiesAlpha.pde: The Inner Workings

While this file is extensive in length, it is actually quite simple in concept. It takes the core design principles of object-oriented programming to heart, and separates the various functions of the webapp into separate objects that operate (effectively) independently of each other (save for variables that they share on a global level, mainly relating to the resolution space available to them).

The main classes that are used in the file are the Map, Current, SidePane, and ToolBar classes. The Map class contains all the logic related to streaming the different parts of the map and displaying them, displaying the appropriate locations, and drawing the minimap. The Current class takes care of the logic relating to the user control of the currently playing video. It uses several objects that implement that abstract class Button (pause/play, next artist, etc.). The SidePane class contains all the logic pertaining to the information displayed above the video itself. This includes the list of videos for locations that have numerous videos, and the information for singular video locations. The ToolBar class is the class that contains all the logic that deals with (surprisingly enough) the toolbar that shows up when one is watching a video. 

(There is also an ArtistInfo class that deals with information related to the artist, but this is currently not in use and can be ignored.)

All of the above classes contain within them functions that watch for mouse clicks/drags/etc. 

There are numerous functions and variables that exist on a global level outside of these classes. Here are some of the most important global variables that are used throughout the application:

grid/artgrid - 8x8 2D array that contains 64 images that make up the total map displayed
location - current location that is on display in the SidePane
locations - ArrayList that contains all the locations within the app
icons - HashMap that contains all the icons for all the different location types
colors - JS object that acts like a HashMap that contains all the colors for the different location types (used for text and dots in the minimap)

##The Different Coordinate Systems

There are 3 distinct coordinate systems that are used in rapcitiesAlpha.pde:

1) The first is the coordinate system that processing uses. This is 0-WIDTH and 0-HEIGHT. Everything needs to be converted to this coordinate system to be drawn properly in the canvas.

2) The second is the coordinate system that the locations use. They have their own scale that is unchanging.

3) The last coordinate system is the pixel coordinate system used by the map. When locations are drawn, they first get their "location position" converted to the pixel coordinate system equivalent. If their location within the pixel coordinate system is within the currently drawn portion of the map, then those coordinates are then converted to the processing coordinate system, at which point they are drawn. The location and pixel coordinates are separate so that the scale of the map can always change in the future. 

Some variables related to positioning:

In coordinate system 1 (processing):

WIDTH/HEIGHT - total width/height of the working resolution - these have lower limits that they never get below, as decided in the setUpSize() function.

In coordinate system 2 (locations):

minX, maxX, minY, maxY - these are coordinates that set the bounds of the currently visible area within this scale. If a location value does not fall within these values in its natural coordinate system, it will not get drawn.

In coordinate system 3 (pixels):

xgrid/ygrid - the total width/height of the map in pixels (significantly larger than the pixel space drawn on the canvas).

midX/midY - the point within the xgrid/ygrid coordinate system that should be displayed in the center of the canvas (AKA where in the pixel grid we are currently centered)

miniMidX/miniMidY - same as above, except this corresponds to where the red rectangle is drawn in the miniMap (technically not in this system, but applicable)

#Content Management System

The CMS is built using jQuery. It is all one single page that gives all sorts of options to alter the content in the site. It interfaces effectively entirely with locs.js (file on the server).

http://jquery.com/

There are a series of links that act as a menu that let you choose what content you want to alter. All these links run javascript functions that lead to various forms that send information back to the server (forms are sent using the jQuery form plugin - http://jquery.malsup.com/form/). Whenever a menu item is clicked on, the div with id "display" is filled with the appropriate html. This includes a variety of html that already exists in other divs that are hidden using css (style="display:none"), along with data loaded using AJAX. 

If you want to add any functions to the CMS, you'll need to add a new link in the html code that immediately follows the <body> declaration. This link will need to point to the javascript function setMenu(). Within setMenu, there is a switch() statement that decides what code needs to run. Each possible menu choice passes a unique integer to setMenu to make this process possible. When adding a new menu option to the CMS, please use the integer that comes immediately after the highest integer currently in use. 
	
Details regarding the structure of the content will be discussed in the database section of this document. 

#Backend Code

The backend is built using NodeJS. All the logic maintained in the server is created entirely by us, which makes it much easier to figure out what's wrong when something breaks. (That is a significant portion of what NodeJS was created/is used for). As the name would imply, NodeJS uses JavaScript as its language of choice. This is convenient, seeing as how our two front ends both use JavaScript as their language as well. The database, as you will later find out, is populated with JavaScript Objects using JSONs, meaning the whole site through and through is built entirely with JavaScript.

##server.js

This is the main server file. All requests come through this object, and it passes all requests to all the other files as needed. In other words, server.js serves as the site's main router. In addition to being a router, server.js also holds all the logic pertaining to sessions and user logins (currently done solely through facebook). The session/user logic is handled using the module PassportJS. http://passportjs.org/

Server.js takes advantage of node's multi-core library (cluster), and as such will run a separate instance on each core available on a machine. 

Server.js is built using Connect (the popular ExpressJS web application framework is an abstracted version of Connect). http://www.senchalabs.org/connect/ Connect makes it very easy to add modules easily into the logic of our server. At the very end of the server code (currently line 179), you can see the Connect command to create a server. The createServer() command takes as parameters the list of functions that the request should run through. At every point in this process, a function can respond to the request, or pass the request on to the next step in the logic.

The current connect server logic flows as follows:

1) checkWWW() checks to see whether or not the URL of the request contains a 'www' or not. If it does, it forwards the page to the corresponding 'http://rapcities.com' page, without the 'www'. 
2) connect.logger() logs all the requests that don't merely require a change in url to the node console.
3) connect.cookieParser(), connect.bodyParser(), connect.session(), connect.query(), passport.initialize(), and passport.session() all deal with populating request fields with information related to cookies, sessions, and request bodies/queries. For the most part, this information is placed within the request object in nodeJS, passed around from function to function using the variable name "req". ("res" is the response object that is acted upon when we want to send a response back to the user)
4) checkLoggedIn() checks, as the name implies, as to whether or not a user is logged in. If they aren't, the html for the logIn page is sent to them.
5) require('./fileServer')() - this runs the code within a RapCities server file entitled fileServer.js. fileServer, as the name implies, serves all the static files that the site uses. (more info in a further section down below)
6) connect.compress() compresses any data that is being returned to a client by router (the following command).
7) router() - if the request hasn't been taken care of yet, router will find the appropriate file to send the request to and send it there.

If you need to write server code that you need the front end to interact with, you'll (for the most part) need to take the following steps:

1) Write the functions you need in a file, and name this file something that makes its function obvious. 
2) Within the server.js file, require your file and save it as a variable (see lines 26-28). 
3) Within the router() function, add a new case statement that results in a call to the appropriate functions within your code.
4) Make sure to have the front end client make a call to 'localhost:8888/whateverTheCaseIs' or 'rapcities.com/whateverTheCaseIs' as appropriate. 

It is most effective to treat the methods you write in the server as methods that you can access easily from the front end by just calling them. There just happens to be a longer delay for the response than normally, during which a request is sent to a server and routed to the appropriate file (object) that contains the method you want a response from. The language is the same across the board, and the information that is returned (for the most part a JSON) will be instantly readable by the front end.

##fileServer.js

This is the code that deals with serving static files. If you want to add some kind of static file to the site that you want to access from the front end, you will need to alter fileServer.js. 

In order to explain the process to do so, we'll use an example. Let's say you want to add a feature related to birthdays of artists, and want to use a birthday cake icon. First thing you will need is the actual image file. You'll need to put this file somewhere appropriate within the /files directory. Within this directory, there are subdirectories that can be described as various categories. An icon would likely go into the /files/icons directory. 

Once there, you'll need to add the logic in fileServer.js to return this icon. In order to do so, you will need to add a new case option to the large switch statement at line 21 (switch(req.url)). This case will need to use the url that the front end will be asking for. Let's say the processingJS code will be querying the server using the url rapcities.com/birthdayCake.jpg. You'll need to have a case statement as follows:

	case('/birthdayCake.jpg'):
	
Please note, the URL that you decide on DOES NOT need to match the filename. However, generally speaking, it will probably result in less confusion to have them match completely. 

Within the case statement, you'll need to have code that will both read the file into memory from the disk, and then send the file back to the client. Once a file is read into memory, it will be there for all future requests for the same file. This is accomplished using two functions that already exist - you just need to provide the parameters. These are sendfile() and readfile(). 

readfile() takes in 4 parameters: path - the filepath to the file in question, contentType - the http request header 'Content-Type', file -this is the id that fileServer.js uses to identify this file again, and compress - this is a boolean value that determines whether or not a compressed version of this file should be created to send back. In general, this should be set to false for images and other filetypes that are already compressed, and true for text documents (such as html and javscript files). 

sendfile() takes in two parameters - file (the id specified above) and compress (a boolean about whether or not a compressed file should be searched for - same logic as above).

The 'file' parameter that is given in readfile and sendfile corresponds to the id that will retrieve the object in question from the JavaScript Object files.

The full case code for our example, assuming that the image file is called birthdayCake.jpg would be as follows:

	case('/birthdayCake.jpg'):
		if (files.cake) sendfile('cake', false);
		else readfile('/files/icons/birthdayCake.jpg', 'image/jpeg', 'cake', false);
		break;

##locs.js

This is the code that deals with all the logistics related to all the locations within the site. All the plots that show up when going to rapcities.com are locations of different types.

More information will be added to this section at a later date.

##user.js

This is the code that deals with all the information relating to particular users, including their favorite lists. 

More information will be added to this section at a later date.

#Database

There are two separate databases that RapCities uses. Redis (interfaced with using the connect-redis module) is used for sessions, and let's all the different instances of our server (one on each core) work together. MongoDB is used for all the long-term content storage. RapCities interfaces with the database using the node-mongodb-native driver (https://github.com/mongodb/node-mongodb-native/). The docs provided in the github page are fantastic, and mongodb.org may come in handy as well. 

Within MongoDB, data is contained within a variety of collections. There are collections for locations (specifically, a different collection for each city - though currently the only accessible city is NYC) and users (all permanent user data is stored here), along with other less pervasive data types. 

#Running the Code

## Set Up

You will need to install a variety of things in order to get up and running. 

First, to access the code, you'll need to install git on your machine. Once you have git installed, you'll need to run the following command to download all the code so that you can work locally:

	git clone git@github.com:thisissami/rapcitiesAlpha.git
	
This will create a directory (and create a git remote) within whatever directory you run the command. 

Once you have the code, you'll need a variety of libraries to run said code. The most obvious thing would be NodeJS. For this, I would recommend using NVM (node version manager) to make upgrading to a new version of node in the future incredibly easy.

Next, you will need to download the binaries for MongoDB and Redis - the two databases we use. Once you have them downloaded, create a directory within the RapCities folder that you cloned entitled "bin". Place all the binaries you downloaded within this folder. Also create a directory (again within the cloned directory) entitled "db" (this will hold the actual database content).

You may need to use NPM (node package manager, automatically installed with node) to install the various node modules we need to run our app. The specific modules needed can be found in the package.json file. However, these should all automatically come from the git repository, so you should only need to take this step if you get errors relating to modules not being found when you try to run the code. 


## How To Run the Code Locally

Start the content database:

    ./bin/mongod --dbpath ./db/ --port 26374 --nojournal

Start the user database:

    ./bin/redis-server
    
Start the server:

    node server.js

If you don't get any errors, then you should be able to interact with the site by directing your browser to localhost:8888/indexold.html

## Editing Code

Before you start working on a feature, you should first create a branch specifically for that feature. This way, you can keep all your work-in-progress separate from the rest of the site. 

In order to create a new branch, you run the command

	git branch <name_of_branch>
	
where "name-of-branch" is descriptive of your feature. If you were working, for example, on a live streaming rap battle feature, you might use the name "liveRapBattle" or "liveStreaming" or something of that sort.

However, in addition to creating a branch, you'll actually need to switch from the master branch (that you're currently in) into the one you just created. To do so, you'll need to run:

	git checkout <name_of_branch>

You can always check what branch you're in by running

	git branch

without a name parameter - the starred branch is the one you're currently in.

Once you have made some changes to a file you're working on, add that to the git branch you're working on by using:

	git add <path-to-file>
	
Then, commit the changes using:

	git commit -m "message about this commit"

Once you have committed the changes that you've added to git, you can push them to your branch on github using

	git push origin <name_of_branch> 
	
'origin' is the default name for our github repository remote. This is set automatically in the clone command you ran earlier. "name-of-branch" of course needs to match the local branch name. 
	
If you are trying to gain access to a remote branch (as in a branch hosted on GitHub) that somebody else has created previously, you need just run the command

	git checkout <name_of_branch> 

You can use

	git branch -r

to see a list of all the remote branches available.

Once you're done, you'll need to merge the code back into master. To do this, you'll first need to switch back to the master branch, then pull any potential changes that somebody else may have added to the github page, and then finally merge your changes into the master branch:

	git checkout master
	git pull origin master
	git merge <name_of_branch>
	
More info: http://learn.github.com/p/branching.html