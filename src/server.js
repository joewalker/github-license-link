/*
Copyright 2016 Mozilla

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.
*/

import express from 'express';
import bodyParser from 'body-parser';
import events from './events';

const app = express();
app.use(bodyParser.json());

app.post('/github', (request, response, next) => {
  const event = request.get('X-GitHub-Event');
  if (event === undefined || !(event in events)) {
    return next();
  }

  events[event](request.body, github).then(() => {
    response.status(200).send('OK');
  }, (err) => {
    console.error(err);
    response.status(500).send(err);
  });

  return undefined;
});

let server = null;
let github = null;

export async function startServer(githubObj) {
  if (server) {
    throw new Error('Server is already started.');
  }

  server = app.listen(process.env.PORT);
  github = githubObj;
  server.on('close', () => {
    server = null;
  });
}

export function stopServer() {
  return new Promise(resolve => {
    if (!server) {
      throw new Error('Server is not yet started.');
    }

    server.close(resolve);
  });
}
