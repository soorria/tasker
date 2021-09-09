import { makeStyles, Paper, Typography } from "@material-ui/core";
import { useState } from "react";
import { Task, TaskStatus } from "../../types";
import { formatDate } from "../../utils";
import TaskModal from "./TaskModal";
import TaskStatusPill from "./TaskStatusPill";
import { useDeleteTask, useEditTask } from "../../api/tasks";

interface TaskListItemProps {
  task: Task;
  isEditable?: boolean;
  showPill?: boolean;
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    padding: theme.spacing(3),
    "& > * + *": {
      marginLeft: theme.spacing(1),
    },
    boxShadow: theme.shadows[3],
    "&:hover": {
      boxShadow: theme.shadows[6],
    },
    border: "none",
    textAlign: "left",
    cursor: "pointer",
  },
  timeDetails: {
    display: "flex",
    alignItems: "center",
    "& > * + *": {
      marginLeft: theme.spacing(0.5),
    },
  },
  filler: {
    flex: "1 0",
  },
  title: {
    fontWeight: "bold",
    marginBottom: theme.spacing(1),
  },
  textRed: {
    color: theme.palette.error.main,
  },
}));

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  isEditable,
  showPill = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const classes = useStyles();

  const deleteTaskCallback = useDeleteTask();
  const editTaskCallback = useEditTask();

  const isOverdue =
    (task.deadline as any) < new Date().toISOString() &&
    task.status !== TaskStatus.DONE;

  return (
    <>
      <Paper
        component="div"
        className={classes.wrapper}
        onClick={() => setShowModal(true)}
      >
        <div>
          <Typography variant="h5" component="p" className={classes.title}>
            {task.title}
          </Typography>
          <div className={classes.timeDetails}>
            {task.deadline && (
              <Typography component="span">
                Deadline:{" "}
                <span className={isOverdue ? classes.textRed : undefined}>
                  {formatDate(task.deadline)}
                </span>
              </Typography>
            )}
            {task.deadline && task.estimated_days && <span>•</span>}
            {task.estimated_days && (
              <Typography component="span">
                Estimated Days: {task.estimated_days}
              </Typography>
            )}
          </div>
        </div>
        <div className={classes.filler} />
        {showPill ? <TaskStatusPill status={task.status} /> : null}
      </Paper>
      <TaskModal
        mode={isEditable ? "edit" : "view"}
        error={error}
        open={showModal}
        onClose={() => setShowModal(false)}
        taskInit={task}
        onDelete={async () => {
          setError(null);
          if (!isEditable) {
            return;
          }
          const { error } = await deleteTaskCallback(task.id);
          if (error) {
            console.log(error);
            setError(error.message);
          } else {
            setShowModal(false);
          }
        }}
        onSubmit={async (taskUpdates) => {
          setError(null);
          if (!isEditable) {
            return;
          }
          const { error } = await editTaskCallback(task.id, taskUpdates);
          if (error) {
            setError(error.message);
          } else {
            setShowModal(false);
          }
        }}
      />
    </>
  );
};

export default TaskListItem;
