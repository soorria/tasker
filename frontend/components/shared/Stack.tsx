import { makeStyles, Theme } from "@material-ui/core";

interface StackProps {
  spacing: number;
}

const useStyles = makeStyles<Theme, StackProps>((theme) => ({
  stack: {
    "& > * + *": {
      marginTop: (props) => theme.spacing(props.spacing),
    },
  },
}));

const Stack: React.FC<StackProps> = (props) => {
  const classes = useStyles(props);

  return <div className={classes.stack}>{props.children}</div>;
};

export default Stack;
