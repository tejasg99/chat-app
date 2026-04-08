import { Chat } from "../models/chat.model.ts";
import type { IChat } from "../types/index.ts";

export const findDirectChat = async (userAId: string, userBId: string): Promise<IChat | null> =>
  Chat.findOne({
    type: "direct",
    members: { $all: [userAId, userBId], $size: 2 },
  })
    .lean<IChat>()
    .exec();

export const findChatById = async (chatId: string): Promise<IChat | null> =>
  Chat.findById(chatId).lean<IChat>().exec();

export const findChatByIdWithMembers = async (chatId: string): Promise<IChat | null> =>
  Chat.findById(chatId)
    .populate("members", "name avatar isOnline lastSeen")
    .populate("lastMessage")
    .lean<IChat>()
    .exec();

export const findChatsByUserId = async (userId: string): Promise<IChat[]> =>
  Chat.find({ members: userId, isActive: true })
    .populate("members", "name avatar isOnline lastSeen")
    .populate("lastMessage")
    .sort({ updatedAt: -1 })
    .lean<IChat[]>()
    .exec();

export const createChat = async (data: Partial<IChat>): Promise<IChat> => {
  const chat = new Chat(data);
  return chat.save();
};

export const updateChatLastMessage = async (chatId: string, messageId: string): Promise<void> => {
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: messageId,
    updatedAt: new Date(),
  }).exec();
};

export const isChatMember = async (chatId: string, userId: string): Promise<boolean> => {
  const chat = await Chat.findOne({
    _id: chatId,
    members: userId,
    isActive: true,
  })
    .lean()
    .exec();
  return !!chat;
};

export const addMembersToGroup = async (
  chatId: string,
  memberIds: string[],
): Promise<IChat | null> =>
  Chat.findByIdAndUpdate(chatId, { $addToSet: { members: { $each: memberIds } } }, { new: true })
    .lean<IChat>()
    .exec();

export const removeMemberFromGroup = async (
  chatId: string,
  memberId: string,
): Promise<IChat | null> =>
  Chat.findByIdAndUpdate(chatId, { $pull: { members: memberId, admins: memberId } }, { new: true })
    .lean<IChat>()
    .exec();

export const updateGroupAvatar = async (chatId: string, avatarUrl: string): Promise<IChat | null> =>
  Chat.findByIdAndUpdate(chatId, { avatar: avatarUrl }, { new: true })
    .populate("members", "name avatar isOnline lastSeen")
    .lean<IChat>()
    .exec();
