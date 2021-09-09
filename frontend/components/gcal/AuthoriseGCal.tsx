import {
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  makeStyles,
} from "@material-ui/core";
import CalendarToday from "@material-ui/icons/CalendarToday";
import { useState } from "react";
import {
  useDeleteCredential,
  useGetAuthUrl,
  useHasSavedCredentials,
} from "../../api/oauth";

const useStyles = makeStyles((theme) => ({
  spacing: {
    "& > * + *": {
      marginTop: theme.spacing(3),
    },
  },
}));

const AuthoriseGCal: React.FC = () => {
  const classes = useStyles();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const getAuthUrl = useGetAuthUrl();
  const deleteCredential = useDeleteCredential();
  const { data: hasSavedCredentials } = useHasSavedCredentials();

  const handleClose = () => {
    if (!loading) setShowModal(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    const authUrl = await getAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisable = async () => {
    setLoading(true);
    await deleteCredential();
    setLoading(false);
  };

  return (
    <>
      <Tooltip title={`Manage Google Calendar Integration`}>
        <IconButton color="primary" onClick={() => setShowModal(true)}>
          <CalendarToday />
        </IconButton>
      </Tooltip>

      <Dialog
        open={showModal}
        onClose={handleClose}
        aria-describedby="gcal-manage-title"
      >
        <DialogTitle id="gcal-manage-title">
          Manage Google Calendar Integration
        </DialogTitle>
        <DialogContent className={classes.spacing}>
          {hasSavedCredentials ? (
            <>
              <Typography>
                Disabling this integration means your Google Calendar won&apos;t
                get updates when you or your team creates tasks. <b>Note:</b>{" "}
                disabling this won&apos;t delete any existing calendar events.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                disableElevation
                onClick={handleDisable}
                disabled={loading}
              >
                Disable Integration
              </Button>
            </>
          ) : (
            <>
              <Typography>
                Enabling this integration will allow us to sync your
                Tasker&trade; tasks with your Google Calendar.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleEnable}
                disabled={loading}
              >
                Enable Integration
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={loading}
            onClick={handleClose}
            variant="text"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AuthoriseGCal;
