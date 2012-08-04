README

server.js = the main file that runs to get the server going. 

If you want your own server code to get integrated into the main process, then you need to require your code within server.js. This is done by adding a line after "songetter = require('./songInterface')", except using a variable that makes sense to your feature and ./yourFileNameHere instead of ./songInterface. Then, in the "switch(pathname){" statement, you'll need to add a line that checks whether or not the pathname is equal to whatever the client will be calling to use your server code. You can use songInterface.js as a reference.


script.js = the script that populates the database with the songs/artists. It calls various other scripts as it runs to take care of all the work. If you're doing automated scripting work, it might be good to take a look here.


files/ = a directory that holds any static files that won't ever change. if you need to add a static file (e.g. an image) that is never going to change, please change "fileServer.js" so that it adds your file to the memory cache of static files that get returned quickly to clients.


pde/ = a directory that holds the raw Processing code for UndanceableEnergy, along with an html file that'll let you access said code in a browser. This code is SOLELY for development purposes, since it is way easier to develop front-end code in a PDE file. The front-facing version of the app is this code converted to javascript that's saved within the html file that's downloaded. 