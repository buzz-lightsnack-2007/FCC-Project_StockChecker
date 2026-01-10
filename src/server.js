'use strict';
require('dotenv').config();
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('\x1b[32mThe app is listening on port \x1b[1m' + listener.address().port + '\x1b[0m.');
  if(process.env.NODE_ENV == 'test') {
    console.log('Running Tests…');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        console.error('\x1b[1m\x1b[31mTests are not valid:\x1b[0m');
        console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
