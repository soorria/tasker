import "reflect-metadata";
import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";
// Probably needs to be imported after express
import "express-async-errors";

import { createConnection } from "typeorm";
import {
  generateAuthUrl,
  saveOAuthToken,
} from "./googleOAuth/authenticate-oauth";
import { saveTaskToCalendar } from "./googleOAuth/calendar-create-event";
import { createUser } from "./users/users-create";
import { loginUser } from "./users/users-login";
import { decodeJWTPayload } from "./users/users-helpers";
import { fetchUserDetails } from "./users/users-details";
import { updateUser } from "./users/users-update";
import { createTask } from "./tasks/task-create";
import { deleteTask } from "./tasks/task-delete";
import { editTask } from "./tasks/task-edit";
import { getProfileTasks } from "./tasks/get-profile-tasks";
import { getTask } from "./tasks/get-task";
import cors from "cors";
import { User } from "./entity/User";
import { Task } from "./entity/Task";
import { TaskAssignment } from "./entity/TaskAssignment";
import { Connection } from "./entity/Connection";
import {
  acceptRequest,
  createUserConnection,
  deleteUserConnection,
  declineRequest,
  isConnected,
  getIncomingConnectionRequests,
  getOutgoingConnectionRequests,
  getAcceptedConnections,
} from "./connection";
import { ApiError } from "./errors";
import { getStatsForUser } from "./users/users-stats";
import { sendData, sendError } from "./response-utils";
import { taskSearch } from "./tasks/task-search";
import { getUserByEmail } from "./users/users-search";
import { CalendarCredential } from "./entity/CalendarCredential";
import {
  deleteCalendarCredential,
  hasCalendarCredential,
} from "./calendar-credentials";

const PORT = 8080;

// start express server
// initiated outside of connection to export it
const app = express();
// create typeorm connection
createConnection({
  entities: [User, Task, Connection, TaskAssignment, CalendarCredential],
  type: "postgres",
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  port: Number(process.env.TYPEORM_PORT),
  host: process.env.TYPEORM_HOST,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  logging: process.env.TYPEORM_LOGGING === "true",
})
  .then(() => {
    app.use(cors());
    app.use(express.json());

    app.post("/oauthtokens/save", async (req, res) => {
      await saveOAuthToken(req.body.code, req.body.jwt);
      sendData(res, "Save your tokens");
    });

    app.get("/authenticate/googlecal", async (req, res) => {
      const authUrl = generateAuthUrl();
      sendData(res, authUrl);
    });

    app.post("/users/signup", async (req, res) => {
      const token = await createUser(
        req.body.email,
        req.body.password,
        req.body.first_name,
        req.body.last_name,
        req.body.bio
      );

      // return res.send({ token: token });
      sendData(res, { token });
    });

    app.post("/users/login", async (req, res) => {
      const token = await loginUser(req.body.email, req.body.password);

      // return res.send({ token: token });
      sendData(res, { token });
    });

    app.get("/users/details/:id", async (req, res) => {
      const details = await fetchUserDetails(req.params.id);
      sendData(res, details);
    });

    app.use(async (req, res, next) => {
      res.locals.session = await decodeJWTPayload(req.header("jwt"));
      next();
    });

    app.post("/tasks/creategooglevent", async (req, res) => {
      await saveTaskToCalendar(req.body.task_id);
      sendData(res, "done");
    });

    app.get("/oauthtokens/check", async (req, res) => {
      sendData(res, await hasCalendarCredential(res.locals.session.id));
    });

    app.post("/oauthtokens/clear", async (req, res) => {
      deleteCalendarCredential(res.locals.session.id);
      sendData(res, "delete credentials");
    });

    app.get("/users/me", async (req, res) => {
      const details = await fetchUserDetails(res.locals.session.id);
      sendData(res, details);
    });

    app.post("/users/update", async (req, res) => {
      await updateUser(res.locals.session.id, req.body.changes);
      sendData(res, "updated successfully!");
    });

    app.get("/users/:userId/stats", async (req, res) => {
      sendData(res, await getStatsForUser(req.params.userId));
    });

    app.post("/users/by-email", async (req, res) => {
      sendData(res, await getUserByEmail(req.body.email));
    });

    // the two routes below return an array of tasks sorted by deadline, closer deadlines first
    // data is Task[] of the form: [ Task { creator: User { id: ,
    //                                                          email: , etc.
    //                                                        },
    //                                          assignees: [ User{id: , email: , etc.}, ...],
    //                                          id: ,
    //                                          deadline: , etc.} ]
    app.get("/tasks", async (req, res) => {
      const tasks = await taskSearch(
        res.locals.session.id,
        req.query.title as string | undefined,
        req.query.description as string | undefined,
        req.query.project as string | undefined,
        req.query.creator as string | undefined,
        req.query.deadline as string | undefined,
        req.query.status as string | undefined,
        req.query.estimated_days as string | undefined,
        // @ts-ignore string list
        req.query.user_assignee as string | undefined
      );
      sendData(res, tasks);
    });

    app.get("/users/tasks/:user_id", async (req, res) => {
      sendData(
        res,
        await getProfileTasks(res.locals.session.id, req.params.user_id)
      );
    });

    app.get("/task/:task_id", async (req, res) => {
      sendData(res, await getTask(res.locals.session.id, req.params.task_id));
    });

    app.post("/task/create", async (req, res) => {
      const deadlineTime = new Date(req.body.deadline);
      await createTask(
        res.locals.session.id,
        req.body.title,
        deadlineTime,
        req.body.status,
        req.body.assignees, // string[] containing ids, can be empty/null/undefined to implicitly assign to creator
        req.body.project, // can be null/undefined, sets to null in db
        req.body.description, // can be null
        req.body.estimated_days // can be null
      );
      sendData(res, "create task success");
    });

    app.post("/task/edit/:task_id", async (req, res) => {
      let deadlineTime = null;
      if (req.body.deadline) {
        deadlineTime = new Date(req.body.deadline);
      }
      await editTask(
        req.params.task_id,
        res.locals.session.id,
        // must specify at least one of the following, rest can be null
        req.body.title,
        deadlineTime,
        req.body.status,
        req.body.add_assignees, // string[] containing ids assignees to add, or null/undefined/[] for no changes
        req.body.remove_assignees, // string[] containing ids assignees to remove, or null/undefined/[] for no changes
        //                            removing all assignees will set creator/editor as only assignee
        req.body.description,
        req.body.estimated_days
      );
      sendData(res, "edit task success");
    });

    app.delete("/task/delete/:task_id", async (req, res) => {
      await deleteTask(res.locals.session.id, req.params.task_id);
      sendData(res, "delete task success");
    });

    app.post("/connection/create", async (req, res) => {
      await createUserConnection(req.body.id, res.locals.session.id);
      sendData(res, "updated succesfully!");
    });

    app.post("/connection/delete", async (req, res) => {
      await deleteUserConnection(req.body.id, res.locals.session.id);
      sendData(res, "updated successfully!");
    });

    app.post("/connection/accept", async (req, res) => {
      await acceptRequest(res.locals.session.id, req.body.id);
      sendData(res, "updated succesfully!");
    });

    app.post("/connection/decline", async (req, res) => {
      await declineRequest(res.locals.session.id, req.body.id);
      sendData(res, "updated succesfully!");
    });

    app.get("/connection/status/:userId", async (req, res) => {
      const s = await isConnected(res.locals.session.id, req.params.userId);
      sendData(res, s);
    });

    app.get("/connection/incomingRequests", async (req, res) => {
      const s = await getIncomingConnectionRequests(res.locals.session.id);
      sendData(res, s);
    });

    app.get("/connection/incomingRequests/:userId", async (req, res) => {
      const s = await getIncomingConnectionRequests(req.params.userId);
      sendData(res, s);
    });

    app.get("/connection/outgoingRequests", async (req, res) => {
      const s = await getOutgoingConnectionRequests(res.locals.session.id);
      sendData(res, s);
    });

    app.get("/connection/outgoingRequests/:userId", async (req, res) => {
      const s = await getOutgoingConnectionRequests(req.params.userId);
      sendData(res, s);
    });

    app.get("/connection/acceptedConnections", async (req, res) => {
      const s = await getAcceptedConnections(res.locals.session.id);
      sendData(res, s);
    });

    if (process.env.NODE_ENV !== "production") {
      app.get("/this-route-will-error", async () => {
        throw new Error("This is a test error that should not show up in prod");
      });
    }

    app.use(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);
        if (res.headersSent) {
          return;
        } else if (err instanceof ApiError) {
          sendError(res, {
            code: err.code,
            message: err.message,
          });
        } else {
          sendError(res, {
            code: "UNKNOWN_ERROR",
            message: "An unknown error occurred on the server",
          });
        }
      }
    );
  })
  .catch((err) => {
    console.log("Could not connect to database", err);
  });

// listen delcared outside of connection to handle open handles in tests
const server = app.listen(PORT, () =>
  // tslint:disable-next-line:no-console
  console.log(`App listening on port ${PORT}!`)
);

export default {
  app: app,
  server: server,
};
