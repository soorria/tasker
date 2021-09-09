import { makeStyles, Theme } from "@material-ui/core";

interface SpacingProps {
  x?: number;
  y?: number;
}

const useStyles = makeStyles<Theme, SpacingProps>((theme) => ({
  spacing: {
    paddingTop: (props) => theme.spacing(props.y ?? 0),
    paddingLeft: (props) => theme.spacing(props.x ?? 0),
  },
}));

const Spacing: React.FC<SpacingProps> = (props) => {
  const classes = useStyles(props);
  return <div className={classes.spacing} />;
};

export default Spacing;
