import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

@Entity("TaskAssignment")
export class TaskAssignment {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => Task, (task) => task.id, {
    eager: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "task" })
  task: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: true, eager: true })
  @JoinColumn({ name: "user_assignee" })
  user_assignee: string;

  @Column({ nullable: true })
  group_assignee: string;
}
