import { ApiError } from "../utils/ApiError.ts";
import {
  createMessage,
  findMessageById,
  findMessagesByChat,
  countMessagesByChat,
  softDeleteMessage,
  markMessagesAsRead,
} from "../repositories/message.repository.ts";
import { isChatMember, updateChatLastMessage } from "../repositories/chat.repository.ts";
import type { IMessage, SendMessageInput, GetMessagesInput } from "../types/index.ts";

// ─── Send a message ───────────────────────────────────────────────────────────

export const sendMessageService = async (input: SendMessageInput): Promise<IMessage> => {
  const { chatId, senderId, content, type = "text", replyTo } = input;

  const isMember = await isChatMember(chatId, senderId);
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this chat");
  }

  if (replyTo) {
    const parent = await findMessageById(replyTo);
    if (!parent || parent.chat.toString() !== chatId) {
      throw new ApiError(400, "Invalid reply target");
    }
  }

  const message = await createMessage({
    chat: chatId as unknown as never,
    sender: senderId as unknown as never,
    content,
    type,
    ...(replyTo && { replyTo: replyTo as unknown as never }),
    readBy: [senderId as unknown as never],
  });

  // Update the chat's lastMessage pointer
  await updateChatLastMessage(chatId, message._id.toString());

  return message;
};

// ─── Get paginated messages for a chat ───────────────────────────────────────

export const getMessagesService = async (
  input: GetMessagesInput,
): Promise<{
  messages: IMessage[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}> => {
  const { chatId, userId, page = 1, limit = 30 } = input;

  const isMember = await isChatMember(chatId, userId);
  if (!isMember) throw new ApiError(403, "You are not a member of this chat");

  const [messages, total] = await Promise.all([
    findMessagesByChat(chatId, page, limit),
    countMessagesByChat(chatId),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    messages,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  };
};

// ─── Delete a message ─────────────────────────────────────────────────────────

export const deleteMessageService = async (
  messageId: string,
  userId: string,
): Promise<IMessage> => {
  const message = await findMessageById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (message.sender.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  if (message.isDeleted) {
    throw new ApiError(400, "Message is already deleted");
  }

  const deleted = await softDeleteMessage(messageId, userId);
  return deleted!;
};

// ─── Mark messages as read ────────────────────────────────────────────────────

export const markAsReadService = async (chatId: string, userId: string): Promise<void> => {
  const isMember = await isChatMember(chatId, userId);
  if (!isMember) throw new ApiError(403, "You are not a member of this chat");

  await markMessagesAsRead(chatId, userId);
};
