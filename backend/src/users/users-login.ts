/*
    simple file to auth login attempts and pass back token
*/

import { User } from "../entity/User";
import { getConnection } from "typeorm";
import { createSession, hashMatch, regexEmailCheck } from "./users-helpers";
import { ApiError } from "../errors";

export async function loginUser(
  email: string,
  password: string
): Promise<string> {
  // firstly check if email is valid
  if (!regexEmailCheck(email)) {
    throw new ApiError("login/invalid_email", "Please enter a valid email");
  }

  // find account
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: email } });
  if (user.length != 1) {
    throw new ApiError(
      "login/no_user",
      "An account with this email does not exist."
    );
  }

  // check if password is correct
  if (!hashMatch(password, user[0].password_hash)) {
    throw new ApiError("login/no_user", "This is an incorrect password");
  }

  // return session token
  const session = createSession(user[0].id);
  return session.token;
}
