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
import { getPullRequestsForUser, hasUserUnderstood } from '../src/data';

describe('Test with an unconfirmed user', () => {
  beforeEach(testSetup);
  afterEach(testCleanup);

  it('Creating a pull request triggers a comment', async function() {
    expect(await hasUserUnderstood('newuser1', 'testrepo1', 'testowner1')).toBe(false);

    let prs = await getPullRequestsForUser('newuser1', 'testrepo1', 'testowner1');
    expect(prs).toEqual([]);

    // Send pull request notification
    await sendHookShot('pull_request', 'unconfirmed-create-pr-1.json');

    // Should have added the PR to the list of awaiting requests
    prs = await getPullRequestsForUser('newuser1', 'testrepo1', 'testowner1');
    expect(prs).toEqual([1]);

    // Should have posted a comment
    expect(mockGithub.pullRequests.createComment).toHaveBeenCalledWith({
      user: 'testowner1',
      repo: 'testrepo1',
      number: 1,
      body: `This is a test response using newuser1, testowner1 and testrepo1.
`,
    });

    expect(await hasUserUnderstood('newuser1', 'testrepo1', 'testowner1')).toBe(false);

    // Send pull request notification
    await sendHookShot('pull_request', 'unconfirmed-create-pr-3.json');

    // Should have added the PR to the list of awaiting requests
    prs = await getPullRequestsForUser('newuser1', 'testrepo1', 'testowner1');
    expect(prs).toEqual([1, 3]);

    // Should have posted a comment
    expect(mockGithub.pullRequests.createComment).toHaveBeenCalledWith({
      user: 'testowner1',
      repo: 'testrepo1',
      number: 3,
      body: `This is a test response using newuser1, testowner1 and testrepo1.
`,
    });

    // User responds
    await sendHookShot('issue_comment', 'comment-create-pr-1.json');

    prs = await getPullRequestsForUser('newuser1', 'testrepo1', 'testowner1');
    expect(prs).toEqual([]);

    expect(await hasUserUnderstood('newuser1', 'testrepo1', 'testowner1')).toBe(true);
  });

  it('General comments for an org work', async function() {
    let prs = await getPullRequestsForUser('newuser1', 'testrepo2', 'testowner1');
    expect(prs).toEqual([]);

    // Send pull request notification
    await sendHookShot('pull_request', 'unconfirmed-create-pr-2.json');

    // Should have added the PR to the list of awaiting requests
    prs = await getPullRequestsForUser('newuser1', 'testrepo2', 'testowner1');
    expect(prs).toEqual([2]);

    // Should have posted a comment
    expect(mockGithub.pullRequests.createComment).toHaveBeenCalledWith({
      user: 'testowner1',
      repo: 'testrepo2',
      number: 2,
      body: 'This is a test of a general response for an org.',
    });
  });
});
