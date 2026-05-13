const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  collectionGroup,
  query,
  where,
} = require('firebase/firestore');

const PROJECT_ID = 'spots-backend-test';
const FIRESTORE_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT || 8080);

const fft = require('../functions/node_modules/firebase-functions-test')({
  projectId: PROJECT_ID,
});
const functionsModule = require('../functions/index.js');

let testEnv;

function profileData(id, overrides = {}) {
  return {
    id,
    email: `${id}@example.com`,
    role: 'user',
    xp: 0,
    badgeKeys: [],
    username: id,
    bio: '',
    language: 'en',
    privacyMode: false,
    ...overrides,
  };
}

function subscriptionData(userId, overrides = {}) {
  return {
    userId,
    planLevel: 'free',
    status: 'active',
    ...overrides,
  };
}

async function seedProfile(userId, overrides = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', userId), profileData(userId, overrides));
  });
}

async function seedSubscription(userId, overrides = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(
      doc(db, 'users', userId, 'subscriptions', 'current'),
      subscriptionData(userId, overrides)
    );
  });
}

async function seedPost(postId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'posts', postId), {
      userId: data.userId,
      title: data.title ?? 'Seed post',
      text: data.text,
      category: data.category,
      lat: data.lat,
      lng: data.lng,
      locationName: data.locationName ?? null,
      createdAt: new Date(),
    });
  });
}

async function seedComment(postId, commentId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'posts', postId, 'comments', commentId), {
      userId: data.userId,
      authorLabel: data.authorLabel,
      text: data.text,
      createdAt: new Date(),
    });
  });
}

async function seedReport(reportId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'reports', reportId), {
      reporterUserId: data.reporterUserId,
      targetType: data.targetType,
      targetId: data.targetId,
      targetPostId: data.targetPostId ?? null,
      reason: data.reason,
      note: data.note ?? '',
      status: data.status ?? 'open',
      createdAt: new Date(),
    });
  });
}

async function getDocData(docPath) {
  let result;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const snapshot = await getDoc(doc(db, ...docPath));
    result = snapshot.exists() ? snapshot.data() : null;
  });
  return result;
}

async function getCollectionSize(collectionPath, constraints = []) {
  let result;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const collectionRef = collection(db, ...collectionPath);
    const snapshot = constraints.length > 0 ?
      await getDocs(query(collectionRef, ...constraints)) :
      await getDocs(collectionRef);
    result = snapshot.size;
  });
  return result;
}

async function waitFor(assertion, {timeoutMs = 7000, intervalMs = 150} = {}) {
  const start = Date.now();
  while (true) {
    try {
      return await assertion();
    } catch (error) {
      if (Date.now() - start > timeoutMs) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: FIRESTORE_PORT,
      rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8'),
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
  fft.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

test('rules: user can edit own profile but not another user profile', async () => {
  await seedProfile('alice');
  await seedProfile('bob');

  const aliceDb = testEnv.authenticatedContext('alice').firestore();

  await assertSucceeds(
    updateDoc(doc(aliceDb, 'users', 'alice'), {
      username: 'alice-updated',
      updatedAt: new Date(),
    })
  );

  await assertSucceeds(
    updateDoc(doc(aliceDb, 'users', 'alice'), {
      bio: 'Updated runtime bio',
      language: 'ar',
      privacyMode: true,
      emailNotifications: false,
      marketingEmails: true,
      updatedAt: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'users', 'bob'), {
      username: 'hacked',
      updatedAt: new Date(),
    })
  );
});

test('rules: app collection group reads match Explore and analytics usage', async () => {
  await seedProfile('alice');
  await seedProfile('admin', {role: 'admin'});
  await seedProfile('owner');
  await seedPost('post-1', {
    userId: 'owner',
    text: 'Seed post',
    category: 'fishing',
    lat: 25.2854,
    lng: 51.531,
  });
  await seedComment('post-1', 'comment-1', {
    userId: 'alice',
    authorLabel: 'alice',
    text: 'Nice spot',
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'posts', 'post-1', 'reactions', 'alice'), {
      postId: 'post-1',
      userId: 'alice',
      type: 'like',
      createdAt: new Date(),
    });
    await setDoc(doc(db, 'users', 'owner', 'notifications', 'note-1'), {
      recipientUserId: 'owner',
      actorUserId: 'alice',
      actorLabel: 'alice',
      type: 'like_on_post',
      postId: 'post-1',
      commentId: null,
      message: 'alice liked your post.',
      isRead: false,
      createdAt: new Date(),
      readAt: null,
    });
  });

  const aliceDb = testEnv.authenticatedContext('alice').firestore();
  const adminDb = testEnv.authenticatedContext('admin').firestore();

  await assertSucceeds(getDocs(collectionGroup(aliceDb, 'comments')));
  await assertSucceeds(getDocs(collectionGroup(aliceDb, 'reactions')));
  await assertFails(getDocs(collectionGroup(aliceDb, 'notifications')));
  await assertSucceeds(getDocs(collectionGroup(adminDb, 'notifications')));
});

test('rules: non-admin cannot change role or plan', async () => {
  await seedProfile('alice');
  await seedProfile('bob');
  await seedSubscription('bob');

  const aliceDb = testEnv.authenticatedContext('alice').firestore();

  await assertFails(
    updateDoc(doc(aliceDb, 'users', 'bob'), {
      role: 'admin',
      updatedAt: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'users', 'bob', 'subscriptions', 'current'), {
      planLevel: 'organization_premium',
      status: 'active',
      updatedAt: new Date(),
    })
  );
});

test('rules: user can create own post, comment, like, and favorite', async () => {
  await seedProfile('alice');
  await seedProfile('owner');
  await seedPost('post-1', {
    userId: 'owner',
    text: 'Seed post',
    category: 'fishing',
    lat: 25.2854,
    lng: 51.531,
  });

  const aliceDb = testEnv.authenticatedContext('alice').firestore();

  await assertSucceeds(
    addDoc(collection(aliceDb, 'posts'), {
      userId: 'alice',
      title: 'My first post',
      text: 'My first post',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      createdAt: new Date(),
    })
  );

  await assertFails(
    addDoc(collection(aliceDb, 'posts'), {
      userId: 'alice',
      text: 'Missing title should fail',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      createdAt: new Date(),
    })
  );

  await assertFails(
    addDoc(collection(aliceDb, 'posts'), {
      userId: 'alice',
      title: 'x'.repeat(81),
      text: 'Too long title should fail',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      createdAt: new Date(),
    })
  );

  await assertSucceeds(
    addDoc(collection(aliceDb, 'posts', 'post-1', 'comments'), {
      userId: 'alice',
      authorLabel: 'alice',
      text: 'Nice spot',
      createdAt: new Date(),
    })
  );

  await assertSucceeds(
    setDoc(doc(aliceDb, 'posts', 'post-1', 'reactions', 'alice'), {
      postId: 'post-1',
      userId: 'alice',
      type: 'like',
      createdAt: new Date(),
    })
  );

  await assertSucceeds(
    setDoc(doc(aliceDb, 'users', 'alice', 'favorites', 'post-1'), {
      userId: 'alice',
      postId: 'post-1',
      createdAt: new Date(),
    })
  );
});

test('rules: non-admin cannot update report status or moderation flags', async () => {
  await seedProfile('alice');
  await seedProfile('owner');
  await seedPost('post-1', {
    userId: 'owner',
    text: 'Moderate me',
    category: 'event',
    lat: 25.28,
    lng: 51.53,
  });
  await seedComment('post-1', 'comment-1', {
    userId: 'owner',
    authorLabel: 'owner',
    text: 'comment body',
  });
  await seedReport('report-1', {
    reporterUserId: 'alice',
    targetType: 'post',
    targetId: 'post-1',
    reason: 'spam',
    status: 'open',
  });

  const aliceDb = testEnv.authenticatedContext('alice').firestore();

  await assertFails(
    updateDoc(doc(aliceDb, 'reports', 'report-1'), {
      status: 'reviewed',
      updatedAt: new Date(),
    })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'posts', 'post-1'), {
      isHidden: true,
      moderationStatus: 'hidden',
    })
  );

  await assertFails(
    updateDoc(doc(aliceDb, 'posts', 'post-1', 'comments', 'comment-1'), {
      isHidden: true,
      moderationStatus: 'hidden',
    })
  );
});

test('rules: client cannot create notifications directly or create events directly', async () => {
  await seedProfile('alice');
  await seedProfile('owner');
  await seedPost('post-1', {
    userId: 'owner',
    text: 'For notifications',
    category: 'fishing',
    lat: 25.28,
    lng: 51.53,
  });

  const aliceDb = testEnv.authenticatedContext('alice').firestore();

  await assertFails(
    addDoc(collection(aliceDb, 'users', 'owner', 'notifications'), {
      recipientUserId: 'owner',
      actorUserId: 'alice',
      actorLabel: 'alice',
      type: 'like_on_post',
      postId: 'post-1',
      commentId: null,
      message: 'alice liked your post.',
      isRead: false,
      createdAt: new Date(),
      readAt: null,
    })
  );

  await assertFails(
    addDoc(collection(aliceDb, 'events'), {
      title: 'Bypassed event',
      description: 'Should fail',
      category: 'event',
      locationName: 'Doha',
      lat: 25.28,
      lng: 51.53,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      createdBy: 'alice',
      isPromoted: true,
      status: 'active',
      createdAt: new Date(),
    })
  );
});

test('backend: post creation awards post XP', async () => {
  await seedProfile('poster');

  const posterDb = testEnv.authenticatedContext('poster').firestore();
  await addDoc(collection(posterDb, 'posts'), {
    userId: 'poster',
    title: 'Backend XP post',
    text: 'Backend XP post',
    category: 'fishing',
    lat: 25.28,
    lng: 51.53,
    locationName: 'Doha',
    createdAt: new Date(),
  });

  await waitFor(async () => {
    const profile = await getDocData(['users', 'poster']);
    assert.equal(profile.xp, 10);
  });
});

test('backend: comment creation awards comment XP and creates notification', async () => {
  await seedProfile('owner');
  await seedProfile('commenter');
  await seedPost('post-1', {
    userId: 'owner',
    text: 'Comment on me',
    category: 'event',
    lat: 25.28,
    lng: 51.53,
  });

  const commenterDb = testEnv.authenticatedContext('commenter').firestore();
  await addDoc(collection(commenterDb, 'posts', 'post-1', 'comments'), {
    userId: 'commenter',
    authorLabel: 'commenter',
    text: 'Looks good',
    createdAt: new Date(),
  });

  await waitFor(async () => {
    const profile = await getDocData(['users', 'commenter']);
    assert.equal(profile.xp, 4);
  });

  await waitFor(async () => {
    const count = await getCollectionSize(['users', 'owner', 'notifications']);
    assert.equal(count, 1);
  });
});

test('backend: like creation awards like-received XP and creates notification', async () => {
  await seedPost('post-1', {
    userId: 'owner',
    text: 'Like me',
    category: 'weather',
    lat: 25.28,
    lng: 51.53,
  });
  await seedProfile('owner');
  await seedProfile('liker');

  const likerDb = testEnv.authenticatedContext('liker').firestore();
  await setDoc(doc(likerDb, 'posts', 'post-1', 'reactions', 'liker'), {
    postId: 'post-1',
    userId: 'liker',
    type: 'like',
    createdAt: new Date(),
  });

  await waitFor(async () => {
    const profile = await getDocData(['users', 'owner']);
    assert.equal(profile.xp, 2);
  });

  await waitFor(async () => {
    const count = await getCollectionSize(
      ['users', 'owner', 'notifications'],
      [where('type', '==', 'like_on_post')]
    );
    assert.equal(count, 1);
  });
});

test('backend: createPromotedEvent enforces auth, role, plan, and quota', async () => {
  const wrapped = fft.wrap(functionsModule.createPromotedEvent);

  await assert.rejects(
    wrapped({
      title: 'No auth',
      description: 'No auth',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
    }),
    /Authentication is required/
  );

  await seedProfile('org-user', {role: 'organization'});
  await seedSubscription('org-user', {
    planLevel: 'organization_basic',
    status: 'active',
  });

  const start = new Date(Date.now() + 3600000).toISOString();
  const end = new Date(Date.now() + 7200000).toISOString();

  const result = await wrapped({
    title: 'Trusted event',
    description: 'Created by callable',
    category: 'event',
    lat: 25.28,
    lng: 51.53,
    locationName: 'Doha',
    startTime: start,
    endTime: end,
  }, {
    auth: {uid: 'org-user'},
  });

  assert.ok(result.eventId);

  await assert.rejects(
    wrapped({
      title: 'Quota event',
      description: 'Second active event',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      startTime: start,
      endTime: end,
    }, {
      auth: {uid: 'org-user'},
    }),
    /allows 1 active promoted event/
  );

  await seedProfile('free-org', {role: 'organization'});
  await seedSubscription('free-org', {
    planLevel: 'free',
    status: 'active',
  });

  await assert.rejects(
    wrapped({
      title: 'Blocked plan',
      description: 'Should fail',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      startTime: start,
      endTime: end,
    }, {
      auth: {uid: 'free-org'},
    }),
    /does not allow promoted event creation/
  );

  await seedProfile('plain-user', {role: 'user'});
  await seedSubscription('plain-user', {
    planLevel: 'organization_premium',
    status: 'active',
  });

  await assert.rejects(
    wrapped({
      title: 'Wrong role',
      description: 'Should fail',
      category: 'event',
      lat: 25.28,
      lng: 51.53,
      locationName: 'Doha',
      startTime: start,
      endTime: end,
    }, {
      auth: {uid: 'plain-user'},
    }),
    /Only organization accounts/
  );
});
