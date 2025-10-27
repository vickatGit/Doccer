import { RootState } from "@/store";
import {
  ArrowRightEndOnRectangleIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  FingerPrintIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userState = useSelector((state: RootState) => state.authReducer);

  const navItems = [
    { path: "/chat", icon: <HomeIcon />, label: "Home" },
    { path: "/bookmarks", icon: <BookmarkIcon />, label: "Bookmark" },
    {
      path: "/profile",
      icon: (
        <div className="w-7 h-7 shrink-0 bg-black rounded-full overflow-hidden ">
          <img src={userState.user?.img} className="object-cover" />
        </div>
      ),
      label: "Profile",
    },
    { path: "/settings", icon: <Cog6ToothIcon />, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-md px-6 py-2 flex justify-around items-center rounded-3xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex w-10 h-10 p-2 flex-col items-center justify-center gap-1 text-sm transition-all ${
              isActive
                ? "text-[#2684fc] scale-110"
                : "text-gray-700 hover:text-purple-400"
            }`}
          >
            {item.icon}
          </div>
        );
      })}
      <div
        className={`flex w-10 h-10 p-2 flex-col items-center justify-center gap-1 text-sm transition-all text-gray-700 text-purple-400"
        }`}
        onClick={() => {
          localStorage.removeItem("authToken");
          navigate("/");
        }}
      >
        {<ArrowRightEndOnRectangleIcon />}
      </div>
    </div>
  );
};

export default BottomNav;
