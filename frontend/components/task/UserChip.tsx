import NextLink from "next/link";
import { Avatar, Chip } from "@material-ui/core";
import { User } from "../../types";

interface UserChipProps {
  user: User;
  link?: boolean;
}

const UserChip: React.FC<UserChipProps> = ({ user, link = false }) => {
  if (link) {
    return (
      <NextLink href={`/profile/${user.id}`} passHref>
        <Chip
          component="a"
          clickable
          avatar={
            <Avatar
              component="span"
              src={user.avatar_url}
              alt={user.first_name}
            />
          }
          label={user.first_name}
        />
      </NextLink>
    );
  }

  return (
    <Chip
      avatar={<Avatar src={user.avatar_url} alt={user.first_name} />}
      label={user.first_name}
    />
  );
};

export default UserChip;
