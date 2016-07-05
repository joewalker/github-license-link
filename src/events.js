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

import { hasUserUnderstood, addPullRequest, getMessageForRepo,
         getPullRequestsForUser, setUserUnderstood } from './data';

async function shouldIgnoreUser(github, user, repo, owner) {
  if (user === owner) {
    return true;
  }

  if (await hasUserUnderstood(user, repo, owner)) {
    return true;
  }

  const orgs = await github.orgs.getForUser({ user });
  for (const org of orgs) {
    if (org.login === owner) {
      return true;
    }
  }

  return false;
}

// Each property is an event sent through Github's webhook API
export default {
  async pull_request(payload, github) {
    if (payload.action !== 'opened') {
      return;
    }

    const user = payload.pull_request.user.login;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const pr = payload.pull_request.number;

    if (await shouldIgnoreUser(github, user, repo, owner)) {
      // If the user has already agreed then ignore this pull request
      return;
    }

    console.log(`Saw a new user ${user} open a pull request.`);

    // Otherwise comment and add the PR to the list for this repo
    const message = await getMessageForRepo(owner, repo, 'response', { user });
    await github.issues.createComment({
      user: owner,
      repo,
      number: pr,
      body: message,
    });

    await addPullRequest(user, repo, owner, pr);
  },

  // For comment purposes pull requests are treated like issues
  async issue_comment(payload, github) {
    if (payload.action !== 'created') {
      return;
    }

    const user = payload.issue.user.login;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const pr = payload.issue.number;

    console.log(`Saw comment on #${pr} by ${payload.comment.user.login}`);

    if (payload.comment.user.login !== user) {
      return;
    }

    if (await shouldIgnoreUser(github, user, repo, owner)) {
      // If the user has already agreed then ignore this comment
      return;
    }

    const prs = await getPullRequestsForUser(user, repo, owner);
    if (prs.indexOf(pr) < 0) {
      // This isn't a PR that we've commented on
      return;
    }

    if (payload.comment.body.match(/\bOK\b/)) {
      await setUserUnderstood(user, repo, owner);
    }
  },
};
