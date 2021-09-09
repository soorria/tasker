/*
    test file to test users-update.ts file
*/

import { v4 as uuidv4 } from "uuid";
import { createConnection, getConnection } from "typeorm";

import { updateUser } from "../../src/users/users-update";
import { User } from "../../src/entity/User";
import { clearEntity } from "../test-helpers/clear";
import { createUser } from "../../src/users/users-create";
import { decodeJWTPayload, hashMatch } from "../../src/users/users-helpers";
import { InputUpdateUser } from "../../src/users/users-interface";

beforeAll(async () => {
  await createConnection();
});

beforeEach(async () => {
  await clearEntity(User);
});

/** clear out database after all tests run */
afterAll(async () => {
  await clearEntity(User);
  return await getConnection().close();
});

// throw error if trying to update to invalid email address
test("invalid email to update", async () => {
  const nonexistent_users = [
    {
      id: "3d45abc1-f475-475d-896a-32018a032ce8",
      changes: { email: "helloshbaail.com" },
    },
    {
      id: "c5b930f3-eed3-4f07-9dbd-a0466a763b49",
      changes: { email: "2helloshbam@gmm" },
    },
  ];
  expect.assertions(nonexistent_users.length);
  await Promise.all(
    nonexistent_users.map(
      async (user) =>
        await expect(updateUser(user.id, user.changes)).rejects.toThrowError(
          "Please enter a valid email"
        )
    )
  );
});

// throw error if email address is already assigned to other user
test("email already assigned to another user", async () => {
  const valid_emails = ["validemail@website.com", "hello@platter.io"];
  // create the emails of the users
  await Promise.all(
    valid_emails.map(
      async (email) =>
        await createUser(email, "password", "first_name", "last_name", "bio")
    )
  );
  // the same emails should not be able to register
  expect.assertions(valid_emails.length);
  await Promise.all(
    valid_emails.map(
      async (email) =>
        await expect(
          updateUser(uuidv4(), { email: email })
        ).rejects.toThrowError(
          "This email already belongs to a Tasker account."
        )
    )
  );
});

// 1. no such user exists update
test("no such user exists for update", async () => {
  const nonexistent_users = [
    {
      id: "3d45abc1-f475-475d-896a-32018a032ce8",
      changes: { email: "helloshbam@gmail.com" },
    },
    {
      id: "c5b930f3-eed3-4f07-9dbd-a0466a763b49",
      changes: { email: "2helloshbam@gmail.com" },
    },
  ];
  expect.assertions(nonexistent_users.length);
  await Promise.all(
    nonexistent_users.map(
      async (user) =>
        await expect(updateUser(user.id, user.changes)).rejects.toThrowError(
          "No such user exists"
        )
    )
  );
});

// 2. throw error if unknown attributes passed
test("unknown property error", async () => {
  const nonexistent_attributes = [
    {
      id: "3d45abc1-f475-475d-896a-32018a032ce8",
      changes: { hello: "helloshbam@gmail.com" },
    },
    {
      id: "c5b930f3-eed3-4f07-9dbd-a0466a763b49",
      changes: { wabam: "2helloshbam@gmail.com" },
    },
  ];
  expect.assertions(nonexistent_attributes.length);
  await Promise.all(
    nonexistent_attributes.map(
      async (user) =>
        await expect(
          updateUser(user.id, user.changes as any)
        ).rejects.toThrowError("Cannot Modify Nonexistent Properties of User")
    )
  );
});

// 3. check password hashed correctly
test("password hashed correctly", async () => {
  const password = "this_will_be_hashed";

  // create a user
  const token = await createUser(
    "email@email.com",
    "password",
    "first_name",
    "last_name",
    "bio"
  );

  // decode their id from token payload
  const session = await decodeJWTPayload(token);

  // update password with uid
  await updateUser(session.id, { password: password });

  // find user with id
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { id: session.id } });

  expect(hashMatch(password, user[0].password_hash)).toBe(true);
});

// 4. check other user properties correctly modified
test("users correctly updated", async () => {
  // create a dummy user
  const token = await createUser(
    "email@email.com",
    "password",
    "first_name",
    "last_name",
    "bio"
  );

  // decode their id from token payload
  const session = await decodeJWTPayload(token);

  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_avatar_url = "fakeurl.com";
  const user_bio = "an awesome person";
  const changes: InputUpdateUser = {
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    avatar_url: user_avatar_url,
    bio: user_bio,
  };
  await updateUser(session.id, changes);
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: user_email } });
  expect(user.length).toBe(1);
  expect(user[0].first_name).toBe(user_first_name);
  expect(user[0].last_name).toBe(user_last_name);
  expect(user[0].avatar_url).toBe(user_avatar_url);
  expect(user[0].bio).toBe(user_bio);
  expect(hashMatch(user_password, user[0].password_hash)).toBe(true);
});
