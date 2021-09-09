/*
    test file to test users-update.ts file
*/

import { createConnection, getConnection } from "typeorm";

import { User } from "../../src/entity/User";
import { Task } from "../../src/entity/Task";
import { Connection } from "../../src/entity/Connection";
import { CalendarCredential } from "../../src/entity/CalendarCredential";

import { createUser } from "../../src/users/users-create";
import {
  createUserConnection,
  acceptRequest,
  declineRequest,
  isConnected,
  getOutgoingConnectionRequests,
  getIncomingConnectionRequests,
  getAcceptedConnections,
} from "../../src/connection";
import { clearEntity } from "../test-helpers/clear";

beforeAll(async () => {
  await createConnection();
});

beforeEach(async () => {
  await clearEntity(Connection);
  await clearEntity(Task);
  await clearEntity(CalendarCredential);
  await clearEntity(User);
});

/** clear out database after all tests run */
afterAll(async () => {
  await clearEntity(Connection);
  await clearEntity(Task);
  await clearEntity(CalendarCredential);
  await clearEntity(User);
  return await getConnection().close();
});

//  test creation of connection.
test("Connection correctly created", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);

  const connRepo = getConnection().getRepository(Connection);
  //for whatever reason the requestee and requester ids are switched here during lookup
  const conn = await connRepo.findOne({
    where: { requestee: user1.id, requester: user2.id },
  });

  expect(conn.accepted).toEqual(false);
  expect(conn.requestee).toBe(user1.id);
  expect(conn.requester).toBe(user2.id);
});
// test cannot create connection between same .
test("Cannot create connection between same user", async () => {
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

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });

  await expect(createUserConnection(user1.id, user1.id)).rejects.toThrowError(
    "Cannot create connection with the same user."
  );
});

// test accepting of connection.
test("Connection correctly accepted", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  await acceptRequest(user1.id, user2.id);
  const connRepo = getConnection().getRepository(Connection);
  const conn = await connRepo.findOne({
    where: { requestee: user1.id, requester: user2.id },
  });

  expect(conn.accepted).toEqual(true);
  expect(conn.requestee).toBe(user1.id);
  expect(conn.requester).toBe(user2.id);
});
// test declination of connection.
test("Connection correctly declined", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  await declineRequest(user1.id, user2.id);
  const connRepo = getConnection().getRepository(Connection);
  const connDeleted = await connRepo.find({ where: { requestee: user1.id } });
  expect(connDeleted).toHaveLength(0);
});

//  test adding users multiple times
test("Connection prevented when trying to add existing connection", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  await expect(createUserConnection(user1.id, user2.id)).rejects.toThrowError(
    "Connection already exists"
  );
});

//  test adding users multiple times vice versa
test("Connection prevented when trying to add existing connection where users were switched", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  await expect(createUserConnection(user2.id, user1.id)).rejects.toThrowError(
    "Connection already exists"
  );
});

//  test if two users are not connected
test("if two users are not connected", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  //console.log(isConnected(user1.id, user2.id));
  expect(await isConnected(user1.id, user2.id)).toEqual("requested");
});
// test if two users are connected
test("if two users are connected", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });

  await createUserConnection(user1.id, user2.id);
  await acceptRequest(user1.id, user2.id);
  expect(await isConnected(user1.id, user2.id)).toEqual("connected");
});

// test if outgoing connections returns
test("outgoing connections ", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );
  const user_email2 = "alholda@webiste.com";
  const user_password2 = "saffiztwehjfgsdlk";
  const user_first_name2 = "Sammy";
  const user_last_name2 = "J";
  const user_bio2 = "an awesome person with a top hat";
  await createUser(
    user_email2,
    user_password2,
    user_first_name2,
    user_last_name2,
    user_bio2
  );
  const user_email3 = "cowboyboyboy@webiste.com";
  const user_password3 = "696969hello";
  const user_first_name3 = "Randy";
  const user_last_name3 = "Randerson";
  const user_bio3 = "an awesome person with a tickets to the gun show.";
  await createUser(
    user_email3,
    user_password3,
    user_first_name3,
    user_last_name3,
    user_bio3
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });
  const user3 = await userRepo.findOne({ where: { email: user_email2 } });
  const user4 = await userRepo.findOne({ where: { email: user_email3 } });

  await createUserConnection(user1.id, user2.id);
  await createUserConnection(user1.id, user3.id);
  await createUserConnection(user1.id, user4.id);
  const connList = await getOutgoingConnectionRequests(user1.id);
  //console.log(connList);
  expect(connList.length).toBe(3);
});

// test if outgoing connections returns
test("incoming connections ", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );
  const user_email2 = "alholda@webiste.com";
  const user_password2 = "saffiztwehjfgsdlk";
  const user_first_name2 = "Sammy";
  const user_last_name2 = "J";
  const user_bio2 = "an awesome person with a top hat";
  await createUser(
    user_email2,
    user_password2,
    user_first_name2,
    user_last_name2,
    user_bio2
  );
  const user_email3 = "cowboyboyboy@webiste.com";
  const user_password3 = "696969hello";
  const user_first_name3 = "Randy";
  const user_last_name3 = "Randerson";
  const user_bio3 = "an awesome person with a tickets to the gun show.";
  await createUser(
    user_email3,
    user_password3,
    user_first_name3,
    user_last_name3,
    user_bio3
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });
  const user3 = await userRepo.findOne({ where: { email: user_email2 } });
  const user4 = await userRepo.findOne({ where: { email: user_email3 } });

  await createUserConnection(user2.id, user1.id);
  await createUserConnection(user3.id, user1.id);
  await createUserConnection(user4.id, user1.id);
  const connList = await getIncomingConnectionRequests(user1.id);
  //console.log(connList);
  expect(connList.length).toBe(3);
});

// test if accepcted connections returns
test("accepted connections ", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );
  const user_email2 = "alholda@webiste.com";
  const user_password2 = "saffiztwehjfgsdlk";
  const user_first_name2 = "Sammy";
  const user_last_name2 = "J";
  const user_bio2 = "an awesome person with a top hat";
  await createUser(
    user_email2,
    user_password2,
    user_first_name2,
    user_last_name2,
    user_bio2
  );
  const user_email3 = "cowboyboyboy@webiste.com";
  const user_password3 = "696969hello";
  const user_first_name3 = "Randy";
  const user_last_name3 = "Randerson";
  const user_bio3 = "an awesome person with a tickets to the gun show.";
  await createUser(
    user_email3,
    user_password3,
    user_first_name3,
    user_last_name3,
    user_bio3
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });
  const user3 = await userRepo.findOne({ where: { email: user_email2 } });
  const user4 = await userRepo.findOne({ where: { email: user_email3 } });

  await createUserConnection(user2.id, user1.id);
  await createUserConnection(user3.id, user1.id);
  await createUserConnection(user4.id, user1.id);

  await acceptRequest(user2.id, user1.id);
  await acceptRequest(user3.id, user1.id);

  const connList = await getAcceptedConnections(user1.id);

  console.log(connList);
  expect(connList.length).toBe(2);
});
// test if outgoing connections returns
test("incoming connections ", async () => {
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

  const user_email1 = "validemail888@webiste.com";
  const user_password1 = "stronger password";
  const user_first_name1 = "dudeman";
  const user_last_name1 = "broseph";
  const user_bio1 = "an awesome person with a moustache";
  await createUser(
    user_email1,
    user_password1,
    user_first_name1,
    user_last_name1,
    user_bio1
  );
  const user_email2 = "alholda@webiste.com";
  const user_password2 = "saffiztwehjfgsdlk";
  const user_first_name2 = "Sammy";
  const user_last_name2 = "J";
  const user_bio2 = "an awesome person with a top hat";
  await createUser(
    user_email2,
    user_password2,
    user_first_name2,
    user_last_name2,
    user_bio2
  );
  const user_email3 = "cowboyboyboy@webiste.com";
  const user_password3 = "696969hello";
  const user_first_name3 = "Randy";
  const user_last_name3 = "Randerson";
  const user_bio3 = "an awesome person with a tickets to the gun show.";
  await createUser(
    user_email3,
    user_password3,
    user_first_name3,
    user_last_name3,
    user_bio3
  );

  const userRepo = getConnection().getRepository(User);
  const user1 = await userRepo.findOne({ where: { email: user_email } });
  const user2 = await userRepo.findOne({ where: { email: user_email1 } });
  const user3 = await userRepo.findOne({ where: { email: user_email2 } });
  const user4 = await userRepo.findOne({ where: { email: user_email3 } });

  await createUserConnection(user2.id, user1.id);
  await createUserConnection(user3.id, user1.id);
  await createUserConnection(user4.id, user1.id);
  const connList = await getIncomingConnectionRequests(user1.id);
  //console.log(connList);
  expect(connList.length).toBe(3);
});
