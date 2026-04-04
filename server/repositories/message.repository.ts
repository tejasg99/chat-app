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

export const findMessagesByChat = async (
  chatId: string,
  page: number,
  limit: number,
): Promise<IMessage[]> => {
  const skip = (page - 1) * limit;

  return Message.find({ chat: chatId, isDeleted: false })
    .populate("sender", "name avatar")
    .populate("replyTo", "content sender type")
    .sort({ createdAt: -1 }) // Newest first — client reverses for display
    .skip(skip)
    .limit(limit)
    .lean<IMessage[]>()
    .exec();
};

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
