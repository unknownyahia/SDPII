import { awardXpIfNotExists } from '../repositories/gamificationRepository';

const XP_RULES = {
  postCreated: 10,
  commentCreated: 4,
  likeReceived: 2,
} as const;

export async function awardPostCreationXp(
  userId: string | null | undefined,
  postId: string
) {
  if (!userId || !postId) {
    return;
  }

  try {
    await awardXpIfNotExists({
      userId,
      eventId: `post_created_${postId}`,
      points: XP_RULES.postCreated,
      type: 'post_created',
    });
  } catch {
    return;
  }
}

export async function awardCommentCreationXp(
  userId: string | null | undefined,
  commentId: string
) {
  if (!userId || !commentId) {
    return;
  }

  try {
    await awardXpIfNotExists({
      userId,
      eventId: `comment_created_${commentId}`,
      points: XP_RULES.commentCreated,
      type: 'comment_created',
    });
  } catch {
    return;
  }
}

export async function awardLikeReceivedXp(input: {
  recipientUserId: string | null | undefined;
  actorUserId: string | null | undefined;
  postId: string;
}) {
  if (!input.recipientUserId || !input.actorUserId || !input.postId) {
    return;
  }

  if (input.recipientUserId === input.actorUserId) {
    return;
  }

  try {
    await awardXpIfNotExists({
      userId: input.recipientUserId,
      eventId: `post_liked_received_${input.postId}_${input.actorUserId}`,
      points: XP_RULES.likeReceived,
      type: 'post_liked_received',
    });
  } catch {
    return;
  }
}
