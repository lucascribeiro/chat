'use strict';

let http = require('http'),
  fs = require('fs'),
  url = require('url'),
  qs = require('querystring'),
  uuid = require('uuid'),
  Wit = require('./node-wit-master').Wit,
  interactive = require('./node-wit-master').interactive,
  path = require('path');
  const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node serverTest.js <wit-access-token>'); //FAWJXKT2LMJOV5VIUJ43RMIBK6EGFSNO
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
  getName(request) {
    var name = firstEntityValue(request.entities, 'name');
    if (name) {
      request.context.name = name;
      delete request.context.missingName;
    } else {
      request.context.missingName = true;
      delete request.context.name;
    }
    return request.context;
  },
  getCity(request) {
    var city = firstEntityValue(request.entities, 'city');
    if(city) {
      request.context.city = city;
      delete request.context.missingCity;
    } else {
      request.context.missingCity = true;
      delete request.context.city;
    }
    return request.context;
  },
  getMail(request) {
   var mail = firstEntityValue(request.entities, 'email');
   if(mail) {
     request.context.mail = mail;
     delete request.context.missingMail;
   } else {
     request.context.missingMail = true;
     delete request.context.mail;
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
