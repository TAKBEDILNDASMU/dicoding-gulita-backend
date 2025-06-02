'use strict';

const loggingPlugin = {
  name: 'appLogging',
  version: '1.0.0',
  register: async function (server, options) {
    server.events.on('response', function (request) {
      console.log(`${new Date().toISOString()}: ${request.method.toUpperCase()} ${request.path} --> ${request.response.statusCode}`);
    });

    server.events.on('log', (event, tags) => {
      if (tags.error) {
        console.error(`Server Error: ${event.error ? event.error.message : 'unknown'}`);
      }
    });

    server.events.on({ name: 'request', channels: 'error' }, (request, event, tags) => {
      console.error(`Request Error: ${event.error ? event.error.stack : 'unknown'}`);
    });
  },
};

export default loggingPlugin;
