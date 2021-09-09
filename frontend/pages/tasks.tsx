import React, { useEffect } from "react";
import {
  makeStyles,
  Container,
  Button,
  FormControl,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import moment from "moment";

import { useTasks, useCreateTask, useEditTask } from "../api/tasks";
import { Task, TaskStatus } from "../types";
import Spacing from "../components/shared/Spacing";
import Stack from "../components/shared/Stack";
import TaskFilterBar from "../components/task/TaskFilterBar";
import TaskListItem from "../components/task/TaskListItem";
import TaskModal from "../components/task/TaskModal";
import Title from "../components/shared/Title";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useAuthContext } from "../context/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 20,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  viewSelect: {
    width: 150,
  },
  kanbanRoot: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    "& > * + *": {
      marginLeft: theme.spacing(1),
    },
  },
  kanbanList: {
    flex: "1 0 25%",
    minHeight: 1000,
    padding: theme.spacing(1),
    backgroundColor: "#ddd",
    borderRadius: theme.shape.borderRadius,
    "& > * + *": {
      marginTop: theme.spacing(1),
    },
  },
  kanbanListDraggingOver: {
    backgroundColor: "#eee",
  },
  kanbanListTitle: {
    fontSize: 18,
    textTransform: "uppercase",
    padding: theme.spacing(1, 2.5),
  },
  textCenter: {
    textAlign: "center",
  },
}));

const statusToListLabel = (status: any) => {
  switch (status) {
    case TaskStatus.TO_DO:
      return "To Do";
    case TaskStatus.IN_PROGRESS:
      return "In Progress";
    case TaskStatus.BLOCKED:
      return "Blocked";
    case TaskStatus.DONE:
      return "Done";
  }
};

const TasksPage = () => {
  const [view, setView] = React.useState<"List" | "Kanban">("List");
  const [filters, setFilters] = React.useState({});

  const { user } = useAuthContext();

  const { data: tasks, isValidating: _tasksLoading } = useTasks(filters);

  const [tasksLoading, setTasksLoading] = React.useState(false);
  const loadingTimeout = React.useRef<any>();

  React.useEffect(() => {
    if (_tasksLoading) {
      loadingTimeout.current = setTimeout(() => {
        setTasksLoading(true);
      }, 500);
    } else {
      clearTimeout(loadingTimeout.current);
      setTasksLoading(false);
    }
  }, [_tasksLoading]);

  const editTaskCallback = useEditTask();

  const [showCreateTaskModal, setShowCreateTaskModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const defaultTask: Task = React.useMemo(
    () =>
      ({
        id: "0",
        title: "",
        description: "",
        deadline: moment().add(1, "h"),
        status: TaskStatus.TO_DO,
        estimated_days: 1,
        creator: user,
        assignees: [],
      } as any),
    // eslint-disable-next-line
    [showCreateTaskModal]
  );

  const classes = useStyles();

  const createTaskCallback = useCreateTask();

  const createTask = async (task: Task) => {
    setError(null);
    const { error } = await createTaskCallback(task);
    if (error) {
      setError(error.message);
    } else {
      setShowCreateTaskModal(false);
    }
  };

  const handleKanbanDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    // dropped in same list
    if (source.droppableId === destination.droppableId) {
      return;
    }

    const task = tasks?.find((task) => task.id === result.draggableId)!;
    editTaskCallback(task.id, {
      status: destination.droppableId as TaskStatus,
    });
  };

  return (
    <Container className={classes.root}>
      <Title>Your Tasks</Title>
      <div className={classes.row}>
        <FormControl className={classes.viewSelect} variant="outlined">
          <Select
            value={view}
            onChange={(event) =>
              setView(event.target.value as "List" | "Kanban")
            }
          >
            <MenuItem value={"List"}>List View</MenuItem>
            <MenuItem value={"Kanban"}>Kanban View</MenuItem>
          </Select>
        </FormControl>
        <Spacing x={1} />
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() =>
            setShowCreateTaskModal(
              (showCreateTaskModal) => !showCreateTaskModal
            )
          }
        >
          Create Task
        </Button>
      </div>
      <TaskFilterBar
        view={view}
        filters={filters}
        onChange={(filters) => setFilters(filters)}
      />
      <Spacing y={3} />
      {tasksLoading && (
        <Typography component="div">
          <CircularProgress size="1em" /> Loading
        </Typography>
      )}
      <Spacing y={3} />
      <TaskModal
        mode="create"
        error={error}
        open={showCreateTaskModal}
        taskInit={defaultTask}
        onClose={() => setShowCreateTaskModal(false)}
        onSubmit={async (taskUpdates) =>
          await createTask(Object.assign({} as Task, defaultTask, taskUpdates))
        }
      />
      {tasks ? (
        <>
          {view === "List" && (
            <Stack spacing={2}>
              {tasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  isEditable={task.creator.id === user?.id}
                />
              ))}
              {tasks.length === 0 && (
                <Typography>
                  {Object.keys(filters).length
                    ? "Not tasks match that filter"
                    : "Create a Task to see it here!"}
                </Typography>
              )}
            </Stack>
          )}
          {view === "Kanban" && (
            <div className={classes.kanbanRoot}>
              <DragDropContext
                onDragEnd={(result, provided) => handleKanbanDragEnd(result)}
              >
                {Object.keys(TaskStatus).map((status) => (
                  <Droppable key={status} droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        className={`${classes.kanbanList} ${
                          snapshot.isDraggingOver
                            ? classes.kanbanListDraggingOver
                            : ""
                        }`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Typography className={classes.kanbanListTitle}>
                          {statusToListLabel(status)}
                        </Typography>
                        {tasks
                          .filter((task) => task.status === status)
                          .map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskListItem
                                    task={task}
                                    isEditable
                                    showPill={false}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                      </div>
                    )}
                  </Droppable>
                ))}
              </DragDropContext>
            </div>
          )}
        </>
      ) : null}
    </Container>
  );
};

export default TasksPage;
