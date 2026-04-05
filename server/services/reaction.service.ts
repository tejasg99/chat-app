import { ApiError } from "../utils/ApiError.ts";
import { toggleReaction } from "../repositories/reaction.repository.ts";
import { findMessageById } from "../repositories/message.repository.ts";
import { isChatMember } from "../repositories/chat.repository.ts";
import type { IMessage, IReaction, IReactionToggleInput } from "../types/index.ts";

export const toggleReactionService = async (
  input: IReactionToggleInput,
): Promise<{ message: IMessage; reactions: IReaction[] }> => {
  const { messageId, userId, emoji } = input;

  const message = await findMessageById(messageId);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.isDeleted) throw new ApiError(400, "Cannot react to a deleted message");

  // Ensure the user is a member of the chat this message belongs to
  const isMember = await isChatMember(message.chat.toString(), userId);
  if (!isMember) throw new ApiError(403, "You are not a member of this chat");

  const updated = await toggleReaction(messageId, userId, emoji);
  if (!updated) throw new ApiError(500, "Failed to update reaction");

  return {
    message: updated,
    reactions: updated.reactions,
  };
};
