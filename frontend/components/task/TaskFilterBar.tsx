import React from "react";
import {
  makeStyles,
  Container,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
} from "@material-ui/core";
import NumericInput from "material-ui-numeric-input";
import moment from "moment";
import {
  KeyboardDatePicker,
  KeyboardTimePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";

import { TaskStatus } from "../../types";
import Spacing from "../shared/Spacing";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(2.5),
  },
  input: {
    width: theme.spacing(18),
    marginTop: theme.spacing(1),
  },
  inputDate: {
    width: theme.spacing(22),
  },
}));

export type TaskFilters = {
  title?: string;
  user_assignee?: string;
  status?: TaskStatus;
  deadline?: moment.Moment;
  estimated_days?: number;
};

type TaskFilterBarProps = {
  view: "List" | "Kanban";
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
};

const TaskFilterBar = ({ view, filters, onChange }: TaskFilterBarProps) => {
  const classes = useStyles();

  React.useEffect(() => {
    if (view === "Kanban") {
      const filters_ = { ...filters };
      delete filters_.status;
      onChange(filters_);
    }
    // eslint-disable-next-line
  }, [view]);

  return (
    <div className={classes.root}>
      <TextField
        className={classes.input}
        label="Title"
        value={filters.title ?? ""}
        onChange={(event) => {
          const filters_ = { ...filters };
          const value = event.target.value;
          if (value) {
            filters_.title = value;
          } else {
            delete filters_.title;
          }
          onChange(filters_);
        }}
      />
      {view !== "Kanban" ? (
        <>
          <Spacing x={1} />
          <FormControl className={classes.input} variant="outlined">
            <Select
              value={filters.status ?? "All"}
              onChange={(event) => {
                const filters_ = { ...filters };
                const value = event.target.value as any;
                if (value === "All") {
                  delete filters_.status;
                } else {
                  filters_.status = value;
                }
                onChange(filters_);
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value={TaskStatus.TO_DO}>To Do</MenuItem>
              <MenuItem value={TaskStatus.IN_PROGRESS}>In Progress</MenuItem>
              <MenuItem value={TaskStatus.BLOCKED}>Blocked</MenuItem>
              <MenuItem value={TaskStatus.DONE}>Done</MenuItem>
            </Select>
          </FormControl>
        </>
      ) : null}
      <Spacing x={1} />
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <KeyboardDatePicker
          className={classes.inputDate}
          disableToolbar
          variant="inline"
          format="DD/MM/yyyy"
          margin="normal"
          label="Due before date"
          value={filters.deadline}
          onChange={(date) => {
            const filters_ = { ...filters };
            filters_.deadline = date!;
            onChange(filters_);
          }}
        />
        <Spacing x={1} />
        <KeyboardTimePicker
          className={classes.inputDate}
          margin="normal"
          label="Due before time"
          value={filters.deadline}
          onChange={(date) => {
            const filters_ = { ...filters };
            filters_.deadline = date!;
            onChange(filters_);
          }}
        />
      </MuiPickersUtilsProvider>
      <Spacing x={1} />
      <div className={classes.input}>
        <NumericInput
          variant="outlined"
          precision="2"
          decimalSeparator="."
          thousandSeparator=""
          label="Estimated Days"
          value={filters.estimated_days}
          onChange={(value) => {
            const filters_ = { ...filters };
            if (value) {
              filters_.estimated_days = value;
            } else {
              delete filters_.estimated_days;
            }
            onChange(filters_);
          }}
        />
      </div>
      <Spacing x={1} />
      <Button
        size="large"
        disabled={Object.keys(filters).length === 0}
        onClick={() => onChange({})}
      >
        Clear Filters
      </Button>
    </div>
  );
};

export default TaskFilterBar;
