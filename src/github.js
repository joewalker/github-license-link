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

import Client from 'github';
import thenify from 'thenify';

// Configure the default github API
const github = new Client({
  debug: true,
  headers: {
    // Turn on reaction support
    Accept: 'application/vnd.github.squirrel-girl-preview',
  },
});

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

// Expose only the methods we need but convert it to promise based
export default {
  pullRequests: {
    createComment: thenify(github.pullRequests.createComment),
  },
};
