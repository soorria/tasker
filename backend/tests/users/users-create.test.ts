/*
    test file to test users-create.ts file
*/

import { createConnection, getConnection } from "typeorm";

import { User } from "../../src/entity/User";
import { clearEntity } from "../test-helpers/clear";
import { createUser } from "../../src/users/users-create";
import { hashMatch } from "../../src/users/users-helpers";

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

// 1. test email regex check
test("incorrect email regex error", async () => {
  const invalid_emails = [
    "not a valid email",
    "bob mcgee",
    "hello.com",
    "joe@com",
  ];
  expect.assertions(invalid_emails.length);
  await expect(
    createUser(invalid_emails[0], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Please enter a valid email"`);
  await expect(
    createUser(invalid_emails[1], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Please enter a valid email"`);
  await expect(
    createUser(invalid_emails[2], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Please enter a valid email"`);
  await expect(
    createUser(invalid_emails[3], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"Please enter a valid email"`);
});

test("correct email regex working", async () => {
  const valid_emails = ["validemail@website.com", "hello@platter.io"];
  await Promise.all(
    valid_emails.map(
      async (email) =>
        await expect(
          createUser(email, "password", "first_name", "last_name", "bio")
        ).resolves.toBeDefined()
    )
  );
});

// 2. check existing email error
test("existing email conflict error", async () => {
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
  await expect(
    createUser(valid_emails[0], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"This email already belongs to a Tasker account."`
  );
  await expect(
    createUser(valid_emails[1], "password", "first_name", "last_name", "bio")
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"This email already belongs to a Tasker account."`
  );
});

// 3. check users are created
test("users correctly created", async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  await createUser(
    user_email,
    user_password,
    user_first_name,
    user_last_name,
    user_bio
  );
  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: user_email } });
  expect(user.length).toBe(1);
  expect(user[0].first_name).toBe(user_first_name);
  expect(user[0].last_name).toBe(user_last_name);
  expect(user[0].bio).toBe(user_bio);
  expect(hashMatch(user_password, user[0].password_hash)).toBe(true);
});
