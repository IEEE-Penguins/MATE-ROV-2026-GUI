import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen  text-white">
      {/* The New Top Navbar */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}