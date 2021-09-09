import React, { useRef } from "react";
import {
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Typography,
  FormHelperText,
} from "@material-ui/core";
import NumericInput from "material-ui-numeric-input";
import MomentUtils from "@date-io/moment";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { Alert } from "@material-ui/lab";

import { Task, TaskStatus, User } from "../../types";
import { useEffect } from "react";
import { useConnectedUsers } from "../../api";
import { useMemo } from "react";
import { useAuthContext } from "../../context/AuthContext";
import UserChip from "./UserChip";

const useStyles = makeStyles((theme) => ({
  content: {
    width: "100%",
    "& > * + *": {
      marginTop: theme.spacing(2),
    },
  },
  fullWidthInput: {
    width: "100%",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    "& > *": {
      flex: 1,
    },
    "& > * + *": {
      marginLeft: theme.spacing(1),
    },
  },
  chips: {
    marginTop: theme.spacing(-1),
    marginLeft: theme.spacing(-1),
    "& > *": {
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  },
  unevenRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
}));

type TaskModalProps = {
  mode?: "view" | "create" | "edit";
  error?: string | null;
  open: boolean;
  taskInit: Task;
  onClose?: () => void;
  onDelete?: () => void;
  onSubmit?: (task: Partial<Task>) => Promise<void>;
};

const TaskModal = ({
  mode = "view",
  open,
  taskInit,
  error,
  onClose = () => {},
  onDelete = () => {},
  onSubmit = async () => {},
}: TaskModalProps) => {
  const [taskUpdates, setTaskUpdates] = React.useState<Partial<Task>>({});
  const task = React.useMemo(
    () =>
      Object.assign(
        {} as Task,
        taskInit,
        {
          assignees: taskInit.assignees
            ? taskInit.assignees.map((u: any) => u.id)
            : [],
        },
        taskUpdates
      ),
    [taskInit, taskUpdates]
  );

  const { user } = useAuthContext();
  const { data: connectedUsers } = useConnectedUsers();
  const usersMap = useMemo(() => {
    const result: Record<string, User> = {};
    connectedUsers?.forEach((user) => (result[user.id] = user));
    if (user) {
      result[user.id] = user;
    }
    taskInit.assignees?.forEach((user: any) => (result[user.id] = user));
    return result;
  }, [connectedUsers, user, taskInit.assignees]);

  useEffect(() => {
    if (mode == "create" && open) {
      setTaskUpdates({});
    }
  }, [open, mode]);

  const classes = useStyles();

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Task";
      case "create":
        return "Create Task";
      case "edit":
        return "Edit Task";
    }
  };

  const [loading, setLoading] = React.useState(false);

  const submit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    setLoading(true);
    event.preventDefault();
    if (mode === "edit") {
      const { assignees, ...output } = taskUpdates as any;

      if (assignees) {
        const existingAssignees = new Set<string>(
          taskInit.assignees.map((u) => u.id)
        );
        const updatedAssignees = new Set<string>(assignees);

        const additions = assignees.filter(
          (id: string) => !existingAssignees.has(id)
        );
        const removed = new Array(...existingAssignees).filter(
          (id) => !updatedAssignees.has(id)
        );

        output.add_assignees = additions;
        output.remove_assignees = removed;
      }

      await onSubmit(output);
    } else {
      await onSubmit(task);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>{getTitle()}</DialogTitle>
      <form onSubmit={(event) => submit(event)}>
        <DialogContent className={classes.content}>
          {error && <Alert severity="error">{error}</Alert>}
          {mode !== "create" && (
            <Typography>
              Creator: <UserChip link user={task.creator} />
            </Typography>
          )}
          <TextField
            className={classes.fullWidthInput}
            required
            disabled={mode === "view" || loading}
            label="Title"
            value={task.title}
            onChange={(event) => {
              const taskUpdates_ = { ...taskUpdates };
              taskUpdates_.title = event.target.value;
              setTaskUpdates(taskUpdates_);
            }}
          />
          <TextField
            className={classes.fullWidthInput}
            required
            disabled={mode === "view" || loading}
            multiline
            rows={10}
            label="Description"
            value={task.description}
            onChange={(event) => {
              const taskUpdates_ = { ...taskUpdates };
              taskUpdates_.description = event.target.value;
              setTaskUpdates(taskUpdates_);
            }}
          />
          <div className={classes.row}>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <KeyboardDatePicker
                disabled={mode === "view" || loading}
                disableToolbar
                variant="inline"
                format="DD/MM/yyyy"
                margin="normal"
                label="Due date"
                value={task.deadline}
                onChange={(date) => {
                  const taskUpdates_ = { ...taskUpdates };
                  taskUpdates_.deadline = date!;
                  setTaskUpdates(taskUpdates_);
                }}
              />
              <KeyboardTimePicker
                disabled={mode === "view" || loading}
                margin="normal"
                label="Due time"
                value={task.deadline}
                onChange={(date) => {
                  const taskUpdates_ = { ...taskUpdates };
                  taskUpdates_.deadline = date!;
                  setTaskUpdates(taskUpdates_);
                }}
              />
            </MuiPickersUtilsProvider>
          </div>
          <div className={classes.row}>
            <Select
              variant="outlined"
              disabled={mode === "view" || loading}
              value={task.status}
              onChange={(event) => {
                const taskUpdates_ = { ...taskUpdates };
                taskUpdates_.status = event.target.value as any as TaskStatus;
                setTaskUpdates(taskUpdates_);
              }}
            >
              <MenuItem value={TaskStatus.TO_DO}>To Do</MenuItem>
              <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
              <MenuItem value={TaskStatus.BLOCKED}>Blocked</MenuItem>
              <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
            </Select>
            <NumericInput
              disabled={mode === "view" || loading}
              variant="outlined"
              precision="2"
              decimalSeparator="."
              thousandSeparator=""
              label="Estimated Days"
              value={task.estimated_days}
              onChange={(value) => {
                const taskUpdates_ = { ...taskUpdates };
                taskUpdates_.estimated_days = value;
                setTaskUpdates(taskUpdates_);
              }}
            />
          </div>
          <div>
            <div className={classes.row}>
              <FormControl>
                <Select
                  multiple
                  displayEmpty
                  disabled={mode === "view" || loading}
                  value={task.assignees}
                  renderValue={(value) => {
                    const ids = value as string[];
                    return (
                      <div className={classes.chips}>
                        {ids.length ? (
                          ids.map((id) => {
                            const user = usersMap[id];
                            if (!user) return null;
                            return <UserChip key={id} user={user} />;
                          })
                        ) : (
                          <Typography variant="body1">Assignees</Typography>
                        )}
                      </div>
                    );
                  }}
                  onChange={(event) => {
                    const assignees = event.target.value as any;
                    setTaskUpdates({ ...taskUpdates, assignees });
                  }}
                  variant="outlined"
                >
                  {!connectedUsers && (
                    <MenuItem disabled value="">
                      Loading...
                    </MenuItem>
                  )}
                  {connectedUsers?.length === 0 && (
                    <MenuItem disabled value="">
                      No Connections
                    </MenuItem>
                  )}
                  {connectedUsers?.length !== 0 && user && (
                    <MenuItem key={user.id} value={user.id}>
                      You ({user.first_name} {user.last_name})
                    </MenuItem>
                  )}
                  {connectedUsers?.map((user, i) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  If you leave this empty, you&apos;ll be assigned by default.
                </FormHelperText>
              </FormControl>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button size="large" disabled={loading} onClick={() => onClose()}>
            Cancel
          </Button>
          {mode === "edit" ? (
            <Button size="large" onClick={() => onDelete()} disabled={loading}>
              Delete
            </Button>
          ) : null}
          <Button
            size="large"
            color="primary"
            variant="contained"
            type="submit"
            disabled={loading}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskModal;
