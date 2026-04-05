import { Message } from "../models/message.model.ts";
import type { IMessage } from "../types/index.ts";

// ─── Toggle logic ─────────────────────────────────────────────────────────────
// - If the user hasn't reacted with this emoji → add them to reactedBy
// - If the user already reacted with this emoji → remove them
// - If reactedBy becomes empty → remove the entire reaction entry

export const toggleReaction = async (
  messageId: string,
  userId: string,
  emoji: string,
): Promise<IMessage | null> => {
  // First check if the user already reacted with this emoji
  const message = await Message.findById(messageId).exec();
  if (!message) return null;

  const existingReaction = message.reactions.find((r) => r.emoji === emoji);
  const alreadyReacted = existingReaction?.reactedBy.map((id) => id.toString()).includes(userId);

  let updated: IMessage | null;

  if (alreadyReacted) {
    // Remove user from this emoji's reactedBy array
    // If it becomes empty, $pull removes the entire reaction subdoc
    updated = await Message.findByIdAndUpdate(
      messageId,
      {
        $pull: {
          reactions: { emoji, reactedBy: { $size: 1, $all: [userId] } },
        },
      },
      { new: true },
    )
      .lean<IMessage>()
      .exec();

    // If the pull didn't remove the subdoc (more users reacted), just remove this user
    if (
      updated?.reactions
        .find((r) => r.emoji === emoji)
        ?.reactedBy.map((id) => id.toString())
        .includes(userId)
    ) {
      updated = await Message.findOneAndUpdate(
        { _id: messageId, "reactions.emoji": emoji },
        { $pull: { "reactions.$.reactedBy": userId } },
        { new: true },
      )
        .lean<IMessage>()
        .exec();
    }
  } else if (existingReaction) {
    // Emoji exists — just add this user to reactedBy
    updated = await Message.findOneAndUpdate(
      { _id: messageId, "reactions.emoji": emoji },
      { $addToSet: { "reactions.$.reactedBy": userId } },
      { new: true },
    )
      .lean<IMessage>()
      .exec();
  } else {
    // New emoji reaction — push a new reaction entry
    updated = await Message.findByIdAndUpdate(
      messageId,
      {
        $push: {
          reactions: { emoji, reactedBy: [userId] },
        },
      },
      { new: true },
    )
      .lean<IMessage>()
      .exec();
  }

  return updated;
};
