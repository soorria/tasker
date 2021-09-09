/*
    file handles updating users details
*/

import { User } from "../entity/User";
import { getConnection } from "typeorm";
import { InputUpdateUser, UpdateUser } from "./users-interface";
import { passwordHash } from "./users-helpers";
import { existingEmailCheck, regexEmailCheck } from "./users-helpers";
import { ApiError } from "../errors";

/** update user details from InputUpdateUser object and id */
export async function updateUser(
  id: string,
  input_changes: InputUpdateUser
): Promise<void> {
  const changes: UpdateUser = {};
  await Promise.all(
    Object.keys(input_changes).map(async (key) => {
      // if the password changes, hash the password
      if (key === "password") {
        changes.password_hash = await passwordHash(input_changes.password);
        return;
      } else if (key === "email") {
        // check if valid email
        if (!regexEmailCheck(input_changes.email)) {
          throw new ApiError(
            "user_update/invalid_email",
            "Please enter a valid email"
          );
        }

        // check if email already exists in database
        if (await existingEmailCheck(input_changes.email)) {
          throw new ApiError(
            "user_update/email_exists",
            "This email already belongs to a Tasker account."
          );
        }

        changes.email = input_changes.email;
        return;
      } else if (
        // keep updates to database very clean
        key === "first_name" ||
        key === "last_name" ||
        key === "avatar_url" ||
        key === "bio"
      ) {
        // otherwise, update it
        changes[key as keyof UpdateUser] =
          input_changes[key as keyof InputUpdateUser];
        return;
      }
      // if they're not a correct key, don't update
      throw new ApiError(
        "user_update/invalid_change",
        "Cannot Modify Nonexistent Properties of User"
      );
    })
  );

  // attempt to update user
  const status = await getConnection().manager.update(
    User,
    { id: id },
    changes
  );

  // if user to update doesn't exist, throw error
  if (status.affected == 0) {
    throw new ApiError("user_update/no_user", "No such user exists");
  }

  return;
}
