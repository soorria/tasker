import { InputBase, makeStyles, fade } from "@material-ui/core";
import Search from "@material-ui/icons/Search";
import { useRouter } from "next/router";
import { FormEventHandler, useState } from "react";
import { useSearchUserByEmail } from "../../api";

const useStyles = makeStyles((theme) => ({
  search: {
    color: "white",
    display: "flex",
    background: fade(theme.palette.common.white, 0.15),
    transition: "all 150ms ease-in-out",
    borderRadius: theme.shape.borderRadius,
    alignItems: "center",
    "&:hover, &:focus-within": {
      background: fade(theme.palette.common.white, 0.25),
    },
    padding: theme.spacing(1, 2),
    "& > * + *": {
      marginLeft: theme.spacing(1),
    },
  },
  searchInputWrapper: {
    color: "white",
  },
  searchInput: {
    padding: 0,
  },
}));

const UserSearch: React.FC = () => {
  const classes = useStyles();
  const [isSearching, setIsSearching] = useState(false);
  const searchUserByEmail = useSearchUserByEmail();

  const router = useRouter();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setIsSearching(true);

    const form = event.currentTarget;
    const email = (form?.elements as any)?.email?.value;

    try {
      const user = await searchUserByEmail(email);
      if (user?.id) {
        await router.push(`/profile/${user.id}`);
        form.reset();
      } else {
        router.push(`/profile/not-found?email=${encodeURIComponent(email)}`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={classes.search}>
        <Search />
        <InputBase
          type="email"
          name="email"
          id="email"
          placeholder="Search Users"
          className={classes.searchInputWrapper}
          inputProps={{ className: classes.searchInput }}
          autoComplete="off"
          disabled={isSearching}
          required
        />
      </div>
    </form>
  );
};

export default UserSearch;
