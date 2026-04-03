import { User } from "../models/user.model.ts";
import type { IUser } from "../types/index.ts";

export const findUserByEmail = async (
  email: string,
  includePassword = false,
): Promise<IUser | null> => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+password");
  return query.lean<IUser>().exec();
};

export const findUserById = async (id: string): Promise<IUser | null> =>
  User.findById(id).lean<IUser>().exec();

export const findUserByGoogleId = async (googleId: string): Promise<IUser | null> =>
  User.findOne({ googleId }).lean<IUser>().exec();

export const createUser = async (data: Partial<IUser>): Promise<IUser> => {
  const user = new User(data);
  return user.save();
};

export const updateUserRefreshToken = async (
  userId: string,
  refreshToken: string | null,
): Promise<void> => {
  await User.findByIdAndUpdate(userId, { refreshToken }).exec();
};

export const findUserByRefreshToken = async (token: string): Promise<IUser | null> =>
  User.findOne({ refreshToken: token }).select("+refreshToken").lean<IUser>().exec();
