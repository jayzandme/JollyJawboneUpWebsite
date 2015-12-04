# JollyJawboneUpWebsite
The JollyJawboneUpWebsite is a website that displays a user's Jawbone UP data as well as allows users to interact with their 
data in the form of challenges, achievements, and teammates.

## Installation
You need node, mongo, and bower installed to run this project.
Once downloaded, in the node console, first run:
`npm install`
Then run:
`bower install`
In order to initialize the database with levels you will need to run (you must start the mongo database before running this):
`node init.js`

## Usage
To run the website, first start the mongo database. To do this, locate the mongod.exe file and run it. For more assistance, visit https://docs.mongodb.org/manual/tutorial/manage-mongodb-processes/ Then, in the node console, run
`node server` To do this, locate the server.js file and run it with the command `node server.js`
Finally, visit https://localhost:5000/from a browser, login to your jawbone UP account to view your data!