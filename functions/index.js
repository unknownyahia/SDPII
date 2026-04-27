// functions/index.js
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();

const db = admin.firestore();
const DEFAULT_FUNCTION_SERVICE_ACCOUNT = "spots-42d51@appspot.gserviceaccount.com";

function getOpenAIClient() {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "OpenAI configuration is missing."
    );
  }

  return new OpenAI({apiKey});
}

function getOpenAIErrorCode(error) {
  return error?.code || error?.error?.code || error?.error?.type || "";
}

function getOpenAIErrorMessage(error) {
  return error?.message || error?.error?.message || "";
}

function logOpenAIError(error) {
  console.error("OpenAI error:", {
    name: error?.name || null,
    status: error?.status || null,
    code: getOpenAIErrorCode(error) || null,
    message: getOpenAIErrorMessage(error) || "Unknown OpenAI error.",
  });
}

const XP_RULES = {
  postCreated: 10,
  commentCreated: 4,
  likeReceived: 2,
};

const PLAN_LIMITS = {
  free: 0,
  organization_basic: 1,
  organization_premium: 5,
};

function getUserDocRef(userId) {
  return db.collection("users").doc(userId);
}

function getSubscriptionDocRef(userId) {
  return getUserDocRef(userId).collection("subscriptions").doc("current");
}

function getXpEventDocRef(userId, eventId) {
  return getUserDocRef(userId).collection("xpEvents").doc(eventId);
}

function getNotificationCollectionRef(userId) {
  return getUserDocRef(userId).collection("notifications");
}

async function awardXpIfNeeded(userId, eventId, points, type) {
  if (!userId || !eventId || !points) {
    return;
  }

  await db.runTransaction(async (transaction) => {
    const profileRef = getUserDocRef(userId);
    const xpEventRef = getXpEventDocRef(userId, eventId);

    const [profileSnap, xpEventSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(xpEventRef),
    ]);

    if (!profileSnap.exists || xpEventSnap.exists) {
      return;
    }

    const currentXp = typeof profileSnap.data().xp === "number" ?
      profileSnap.data().xp : 0;

    transaction.set(profileRef, {
      xp: currentXp + points,
      updatedAt: new Date(),
    }, {merge: true});

    transaction.set(xpEventRef, {
      type,
      points,
      createdAt: new Date(),
    });
  });
}

async function createCommentNotification(input) {
  if (!input.recipientUserId || !input.actorUserId) {
    return;
  }

  if (input.recipientUserId === input.actorUserId) {
    return;
  }

  await getNotificationCollectionRef(input.recipientUserId).add({
    recipientUserId: input.recipientUserId,
    actorUserId: input.actorUserId,
    actorLabel: input.actorLabel || "Someone",
    type: "comment_on_post",
    postId: input.postId,
    commentId: input.commentId || null,
    message: `${input.actorLabel || "Someone"} commented on your post.`,
    isRead: false,
    createdAt: new Date(),
    readAt: null,
  });
}

async function upsertLikeNotification(input) {
  if (!input.recipientUserId || !input.actorUserId) {
    return;
  }

  if (input.recipientUserId === input.actorUserId) {
    return;
  }

  const notificationId = [
    "like",
    input.recipientUserId,
    input.actorUserId,
    input.postId,
  ].join("_");

  await getNotificationCollectionRef(input.recipientUserId)
    .doc(notificationId)
    .set({
      recipientUserId: input.recipientUserId,
      actorUserId: input.actorUserId,
      actorLabel: input.actorLabel || "Someone",
      type: "like_on_post",
      postId: input.postId,
      commentId: null,
      message: `${input.actorLabel || "Someone"} liked your post.`,
      isRead: false,
      createdAt: new Date(),
      readAt: null,
    });
}

exports.onPostCreated = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).firestore
  .document("posts/{postId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() || {};
    const userId = typeof data.userId === "string" ? data.userId : null;

    if (!userId) {
      return null;
    }

    await awardXpIfNeeded(
      userId,
      `post_created_${context.params.postId}`,
      XP_RULES.postCreated,
      "post_created"
    );

    return null;
  });

exports.onCommentCreated = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).firestore
  .document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() || {};
    const actorUserId = typeof data.userId === "string" ? data.userId : null;
    const actorLabel = typeof data.authorLabel === "string" ?
      data.authorLabel : "Someone";

    if (!actorUserId) {
      return null;
    }

    const postSnap = await db.collection("posts").doc(context.params.postId).get();
    if (!postSnap.exists) {
      return null;
    }

    const postData = postSnap.data() || {};
    const recipientUserId = typeof postData.userId === "string" ?
      postData.userId : null;

    await Promise.all([
      awardXpIfNeeded(
        actorUserId,
        `comment_created_${context.params.commentId}`,
        XP_RULES.commentCreated,
        "comment_created"
      ),
      createCommentNotification({
        recipientUserId,
        actorUserId,
        actorLabel,
        postId: context.params.postId,
        commentId: context.params.commentId,
      }),
    ]);

    return null;
  });

exports.onReactionWritten = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).firestore
  .document("posts/{postId}/reactions/{userId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists || change.before.exists) {
      return null;
    }

    const data = change.after.data() || {};
    const actorUserId = typeof data.userId === "string" ? data.userId : null;
    if (!actorUserId) {
      return null;
    }

    const [postSnap, actorSnap] = await Promise.all([
      db.collection("posts").doc(context.params.postId).get(),
      getUserDocRef(actorUserId).get(),
    ]);

    if (!postSnap.exists) {
      return null;
    }

    const postData = postSnap.data() || {};
    const recipientUserId = typeof postData.userId === "string" ?
      postData.userId : null;
    const actorData = actorSnap.data() || {};
    const actorLabel = typeof actorData.username === "string" &&
      actorData.username.trim() ?
      actorData.username :
      typeof actorData.email === "string" && actorData.email ?
        actorData.email :
        "Someone";

    await Promise.all([
      awardXpIfNeeded(
        recipientUserId,
        `post_liked_received_${context.params.postId}_${actorUserId}`,
        XP_RULES.likeReceived,
        "post_liked_received"
      ),
      upsertLikeNotification({
        recipientUserId,
        actorUserId,
        actorLabel,
        postId: context.params.postId,
      }),
    ]);

    return null;
  });

exports.createPromotedEvent = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required."
    );
  }

  const userId = context.auth.uid;
  const title = typeof data?.title === "string" ? data.title.trim() : "";
  const description = typeof data?.description === "string" ?
    data.description.trim() : "";
  const category = data?.category;
  const lat = data?.lat;
  const lng = data?.lng;
  const locationName = typeof data?.locationName === "string" &&
    data.locationName.trim() ?
    data.locationName.trim() : null;
  const startTime = typeof data?.startTime === "string" ? data.startTime : "";
  const endTime = typeof data?.endTime === "string" ? data.endTime : "";

  if (!title || !description) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Title and description are required."
    );
  }

  if (!["fishing", "event", "sighting", "weather"].includes(category)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid category is required."
    );
  }

  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Valid coordinates are required."
    );
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Start and end times must be valid, and end must be later than start."
    );
  }

  const [profileSnap, subscriptionSnap, activeEventsSnap] = await Promise.all([
    getUserDocRef(userId).get(),
    getSubscriptionDocRef(userId).get(),
    db.collection("events")
      .where("createdBy", "==", userId)
      .where("status", "==", "active")
      .where("isPromoted", "==", true)
      .get(),
  ]);

  if (!profileSnap.exists || profileSnap.data().role !== "organization") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only organization accounts can create promoted events."
    );
  }

  const subscription = subscriptionSnap.data() || {};
  const planLevel = subscription.planLevel || "free";
  const planStatus = subscription.status || "inactive";

  if (!["organization_basic", "organization_premium"].includes(planLevel)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Your plan does not allow promoted event creation."
    );
  }

  if (!["active", "trial"].includes(planStatus)) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Your plan is not currently active."
    );
  }

  const maxActiveEvents = PLAN_LIMITS[planLevel] || 0;
  if (activeEventsSnap.size >= maxActiveEvents) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      `Your plan allows ${maxActiveEvents} active promoted event` +
        `${maxActiveEvents === 1 ? "" : "s"}.`
    );
  }

  const eventRef = await db.collection("events").add({
    title,
    description,
    category,
    locationName,
    lat,
    lng,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    createdBy: userId,
    isPromoted: true,
    status: "active",
    createdAt: new Date(),
  });

  return {
    eventId: eventRef.id,
  };
});

// Callable function to summarize posts in an area
exports.summarizeArea = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required."
    );
  }

  const posts = data.posts || [];

  if (!Array.isArray(posts) || posts.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "posts must be a non-empty array"
    );
  }

  // Limit the number of posts to include in the prompt
  const limitedPosts = posts.slice(0, 20).filter((post) => {
    return (
      post &&
      typeof post.text === "string" &&
      post.text.trim().length > 0 &&
      post.text.length <= 280 &&
      (post.category === undefined ||
        post.category === null ||
        ["fishing", "event", "sighting", "weather"].includes(post.category))
    );
  });

  if (limitedPosts.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "No valid posts were provided."
    );
  }

  const joinedPosts = limitedPosts
    .map((p, i) => {
      const safeText = p.text.trim().replace(/\s+/g, " ").slice(0, 280);
      return `Post ${i + 1} (${p.category || "general"}): ${safeText}`;
    })
    .join("\n");

  const prompt = `
You are an assistant for a location-based app called Spots.
Summarize the following user activity updates in 2–3 concise sentences.
Highlight overall conditions, helpful patterns, and general advice.
Do not list each post separately; give one coherent summary.

${joinedPosts}
`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You summarize short user posts about local outdoor activities.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    const summary =
      response.choices?.[0]?.message?.content?.trim() ||
      "No summary generated.";

    return { summary };
  } catch (err) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }

    const openAIErrorCode = getOpenAIErrorCode(err);
    const openAIErrorMessage = getOpenAIErrorMessage(err).toLowerCase();

    logOpenAIError(err);

    if (
      openAIErrorCode === "insufficient_quota" ||
      openAIErrorMessage.includes("exceeded your current quota")
    ) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Area summary is temporarily unavailable because OpenAI quota is exhausted."
      );
    }

    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate summary"
    );
  }
});

exports.getLeaderboard = functions.runWith({
  serviceAccount: DEFAULT_FUNCTION_SERVICE_ACCOUNT,
}).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication is required."
    );
  }

  const requestedLimit = typeof data?.limit === "number" ? data.limit : 10;
  const safeLimit = Math.max(3, Math.min(25, requestedLimit));

  const snapshot = await db.collection("users")
    .orderBy("xp", "desc")
    .limit(safeLimit)
    .get();

  const entries = snapshot.docs.map((doc, index) => {
    const profile = doc.data() || {};
    const username = typeof profile.username === "string" &&
      profile.username.trim() ?
      profile.username.trim() : null;
    const email = typeof profile.email === "string" ? profile.email : null;
    const privacyMode = profile.privacyMode === true;

    return {
      userId: doc.id,
      rank: index + 1,
      displayName: privacyMode ?
        "Private Spots user" :
        username || email || "Spots user",
      xp: typeof profile.xp === "number" ? profile.xp : 0,
      role: typeof profile.role === "string" ? profile.role : "user",
      badgeCount: Array.isArray(profile.badgeKeys) ?
        profile.badgeKeys.length : 0,
      isCurrentUser: doc.id === context.auth.uid,
    };
  });

  return {entries};
});
