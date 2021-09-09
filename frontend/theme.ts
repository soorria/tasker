import { createMuiTheme } from "@material-ui/core";

const theme = createMuiTheme({
  props: {
    MuiTextField: {
      variant: "outlined",
      fullWidth: true,
    },
    MuiDialog: {
      fullWidth: true,
    },
  },
  overrides: {
    MuiDialogActions: {
      root: {
        paddingLeft: "24px",
        paddingRight: "24px",
        paddingBottom: "16px",
      },
    },
  },
});

export default theme;
