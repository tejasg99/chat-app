import { ApiError } from "../utils/ApiError.ts";
import {
  findDirectChat,
  findChatById,
  findChatByIdWithMembers,
  findChatsByUserId,
  createChat,
  isChatMember,
  addMembersToGroup,
  removeMemberFromGroup,
} from "../repositories/chat.repository.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import type { IChat, CreateDirectChatInput, CreateGroupChatInput } from "../types/index.ts";

// ─── Create or fetch a direct (1:1) chat ─────────────────────────────────────

export const getOrCreateDirectChatService = async (
  input: CreateDirectChatInput,
): Promise<{ chat: IChat; isNew: boolean }> => {
  const { currentUserId, targetUserId } = input;

  if (currentUserId === targetUserId) {
    throw new ApiError(400, "Cannot create a chat with yourself");
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) throw new ApiError(404, "Target user not found");

  // Return existing chat if one already exists
  const existing = await findDirectChat(currentUserId, targetUserId);
  if (existing) return { chat: existing, isNew: false };

  const chat = await createChat({
    type: "direct",
    members: [currentUserId as unknown, targetUserId as unknown] as never,
    admins: [],
    createdBy: currentUserId as unknown as never,
  });

  const populated = await findChatByIdWithMembers(chat._id.toString());
  return { chat: populated!, isNew: true };
};

// ─── Create a group chat ──────────────────────────────────────────────────────

export const createGroupChatService = async (input: CreateGroupChatInput): Promise<IChat> => {
  const { name, members, createdBy, avatar } = input;

  // Ensure creator is always in the members list
  const uniqueMembers = [...new Set([createdBy, ...members])];

  if (uniqueMembers.length < 3) {
    throw new ApiError(400, "A group chat requires at least 3 members including you");
  }

  const chat = await createChat({
    type: "group",
    name,
    avatar,
    members: uniqueMembers as unknown as never,
    admins: [createdBy as unknown as never],
    createdBy: createdBy as unknown as never,
  });

  const populated = await findChatByIdWithMembers(chat._id.toString());
  return populated!;
};

// ─── Get all chats for the current user ──────────────────────────────────────

export const getUserChatsService = async (userId: string): Promise<IChat[]> =>
  findChatsByUserId(userId);

// ─── Get a single chat (must be a member) ────────────────────────────────────

export const getChatByIdService = async (chatId: string, userId: string): Promise<IChat> => {
  const isMember = await isChatMember(chatId, userId);
  if (!isMember) throw new ApiError(403, "You are not a member of this chat");

  const chat = await findChatByIdWithMembers(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");

  return chat;
};

// ─── Add members to a group chat ─────────────────────────────────────────────

export const addMembersService = async (
  chatId: string,
  requesterId: string,
  memberIds: string[],
): Promise<IChat> => {
  const chat = await findChatById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Cannot add members to a direct chat");

  const isAdmin = chat.admins.some((id) => id.toString() === requesterId);
  if (!isAdmin) throw new ApiError(403, "Only admins can add members");

  const updated = await addMembersToGroup(chatId, memberIds);
  return updated!;
};

// ─── Remove a member from a group chat ───────────────────────────────────────

export const removeMemberService = async (
  chatId: string,
  requesterId: string,
  memberId: string,
): Promise<IChat> => {
  const chat = await findChatById(chatId);
  if (!chat) throw new ApiError(404, "Chat not found");
  if (chat.type !== "group") throw new ApiError(400, "Cannot remove members from a direct chat");

  const isAdmin = chat.admins.some((id) => id.toString() === requesterId);
  const isSelf = requesterId === memberId;

  if (!isAdmin && !isSelf) {
    throw new ApiError(403, "Only admins can remove other members");
  }

  const updated = await removeMemberFromGroup(chatId, memberId);
  return updated!;
};
