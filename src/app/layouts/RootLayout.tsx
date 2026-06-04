import { Outlet } from "react-router";
import { AppSidebar } from "../components/AppSidebar";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <AppSidebar />
      <main className="relative flex-1 overflow-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}
