/*
    Helper file to clear out databases between test runs
*/

import { getConnection } from "typeorm";
import { Connection } from "../../src/entity/Connection";
import { CalendarCredential } from "../../src/entity/CalendarCredential";
import { User } from "../../src/entity/User";
import { Task } from "../../src/entity/Task";

/** simple helper function to clear a table of entity table */
export async function clearEntity(
  entity: typeof User | Task | Connection | CalendarCredential | any
): Promise<void> {
  await getConnection().createQueryBuilder().delete().from(entity).execute();
}
