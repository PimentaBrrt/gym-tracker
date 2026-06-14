import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import InstallHint from "./InstallHint";

export default function AppLayout() {
  return (
    <>
      <Outlet />
      <InstallHint />
      <BottomNav />
    </>
  );
}
