/*
File to create connection requests and accept/decline between users in backend from request from frontend

Written by Jocelyn Hing 27 June
*/

import { getConnection } from "typeorm";

import { Connection } from "./entity/Connection";
import { User } from "./entity/User";
import { ApiError } from "./errors";

/* function to create and store Connection in database*/
export async function createUserConnection(
  requestee: string,
  requester: string
): Promise<void> {
  const connRepo = getConnection().getRepository(Connection);
  if (requestee == requester) {
    throw new ApiError(
      "create_connection/connect_to_self",
      "Cannot create connection with the same user."
    );
  }
  if (
    await connRepo.findOne({
      where: [
        { requestee: requestee, requester: requester },
        { requestee: requester, requester: requestee },
      ],
    })
  ) {
    throw new ApiError(
      "create_connection/connection_exists",
      "Connection already exists"
    );
  }

  const conn = new Connection();
  conn.requestee = requestee;
  conn.requester = requester;
  conn.accepted = false;

  await getConnection().manager.save(conn);
}

/* function to cancel and/or delete Connection in database*/
export async function deleteUserConnection(
  requestee: string,
  requester: string
): Promise<void> {
  const connRepo = getConnection().getRepository(Connection);
  if (requestee == requester) {
    throw new ApiError(
      "delete_connection/connect_to_self",
      "Cannot cancel connection with the same user."
    );
  }

  const conn = await connRepo.findOne({
    where: [
      { requestee: requestee, requester: requester },
      { requestee: requester, requester: requestee },
    ],
  });

  if (!conn) {
    throw new ApiError(
      "delete_connection/connection_not_exists",
      "Connection has not been requested or does not exist"
    );
  }

  await connRepo.delete(conn);
}

/* function to accept and save changes in database*/
export async function acceptRequest(
  requestee: string,
  requester: string
): Promise<void> {
  const connRepo = getConnection().getRepository(Connection);
  const conn = await connRepo.findOne({
    where: { requestee: requestee, requester: requester },
  });
  conn.accepted = true;
  await connRepo.save(conn);
}

/* function to delete and remove in database*/

export async function declineRequest(
  requestee: string,
  requester: string
): Promise<void> {
  const connRepo = getConnection().getRepository(Connection);
  const conn = await connRepo.findOne({
    where: { requestee: requestee, requester: requester },
  });
  await connRepo.delete(conn);
}

/* function to check if user is connected*/

export async function isConnected(
  requestee: string,
  requester: string
): Promise<"unconnected" | "connected" | "requested"> {
  const connRepo = getConnection().getRepository(Connection);
  const conn = await connRepo.find({
    where: { requestee: requestee, requester: requester },
  });
  if (conn.length == 0) {
    const connCheck = await connRepo.find({
      where: { requestee: requester, requester: requestee },
    });
    if (connCheck.length == 0) {
      return "unconnected";
    } else {
      if (connCheck[0].accepted == true) {
        return "connected";
      } else {
        return "requested";
      }
    }
  } else {
    if (conn[0].accepted == true) {
      return "connected";
    } else {
      return "requested";
    }
  }
}

/* function to delete a request in database*/

export async function deleteRequest(
  requestee: string,
  requester: string
): Promise<void> {
  const connRepo = getConnection().getRepository(Connection);
  const conn = await connRepo.findOne({
    where: { requestee: requestee, requester: requester },
  });
  await connRepo.delete(conn);
}

/* function to show all of user's incoming connection requests in database*/

export async function getIncomingConnectionRequests(
  requestee: string
): Promise<User[]> {
  const connRepo = getConnection().getRepository(Connection);
  const conns = await connRepo.find({
    where: { requestee: requestee, accepted: false },
  });
  const userRepo = getConnection().getRepository(User);
  const requesterIds = conns.map((c) => c.requester);
  return userRepo.findByIds(requesterIds);
}

/* function to show all of user's connection requests in database*/

export async function getOutgoingConnectionRequests(
  requester: string
): Promise<User[]> {
  const connRepo = getConnection().getRepository(Connection);
  const conns = await connRepo.find({
    where: { requester: requester, accepted: false },
  });
  const userRepo = getConnection().getRepository(User);
  const requesteeIds = conns.map((c) => c.requestee);
  return userRepo.findByIds(requesteeIds);
}

export async function getAcceptedConnections(user: string): Promise<User[]> {
  const connRepo = getConnection().getRepository(Connection);
  const acceptedConnections = await connRepo.find({
    where: [
      { requestee: user, accepted: true },
      { requester: user, accepted: true },
    ],
  });
  if (isValidAcceptedConnections(acceptedConnections)) {
    throw new ApiError(
      "connections/accepted_connections_fail",
      "Failed to find accepted connections :( "
    );
  } else {
    const userIds = acceptedConnections.map((c) =>
      c.requestee === user ? c.requester : c.requestee
    );
    const userRepo = getConnection().getRepository(User);
    return userRepo.findByIds(userIds);
  }
}

export function isValidAcceptedConnections(
  acceptedConnections: Connection[]
): boolean {
  if (acceptedConnections == null) {
    return true;
  } else {
    return false;
  }
}
