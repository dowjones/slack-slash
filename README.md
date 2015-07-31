#slack-slash

Slack-Slash is a simple framework for handling [slash commands](https://api.slack.com/slash-commands) in [Slack](https://slack.com/). Configure your commands and handlers in one JSON file and the framework does the rest.

## What's a Slash Command?

**/:command [text]**

> Slash commands listen for custom triggers in chat messages across all Slack channels.

> For example, typing **/weather 94070** could send a message to an external URL that would look up the current weather forecast for San Francisco and post it back to the user in Slack.

For more information check out the [Slack API Documentation](https://api.slack.com/slash-commands).

## Adding Handlers

Adding handlers is a simple as requiring a module. In fact, it's even easier.

1. `npm install --save [handler-package-name]`
2. Add a config object for your handler inside `handlers.json`
3. Set your slack token environment variables

## Configuring Handlers

Handlers are defined as objects inside `handlers.json`.

#### Handler Object Properties

```
command:  @{String} slash command typed into slack
pkg:      @{String} module name to require
tokenVar: @{String} environment variable where slack token for slash command is stored
options:  @(Object) any options to pass to the handler [optional]
```

**Example**

```js
// handlers.json
[
  {
    "command": "jira",
    "pkg": "slack-slash-jira",
    "tokenVar": "slack_slash_jira_token",
    "options": {...}
  }
]
```

## Writing Handlers

slack-slash handlers are small modules meant to take the body text from a [Slack Slash Command](https://api.slack.com/slash-commands) and return a message to the Slack user.

### Getting Started

slack-slash handlers export a function. That function takes one or two arguments and must contain a handle method on its prototype that returns a string. The returned string can include [formatting supported by Slack](https://api.slack.com/docs/formatting).

**Sample Handler**
```js
// myCustomHandler.js

module.exports = slashHandler;

var slashHandler = function (token, options) {
  this.token = token;
  this.options = options;
}

slashHandler.prototype.handle = function (req, cb) {
  var bodyText = req.body.text;
  cb(null, 'Received commmand with text: ' + bodyText);
};
```

**Handler Arguments**

These arguments are defined in `handlers.json` and get passed into your handler.

- `token` - Token string from configured Slack integration. The token is used to validate requests came from Slack.
- `options` - Optional object with any properties you need to pass to your handler.

### handle(req, callback)

The `handle` method is the entry point to your handler. It will be called by slack-slash with two arguments, the request and a callback function.

**Arguments**

- `req` - This is the request object that contains the Slack post body inside `req.body`.
- `callback(error, message)` - The callback you must call when you are finished handling the request with an error (which can be `null`) and your formatted message.

### Slack Post Body

These are the properties available in the request from Slack.

```js
{
  token: 'xxx',
  team_id: 'xxx',
  team_domain: 'xxx',
  channel_id: 'xxx',
  channel_name: 'xxx',
  user_id: 'xxx',
  user_name: 'xxx',
  command: 'xxx',
  text: 'xxx'
}
```

## Example Handlers

- **[slack-slash-jira](https://github.com/dowjones/slack-slash-jira)** - Get quick info on a Jira ticket right from Slack.

## License

[MIT](/LICENSE.md)
