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

import { MongoClient } from 'mongodb';
import fs from 'fs-promise';
import path from 'path';
import expand from 'template-string';

const TEMPLATE_BASE = path.join(__dirname, '..', 'templates');

function withDB(callback) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
        if (err) {
          reject(err);
          return;
        }

        callback(db, ...args).then(result => {
          db.close();
          resolve(result);
        }, result => {
          db.close();
          reject(result);
        });
      });
    });
  };
}

export const hasUserUnderstood = withDB(async function(db, user, repo, owner) {
  const collection = db.collection('users');

  const doc = await collection.findOne({ user, repo, owner });

  if (doc) {
    return doc.understood;
  }

  return false;
});

export const addPullRequest = withDB(async function(db, user, repo, owner, pr) {
  const collection = db.collection('users');

  await collection.updateOne(
    { user, repo, owner },
    {
      $addToSet: { pr },
      $setOnInsert: { understood: false },
    },
    { upsert: true }
  );
});

export const getPullRequestsForUser = withDB(async function(db, user, repo, owner) {
  const collection = db.collection('users');

  const doc = await collection.findOne({ user, repo, owner });

  if (doc) {
    return doc.pr;
  }

  return [];
});

export const setUserUnderstood = withDB(async function(db, user, repo, owner) {
  const collection = db.collection('users');

  await collection.updateOne({ user, repo, owner }, { $set: { understood: true } });
});

export const resetDatabase = withDB(async function(db) {
  await db.dropDatabase();
});

async function getTemplateDirForRepo(owner, repo) {
  try {
    const templates = path.join(TEMPLATE_BASE, owner, repo);
    const stats = await fs.stat(templates);
    if (stats.isDirectory()) {
      return templates;
    }
  } catch (e) {
    // If we can't access a path then it isn't the right directory.
  }

  try {
    const templates = path.join(TEMPLATE_BASE, owner);
    const stats = await fs.stat(templates);
    if (stats.isDirectory()) {
      return templates;
    }
  } catch (e) {
    // If we can't access a path then it isn't the right directory.
  }

  return TEMPLATE_BASE;
}

export async function getMessageForRepo(owner, repository, template, vars) {
  const templates = await getTemplateDirForRepo(owner, repository);
  const file = path.join(templates, template);

  const contents = await fs.readFile(file, 'utf8');
  return expand(contents, {
    owner,
    repository,
    ...vars,
  });
}
