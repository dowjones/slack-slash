##Changelog

###1.1.0
- Slack now allows slash commands to respond using extra message formatting or attachments so we now support that. [Learn more.](https://api.slack.com/slash-commands)
- When a handler is registered it the app will now create a public directory with that handler name. The path to this directory gets passed to the handler as an option so now your handler can access its own filesystem.

### 1.0.0
Initial release