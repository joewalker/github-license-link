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

import expect from 'expect';
import { testSetup, testCleanup, sendHookShot, mockGithub } from './utils';
import { getPullRequestsForUser, hasUserUnderstood, setUserUnderstood } from '../src/data';

describe('Test with a confirmed user', () => {
  beforeEach(testSetup);
  afterEach(testCleanup);

  it('Creating a pull request doesn\'t trigger a comment', async function() {
    expect(await hasUserUnderstood('newuser1', 'testrepo1', 'testowner1')).toBe(false);
    await setUserUnderstood('newuser1', 'testrepo1', 'testowner1');
    expect(await hasUserUnderstood('newuser1', 'testrepo1', 'testowner1')).toBe(true);

    // Send pull request notification
    await sendHookShot('pull_request', 'unconfirmed-create-pr-1.json');

    // Shouldn't have added the PR to the list of awaiting requests
    const prs = await getPullRequestsForUser('newuser1', 'testrepo1', 'testowner1');
    expect(prs).toEqual([]);

    // Shouldn't have posted a comment
    expect(mockGithub.pullRequests.createComment).toNotHaveBeenCalled();
  });
});
