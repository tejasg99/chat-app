import { Request, Response } from "express";
import {
  getOrCreateDirectChatService,
  createGroupChatService,
  getUserChatsService,
  getChatByIdService,
  addMembersService,
  removeMemberService,
} from "../services/chat.service.ts";
import { createDirectChatSchema, createGroupChatSchema } from "../validations/chat.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";

// ─── GET /api/chats — Get all chats for logged-in user ───────────────────────
export const getUserChats = asyncHandler(async (req: Request, res: Response) => {
  const chats = await getUserChatsService(req.user!._id.toString());
  res.status(200).json(createApiResponse(200, "Chats fetched", chats));
});

// ─── GET /api/chats/:chatId — Get a single chat ───────────────────────────────
export const getChatById = asyncHandler(async (req: Request, res: Response) => {
  const chat = await getChatByIdService(req.params.chatId as string, req.user!._id.toString());
  res.status(200).json(createApiResponse(200, "Chat fetched", chat));
});

// ─── POST /api/chats/direct — Create or get a direct chat ────────────────────
export const createDirectChat = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createDirectChatSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { chat, isNew } = await getOrCreateDirectChatService({
    currentUserId: req.user!._id.toString(),
    targetUserId: parsed.data.targetUserId,
  });

  res
    .status(isNew ? 201 : 200)
    .json(
      createApiResponse(isNew ? 201 : 200, isNew ? "Chat created" : "Chat already exists", chat),
    );
});

// ─── POST /api/chats/group — Create a group chat ─────────────────────────────
export const createGroupChat = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createGroupChatSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const chat = await createGroupChatService({
    ...parsed.data,
    createdBy: req.user!._id.toString(),
  });

  res.status(201).json(createApiResponse(201, "Group chat created", chat));
});

// ─── POST /api/chats/:chatId/members — Add members ───────────────────────────
export const addMembers = asyncHandler(async (req: Request, res: Response) => {
  const { members } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    res.status(400).json(createApiResponse(400, "Members array is required"));
    return;
  }

  const chat = await addMembersService(
    req.params.chatId as string,
    req.user!._id.toString(),
    members,
  );
  res.status(200).json(createApiResponse(200, "Members added", chat));
});

// ─── DELETE /api/chats/:chatId/members/:memberId — Remove a member ────────────
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const chat = await removeMemberService(
    req.params.chatId as string,
    req.user!._id.toString(),
    req.params.memberId as string,
  );
  res.status(200).json(createApiResponse(200, "Member removed", chat));
});
