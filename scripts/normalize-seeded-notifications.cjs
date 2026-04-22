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
const MAX_NOTIFICATIONS_PER_USER = 24;
const MAX_NOTIFICATIONS_PER_TYPE = 12;
const MAX_NOTIFICATIONS_PER_ACTOR_TYPE = 2;
const MAX_NOTIFICATIONS_PER_POST_TYPE = 2;
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

function decodeValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('nullValue' in value) {
    return null;
  }

  if ('stringValue' in value) {
    return value.stringValue;
  }

  if ('booleanValue' in value) {
    return value.booleanValue;
  }

  if ('integerValue' in value) {
    return Number(value.integerValue);
  }

  if ('doubleValue' in value) {
    return value.doubleValue;
  }

  if ('timestampValue' in value) {
    return value.timestampValue;
  }

  if ('arrayValue' in value) {
    return (value.arrayValue.values || []).map(decodeValue);
  }

  if ('mapValue' in value) {
    return decodeFields(value.mapValue.fields || {});
  }

  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])
  );
}

function getTimestampMs(value, fallbackValue) {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  if (typeof fallbackValue === 'string') {
    const parsed = new Date(fallbackValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  return 0;
}

async function listDocuments(projectId, collectionPath) {
  const accessToken = getAccessToken();
  const documents = [];
  let pageToken = null;

  do {
    const params = new URLSearchParams({ pageSize: '500' });
    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to list ${collectionPath} (${response.status}): ${await response.text()}`
      );
    }

    const payload = await response.json();
    documents.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || null;
  } while (pageToken);

  return documents;
}

async function commitDeletes(projectId, documentNames) {
  for (let index = 0; index < documentNames.length; index += FIRESTORE_BATCH_LIMIT) {
    const batch = documentNames.slice(index, index + FIRESTORE_BATCH_LIMIT);
    const accessToken = getAccessToken();

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: batch.map(name => ({ delete: name })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to delete notifications (${response.status}): ${await response.text()}`
      );
    }
  }
}

function selectNotificationsToKeep(documents) {
  const notifications = documents
    .map(document => ({
      name: document.name,
      id: document.name.split('/').pop(),
      data: decodeFields(document.fields || {}),
      createTime: document.createTime,
    }))
    .sort(
      (left, right) =>
        getTimestampMs(right.data.createdAt, right.createTime) -
        getTimestampMs(left.data.createdAt, left.createTime)
    );

  const keep = [];
  const actorTypeCounts = new Map();
  const postTypeCounts = new Map();
  const typeCounts = new Map();

  notifications.forEach(notification => {
    const type = notification.data.type || 'unknown';
    const actorTypeKey = `${type}:${notification.data.actorUserId || 'unknown'}`;
    const postTypeKey = `${type}:${notification.data.postId || 'unknown'}`;
    const nextTypeCount = typeCounts.get(type) || 0;
    const nextActorTypeCount = actorTypeCounts.get(actorTypeKey) || 0;
    const nextPostTypeCount = postTypeCounts.get(postTypeKey) || 0;

    if (
      keep.length < MAX_NOTIFICATIONS_PER_USER &&
      nextTypeCount < MAX_NOTIFICATIONS_PER_TYPE &&
      nextActorTypeCount < MAX_NOTIFICATIONS_PER_ACTOR_TYPE &&
      nextPostTypeCount < MAX_NOTIFICATIONS_PER_POST_TYPE
    ) {
      keep.push(notification);
      typeCounts.set(type, nextTypeCount + 1);
      actorTypeCounts.set(actorTypeKey, nextActorTypeCount + 1);
      postTypeCounts.set(postTypeKey, nextPostTypeCount + 1);
    }
  });

  const keepNames = new Set(keep.map(notification => notification.name));
  const deletes = notifications
    .filter(notification => !keepNames.has(notification.name))
    .map(notification => notification.name);

  return {
    total: notifications.length,
    kept: keep.length,
    deleted: deletes.length,
    deletes,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedData = generateSeedData();
  const seededUserIds = seedData.users.map(user => user.id);

  const summary = [];

  for (const userId of seededUserIds) {
    const documents = await listDocuments(args.project, `users/${userId}/notifications`);
    if (documents.length === 0) {
      continue;
    }

    const selection = selectNotificationsToKeep(documents);
    if (selection.deleted > 0) {
      await commitDeletes(args.project, selection.deletes);
    }

    summary.push({
      userId,
      total: selection.total,
      kept: selection.kept,
      deleted: selection.deleted,
    });
  }

  console.log(
    JSON.stringify(
      {
        project: args.project,
        seededUsers: seededUserIds.length,
        normalizedUsers: summary.length,
        summary,
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
