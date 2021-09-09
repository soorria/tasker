import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";

export const useLoggedInRedirect = () => {
  const { user } = useAuthContext();
  const { push } = useRouter();

  useEffect(() => {
    if (user) {
      push(`/profile/${user.id}`);
    }
  }, [user, push]);
};
