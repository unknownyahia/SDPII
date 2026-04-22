#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { generateSeedData, manifest } = require('./seed-discovery-data.cjs');

const FIREBASE_CONFIGSTORE_PATH = path.join(
  os.homedir(),
  '.config',
  'configstore',
  'firebase-tools.json'
);
const FIRESTORE_BATCH_LIMIT = 400;
const DEFAULT_PROJECT_ID = manifest.projectId;
let cachedAccessToken = null;

function parseArgs(argv) {
  const args = {
    project: DEFAULT_PROJECT_ID,
  };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--project') {
      args.project = argv[index + 1] || DEFAULT_PROJECT_ID;
      index += 1;
    }
  }

  return args;
}

function loadFirebaseToolsConfig() {
  if (!fs.existsSync(FIREBASE_CONFIGSTORE_PATH)) {
    throw new Error(
      'firebase-tools config was not found. Run "npx firebase-tools login" first.'
    );
  }

  return JSON.parse(fs.readFileSync(FIREBASE_CONFIGSTORE_PATH, 'utf8'));
}

function refreshFirebaseLogin() {
  execFileSync('npx', ['firebase-tools', 'projects:list', '--json'], {
    stdio: 'ignore',
  });
}

function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  refreshFirebaseLogin();
  const config = loadFirebaseToolsConfig();
  const accessToken = config.tokens?.access_token;

  if (!accessToken) {
    throw new Error(
      'Unable to find a Firebase access token. Run "npx firebase-tools login" again.'
    );
  }

  cachedAccessToken = accessToken;
  return cachedAccessToken;
}

function encodeValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  throw new Error(`Unsupported Firestore value for hero sync: ${typeof value}`);
}

async function commitWrites(projectId, writes) {
  const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const accessToken = getAccessToken();

  for (let index = 0; index < writes.length; index += FIRESTORE_BATCH_LIMIT) {
    const slice = writes.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writes: slice.map(write => ({
          update: {
            name: `projects/${projectId}/databases/(default)/documents/${write.path}`,
            fields: {
              heroImageUrl: encodeValue(write.heroImageUrl),
            },
          },
          updateMask: {
            fieldPaths: ['heroImageUrl'],
          },
          currentDocument: {
            exists: true,
          },
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update post hero images (${response.status}): ${await response.text()}`
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedData = generateSeedData();
  const writes = seedData.posts.map(post => ({
    path: `posts/${post.id}`,
    heroImageUrl: post.heroImageUrl ?? null,
  }));

  await commitWrites(args.project, writes);

  const withHero = seedData.posts.filter(post => post.heroImageUrl).length;

  console.log(
    JSON.stringify(
      {
        project: args.project,
        updatedPosts: writes.length,
        postsWithHeroImages: withHero,
        heroCoverageShare: Number(((withHero / writes.length) * 100).toFixed(1)),
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
