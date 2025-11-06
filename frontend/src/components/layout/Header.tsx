import React, { useEffect, useState } from "react";
import HeaderDesktop from "./HeaderDesktop";
import HeaderMobile from "./HeaderMobile";
import type { Usuario } from "../../types/usuario";

interface HeaderProps {
  user: Usuario | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isLargeScreen ? (
    <HeaderDesktop user={user} />
  ) : (
    <HeaderMobile user={user} />
  );
};

export default Header;
