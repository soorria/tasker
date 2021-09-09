import { Button, Tooltip } from "@material-ui/core";
import { ConnectionStatus, PropsOf } from "../../types";

const statusToText: Record<ConnectionStatus, string> = {
  [ConnectionStatus.CONNECTED]: "Connected",
  [ConnectionStatus.UNCONNECTED]: "Request Connection",
  [ConnectionStatus.REQUESTED]: "Request Sent",
};

const statusToTooltip: Record<ConnectionStatus, string> = {
  [ConnectionStatus.CONNECTED]: "Delete Connection",
  [ConnectionStatus.UNCONNECTED]: "Request Connection",
  [ConnectionStatus.REQUESTED]: "Delete Connection",
};

type ConnectionButtonProps = {
  status: ConnectionStatus;
} & PropsOf<typeof Button>;

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  status,
  ...rest
}) => {
  return (
    <Tooltip title={statusToTooltip[status]}>
      <Button
        {...rest}
        color={status === ConnectionStatus.CONNECTED ? "default" : "primary"}
        variant="contained"
      >
        {statusToText[status]}
      </Button>
    </Tooltip>
  );
};

export default ConnectionButton;
