import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("Connection")
export class Connection {
  @PrimaryColumn("text")
  requester: string;

  @PrimaryColumn("text")
  requestee: string;

  @Column()
  accepted: boolean;
}
