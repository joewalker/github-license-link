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

import path from 'path';
import fs from 'fs-promise';
import httpRequest from 'request-promise';
import expect, { createSpy } from 'expect';
import { startServer, stopServer } from '../src/server';
import { resetDatabase } from '../src/data';
import events from '../src/events';

const testPort = 64895;
process.env.PORT = testPort + 1;

const hookshotdir = path.join(__dirname, 'fixtures', 'hookshots');

export const mockGithub = {
  pullRequests: {
    createComment: createSpy().andReturn(Promise.resolve()),
  },
};

export async function testSetup() {
  await resetDatabase();
  await startServer(mockGithub);
}

export async function testCleanup() {
  await stopServer();
  await resetDatabase();
  mockGithub.pullRequests.createComment.reset();
}

export async function sendHookShot(event, file) {
  const filename = path.join(hookshotdir, file);
  const json = await fs.readFile(filename);

  const result = await httpRequest.post(`http://localhost:${process.env.PORT}/github`, {
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': event,
    },
    body: json,
  });

  expect(result).toBe('OK');
}

export async function sendEvent(event, file) {
  const filename = path.join(hookshotdir, file);
  const json = JSON.parse(await fs.readFile(filename));

  await events[event](json);
}
