/*
    file to test whether tests are working
*/

import exp from "../../src/index";
import request from "supertest";

import { createConnection, getConnection } from "typeorm";
import { User } from "../../src/entity/User";
import { clearEntity } from "../test-helpers/clear";
import { decodeJWTPayload, hashMatch } from "../../src/users/users-helpers";
import { UserDetails } from "../../src/users/users-interface";

// establish request for testing
const req = request(exp.app);

beforeAll(async () => {
  await createConnection();
});

beforeEach(async () => {
  await clearEntity(User);
});

/** clear out database after all tests run */
afterAll(async () => {
  await clearEntity(User);
  exp.server.close();
  await getConnection().close();
});

it("creates a user correctly", async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const res = await req.post("/users/signup").send({
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    bio: user_bio,
  });

  expect(res.body.data.token).toBeTruthy();

  const user = await getConnection()
    .getRepository(User)
    .find({ where: { email: user_email } });
  expect(user.length).toBe(1);
  expect(user[0].first_name).toBe(user_first_name);
  expect(user[0].last_name).toBe(user_last_name);
  expect(user[0].bio).toBe(user_bio);
  expect(hashMatch(user_password, user[0].password_hash)).toBe(true);

  return;
});

it("logs in a user correctly", async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const res1 = await req.post("/users/signup").send({
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    bio: user_bio,
  });

  const payload1 = await decodeJWTPayload(res1.body.data.token);

  const res2 = await req.post("/users/login").send({
    email: user_email,
    password: user_password,
  });

  const payload2 = await decodeJWTPayload(res2.body.data.token);

  expect(payload1.id).toBe(payload2.id);

  return;
});

it("requests user details correctly", async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const res1 = await req.post("/users/signup").send({
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    bio: user_bio,
  });

  const user_id = (await decodeJWTPayload(res1.body.data.token)).id;

  const res2 = await req.get(`/users/details/${user_id}`);
  const body: UserDetails = res2.body.data;

  expect(body.id).toBe(user_id);
  expect(body.email).toBe(user_email);
  expect(body.first_name).toBe(user_first_name);
  expect(body.last_name).toBe(user_last_name);
  expect(body.bio).toBe(user_bio);

  return;
});

it('requests "my" details correctly', async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const res1 = await req.post("/users/signup").send({
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    bio: user_bio,
  });

  const token = res1.body.data.token;
  const user_id = (await decodeJWTPayload(token)).id;

  const res2 = await req.get("/users/me").set({ jwt: token });
  const body: UserDetails = res2.body.data;

  expect(body.id).toBe(user_id);
  expect(body.email).toBe(user_email);
  expect(body.first_name).toBe(user_first_name);
  expect(body.last_name).toBe(user_last_name);
  expect(body.bio).toBe(user_bio);

  return;
});

it("updates user details correctly", async () => {
  const user_email = "validemail@webiste.com";
  const user_password = "strong password";
  const user_first_name = "dude";
  const user_last_name = "bro";
  const user_bio = "an awesome person";
  const res1 = await req.post("/users/signup").send({
    email: user_email,
    password: user_password,
    first_name: user_first_name,
    last_name: user_last_name,
    bio: user_bio,
  });

  const token = res1.body.data.token;
  const user_id = (await decodeJWTPayload(token)).id;

  const user_avatar_url = "www.shrek.com";

  //update users
  await req
    .post("/users/update")
    .set({ jwt: token })
    .send({
      changes: {
        avatar_url: user_avatar_url,
      },
    });

  const res3 = await req.get("/users/me").set({ jwt: token });
  const body: UserDetails = res3.body.data;

  expect(body.id).toBe(user_id);
  expect(body.email).toBe(user_email);
  expect(body.first_name).toBe(user_first_name);
  expect(body.last_name).toBe(user_last_name);
  expect(body.bio).toBe(user_bio);
  expect(body.avatar_url).toBe(user_avatar_url);

  return;
});
