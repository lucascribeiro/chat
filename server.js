'use strict';

let http = require('http'),
  fs = require('fs'),
  url = require('url'),
  qs = require('querystring'),
  uuid = require('uuid'),
  Wit = require('./node-wit-master').Wit,
  interactive = require('./node-wit-master').interactive,
  express = require('express'),
  path = require('path'),
  app = express();
  const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node server.js <wit-access-token>'); // JTLYSXWPBAFHNVD2J7THGN2UOYWLRLIV
    process.exit(1);
  }
  return process.argv[2];
})();

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;

  if (!val) {
    return null;
  }

  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    lastresponse = response['text'];
    //console.log('sending...', JSON.stringify(response));
  },
  //{context, entities}
  getForecast(request) {
    var location = firstEntityValue(request.entities, 'location');
    if (location) {
      request.context.forecast = 'sunny in ' + location; // we should call a weather API here
      delete request.context.missingLocation;
    } else {
      request.context.missingLocation = true;
      delete request.context.forecast;
    }
    return request.context;
  },
};

const witclient = new Wit({accessToken, actions});
const sessionId = uuid.v1(); // Wit
const steps = require('./node-wit-master/lib/config.js').DEFAULT_MAX_STEPS;
let context = {}, lastresponse = null;

http.createServer(function(request, response){
  var path = url.parse(request.url).pathname;

  if (path == "/message") {
    console.log("requisição recebida");

    var body = '';

    request.on('data', function (data) {
      body += data;

      if (body.length > 1e6)
        request.connection.destroy();
    }).on('end', function () {
      var post = qs.parse(body);

      witclient.runActions(sessionId, post["textmsg"], context, steps)
      .then((ctx) => {
        context = ctx;
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.end(lastresponse);
        console.log("resposta enviada");
      }).catch(err => console.error(err))
    });
  } else if (path == "/js/index.js"){
      fs.readFile('js/index.js', function(err, file) {
      if(err) {  
        console.log('nao foi possivel abrir o arquivo index.js');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/javascript' });
      response.end(file, "utf-8");
    });
    } else if (path == "/css/style.css"){
      fs.readFile('css/style.css', function(err, file) {
      if(err) {  
        console.log('nao foi possivel abrir o arquivo style.css');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/css' });
      response.end(file, "utf-8");
    });
    }else{
    fs.readFile('./index.html', function(err, file) {
      if(err) {  
        console.log('nao foi possivel abrir o arquivo index.html');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(file, "utf-8");
    });
  }
}).listen(7171);
