import { User } from "../entity/User";
import { getConnection } from "typeorm";
import { regexEmailCheck } from "./users-helpers";

export const getUserByEmail = async (
  maybeEmail: unknown
): Promise<Omit<User, "password_hash"> | null> => {
  if (typeof maybeEmail !== "string" || !regexEmailCheck(maybeEmail)) {
    return null;
  }

  const userRepo = getConnection().getRepository<User>(User);

  const [user] = await userRepo.find({
    where: { email: maybeEmail },
    select: ["id", "avatar_url", "email", "bio", "first_name", "last_name"],
    take: 1,
  });

  // User not found
  if (!user) return null;

  return user;
};
