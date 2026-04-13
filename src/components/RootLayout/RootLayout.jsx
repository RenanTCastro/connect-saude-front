import { Outlet } from "react-router-dom";
import CookieBanner from "../CookieBanner/CookieBanner";

export default function RootLayout() {
  return (
    <>
      <Outlet />
      <CookieBanner />
    </>
  );
}
