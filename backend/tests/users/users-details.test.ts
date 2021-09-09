/*
    file to test users-details.ts
*/

import { createConnection, getConnection } from "typeorm";

import { fetchUserDetails } from "../../src/users/users-details";
import { User } from "../../src/entity/User";
import { clearEntity } from "../test-helpers/clear";
import { createUser } from "../../src/users/users-create";
import { decodeJWTPayload } from "../../src/users/users-helpers";
import { InputUpdateUser } from "../../src/users/users-interface";
import { updateUser } from "../../src/users/users-update";

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

// test when id does not exist
test("id does not exist for user", async () => {
  const nonexistent_ids = [
    "3d45abc1-f475-475d-896a-32018a032ce8",
    "c5b930f3-eed3-4f07-9dbd-a0466a763b49",
  ];
  expect.assertions(nonexistent_ids.length);
  await expect(
    fetchUserDetails(nonexistent_ids[0])
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"This user does not exist"`);
  await expect(
    fetchUserDetails(nonexistent_ids[1])
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"This user does not exist"`);
});

// test when avatar_url does not exist
test("correct return | no avatar", async () => {
  // create a dummy user
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const token = await createUser(
    user_email,
    user_password,
    user_first_name,
    user_last_name,
    user_bio
  );

  // decode their id from token payload
  const session = await decodeJWTPayload(token);

  const details = await fetchUserDetails(session.id);

  expect(details.email).toBe(user_email);
  expect(details.first_name).toBe(user_first_name);
  expect(details.last_name).toBe(user_last_name);
  expect(details.bio).toBe(user_bio);
});

// test when avatar_url does exist
// test when avatar_url does not exist
test("correct return | with avatar", async () => {
  // create a dummy user
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const token = await createUser(
    user_email,
    user_password,
    user_first_name,
    user_last_name,
    user_bio
  );

  // decode their id from token payload
  const session = await decodeJWTPayload(token);

  // update avatar_url
  const user_avatar_url = "fakeurl.com";
  const changes: InputUpdateUser = {
    avatar_url: user_avatar_url,
  };
  await updateUser(session.id, changes);

  const details = await fetchUserDetails(session.id);

  expect(details.email).toBe(user_email);
  expect(details.first_name).toBe(user_first_name);
  expect(details.last_name).toBe(user_last_name);
  expect(details.bio).toBe(user_bio);
  expect(details.avatar_url).toBe(user_avatar_url);
});
