import { makeStyles, Typography, Theme } from "@material-ui/core";
import { TaskStatus } from "../../types";

interface TaskStatusPillProps {
  status: TaskStatus;
}

const statusToColor = {
  [TaskStatus.TO_DO]: "info",
  [TaskStatus.IN_PROGRESS]: "info",
  [TaskStatus.BLOCKED]: "warning",
  [TaskStatus.DONE]: "success",
} as const;

const pillText: Record<TaskStatus, string> = {
  [TaskStatus.TO_DO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.BLOCKED]: "Blocked",
  [TaskStatus.DONE]: "Done",
};

const useStyles = makeStyles<Theme, TaskStatusPillProps>((theme) => ({
  wrapper: {
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: (props) => theme.palette[statusToColor[props.status]].main,
  },
  text: {
    color: "white",
  },
}));

const TaskStatusPill: React.FC<TaskStatusPillProps> = (props) => {
  const classes = useStyles(props);
  return (
    <span className={classes.wrapper}>
      <Typography variant="button" component="span" className={classes.text}>
        {pillText[props.status]}
      </Typography>
    </span>
  );
};

export default TaskStatusPill;
