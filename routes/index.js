var express  = require('express'),
    path     = require('path'),
    nconf    = require('nconf'),
    router   = express.Router(),
    handlers = require('../handlers');
    handlersObj = {};

var ERRORS = {
  NOT_FOUND: 'Command Not Found',
  UNAUTHORIZED: 'Unauthorized Request'
};

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
  var command = req.params ? req.params.command : null,
      slackToken = req.body ? req.body.token : null,
      err;

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
  handlersObj[command].handle(req, function(err, message) {
    if (err) {
      return res.send(err);
    }
    return res.send(message);
  });
}

function registerHandler (handler) {
  var command = handler.command,
      pkg     = handler.pkg,
      token   = nconf.get(handler.tokenVar),
      opts    = handler.options;

  try {
    var SlashCommandHandler = require(pkg);
    handlersObj[command] = new SlashCommandHandler(token, opts);
  }
  catch (e) {
    console.log(e);
  }
}