var express  = require('express');
var path     = require('path');
var fs       = require('fs');
var _        = require('lodash');
var request  = require('request');
var nconf    = require('nconf');
var router   = express.Router();
var handlers = require('../handlers');
var handlersObj = {};

var ERRORS = {
  NOT_FOUND: 'Command Not Found',
  UNAUTHORIZED: 'Unauthorized Request'
};

/* CREATE PUBLIC DIRECTORY IF IT DOESN'T EXIST */
var publicPath = path.join(__dirname, '..', 'public');
createPath(publicPath);

module.exports = router;

/* NCONF SETTINGS */
// Parse environment variables
nconf.env();

/* ROUTE DEFINITIONS */

// Slack Slash Commands
router.post('/svc/slack/:command', handleSlackRequest);

// Servo Health Check
router.get('/_health', function (req, res) {
  res.send({
    'status': 'ok'
  });
});

/* REGISTER HANDLERS */
handlers.forEach(registerHandler);

/* FUNCTIONS */

function handleSlackRequest (req, res, next) {
  var command = req.params ? req.params.command : null;
  var slackToken = req.body ? req.body.token : null;
  var err;

  // Verify command exists
  if (!command || !handlersObj[command]) {
    err = new Error(ERRORS.NOT_FOUND);
    err.status = 404;
    return next(err);
  }

  // Verify request came from Slack
  if (!slackToken || slackToken !== handlersObj[command].token) {
    err = new Error(ERRORS.UNAUTHORIZED);
    err.status = 401;
    return next(err);
  }

  // Handle Command
  console.log('Handling command: ' + command);
  handlersObj[command].handle(req, function (handlerError, handlerResponse) {
    respondToSlackRequest(req, res, handlerError, handlerResponse);
  });
}

function respondToSlackRequest(req, res, handlerError, handlerResponse) {

  console.log('handlerResponse:');
  console.log(handlerResponse);

  var defaultResponseObj = {
    response_type: 'ephemeral'
  };
  var resObj;
  var isDelayedResponse;

  // Handle errors and string responses
  if (handlerError || typeof handlerResponse === 'string') {
    resObj = _.assign({text: handlerError ? handlerError : handlerResponse}, defaultResponseObj);
  } else {
    // Handle response objects
    isDelayedResponse = handlerResponse.isDelayedResponse;
    delete handlerResponse.isDelayedResponse;
    resObj = _.assign({}, defaultResponseObj, handlerResponse);    
  }

  if (isDelayedResponse) {
    request({
      url: req.body.response_url,
      method: 'POST',
      body: resObj,
      json: true
    }, function () {
      res.end();
    });
  } else {
    res.json(resObj);
  }
}

function registerHandler (handler) {
  var command = handler.command;
  var pkg = handler.pkg;
  var token = nconf.get(handler.tokenVar);
  var opts = handler.options;
  var dir = path.join(publicPath, command);

  createPath(dir);

  opts.ssFilePath = dir;
  opts.ssPublicPath = command;

  try {
    var SlashCommandHandler = require(pkg);
    handlersObj[command] = new SlashCommandHandler(token, opts);
  }
  catch (e) {
    console.log(e);
  }
}

function createPath(path) {
  try {
    fs.statSync(path);
  } catch (e) {
    fs.mkdirSync(path);
  }
}