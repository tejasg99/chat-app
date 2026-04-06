import { Types } from "mongoose";
import { Message } from "../models/message.model.ts";
import type { IMessage } from "../types/index.ts";

export const createMessage = async (data: Partial<IMessage>): Promise<IMessage> => {
  const message = new Message(data);
  const saved = await message.save();

  // Populate sender info before returning for real-time broadcast
  return saved.populate("sender", "name avatar");
};

export const findMessageById = async (messageId: string): Promise<IMessage | null> =>
  Message.findById(messageId).lean<IMessage>().exec();

// ─── Cursor-based paginated fetch ─────────────────────────────────────────────
// How it works:
//   1. First load  → no cursor, fetch the N most recent messages
//   2. Scroll up   → cursor = _id of the oldest message in current view
//                    fetch N messages older than that cursor
//   3. New message → appended in real time via Socket.io, no refetch needed
//
// We always return messages sorted newest-first from DB.
// The client reverses the array to render oldest-at-top.
export const findMessagesByChat = async (
  chatId: string,
  limit: number,
  cursor?: string,
): Promise<IMessage[]> => {
  const filter: Record<string, unknown> = {
    chat: chatId,
    isDeleted: false,
  };

  if (cursor) {
    // Only fetch messages whose _id is LESS THAN the cursor
    // MongoDB ObjectIds are sortable by creation time, so this
    // gives us all messages created before the cursor message
    filter._id = { $lt: new Types.ObjectId(cursor) };
  }

  return Message.find(filter)
    .populate("sender", "name avatar")
    .populate("replyTo", "content sender type isDeleted")
    .sort({ _id: -1 }) // Newest first — client reverses for display
    .limit(limit)
    .lean<IMessage[]>()
    .exec();
};

// ─── Count total messages in a chat (for initial load metadata) ───────────────
export const countMessagesByChat = async (chatId: string): Promise<number> =>
  Message.countDocuments({ chat: chatId, isDeleted: false }).exec();

export const softDeleteMessage = async (
  messageId: string,
  userId: string,
): Promise<IMessage | null> =>
  Message.findOneAndUpdate(
    { _id: messageId, sender: userId },
    {
      isDeleted: true,
      content: "This message was deleted",
    },
    { new: true },
  )
    .lean<IMessage>()
    .exec();

export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  await Message.updateMany(
    {
      chat: chatId,
      readBy: { $ne: userId },
      sender: { $ne: userId },
      isDeleted: false,
    },
    { $addToSet: { readBy: userId } },
  ).exec();
};
