import React from "react";
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
} from "@material-ui/core";
import NumericInput from "material-ui-numeric-input";
import MomentUtils from "@date-io/moment";
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from "@material-ui/pickers";

import { Task, TaskStatus } from "../../types";

const useStyles = makeStyles((theme) => ({
  fullWidthInput: {
    width: "100%",
    margin: "5px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    margin: "5px",
  },
  rowInputLeft: {
    marginRight: "2.5px",
    flex: 1,
  },
  rowInputRight: {
    marginLeft: "2.5px",
    flex: 1,
  },
}));

type CreateTaskModalProps = {
  open: boolean;
  taskInit: Task;
  onClose: () => void;
  onSubmit: (task: Task) => any;
};

const CreateTaskModal = ({
  open,
  taskInit,
  onClose,
  onSubmit,
}: CreateTaskModalProps) => {
  const [task, setTask] = React.useState(taskInit);

  const classes = useStyles();

  const submit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onSubmit(task);
  };

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>Create Task</DialogTitle>
      <form onSubmit={(event) => submit(event)}>
        <DialogContent>
          <TextField
            className={classes.fullWidthInput}
            required
            label="Title"
            value={task.title}
            onChange={(event) => {
              const task_ = { ...task };
              task_.title = event.target.value;
              setTask(task_);
            }}
          />
          <TextField
            className={classes.fullWidthInput}
            required
            multiline
            rows={10}
            label="Description"
            value={task.description}
            onChange={(event) => {
              const task_ = { ...task };
              task_.description = event.target.value;
              setTask(task_);
            }}
          />
          <div className={classes.row}>
            <MuiPickersUtilsProvider utils={MomentUtils}>
              <KeyboardDatePicker
                className={classes.rowInputLeft}
                disableToolbar
                variant="inline"
                format="DD/MM/yyyy"
                margin="normal"
                label="Due date"
                value={task.deadline}
                onChange={(date) => {
                  const task_ = { ...task };
                  task_.deadline = date!;
                  setTask(task_);
                }}
              />
              <KeyboardTimePicker
                className={classes.rowInputRight}
                margin="normal"
                label="Due time"
                value={task.deadline}
                onChange={(date) => {
                  const task_ = { ...task };
                  task_.deadline = date!;
                  setTask(task_);
                }}
              />
            </MuiPickersUtilsProvider>
          </div>
          <div className={classes.row}>
            <FormControl variant="outlined" className={classes.rowInputLeft}>
              <InputLabel id="task-status-label">Status</InputLabel>
              <Select
                labelId="task-status-label"
                value={task.status}
                onChange={(event) => {
                  const task_ = { ...task };
                  task_.status = event.target.value as any as TaskStatus;
                  setTask(task_);
                }}
              >
                <MenuItem value={TaskStatus.TO_DO}>To Do</MenuItem>
                <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TaskStatus.BLOCKED}>Blocked</MenuItem>
                <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
              </Select>
            </FormControl>
            <div className={classes.rowInputRight}>
              <NumericInput
                variant="outlined"
                precision="2"
                decimalSeparator="."
                thousandSeparator=""
                label="Estimated Days"
                value={task.estimated_days}
                onChange={(value) => {
                  const task_ = { ...task };
                  task_.estimated_days = value;
                  setTask(task_);
                }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button size="large" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button
            size="large"
            color="primary"
            variant="contained"
            type="submit"
          >
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTaskModal;
