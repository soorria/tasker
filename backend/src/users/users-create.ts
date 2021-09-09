/*
File to create users in backend from request from frontend

Written by Joseph Jeong 26 JUN 2021
*/

import { v4 as uuidv4 } from "uuid";
import { getConnection } from "typeorm";

import { User } from "../entity/User";
import {
  createSession,
  existingEmailCheck,
  passwordHash,
  regexEmailCheck,
} from "./users-helpers";
import { ApiError } from "../errors";

/** function to create and store user in database with bcrypt password */
export async function createUser(
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  bio: string
): Promise<string> {
  // check if email is valid
  if (!regexEmailCheck(email)) {
    throw new ApiError("signup/invalid_email", "Please enter a valid email");
  }

  // check if email is already in use
  if (await existingEmailCheck(email)) {
    throw new ApiError(
      "signup/email_exists",
      "This email already belongs to a Tasker account."
    );
  }

  // create new user
  const user = new User();
  user.email = email;
  user.first_name = first_name;
  user.last_name = last_name;
  user.bio = bio;

  // give user uuid
  user.id = uuidv4();

  // hash user password
  user.password_hash = await passwordHash(password);

  // save the user
  await getConnection().manager.save(user);

  // create a JWT token for session
  const token = createSession(user.id);
  return token.token;
}
