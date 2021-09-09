import { Container, makeStyles, Typography } from "@material-ui/core";
import Spacing from "../components/shared/Spacing";
import Title from "../components/shared/Title";

interface NotFoundProps {}

const useStyles = makeStyles((theme) => ({
  heading: {
    fontWeight: "bold",
    marginBotton: theme.spacing(1),
    textAlign: "center",
  },
  textCenter: {
    textAlign: "center",
  },
}));

const NotFound: React.FC<NotFoundProps> = () => {
  const classes = useStyles();

  return (
    <Container>
      <Title>Page Not Found</Title>
      <Spacing y={4} />
      <Typography variant="h4" component="h1" className={classes.heading}>
        Page Not Found
      </Typography>
      <Spacing y={4} />
      <Typography className={classes.textCenter}>
        Use the header to get back to safety
      </Typography>
    </Container>
  );
};

export default NotFound;
