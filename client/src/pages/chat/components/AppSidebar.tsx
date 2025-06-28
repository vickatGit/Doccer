import { AppDispatch, RootState } from "@/store";
import { setSelectedPage } from "@/store/reducers/chat";
import {
  ArrowRightEndOnRectangleIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  FingerPrintIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "../../../components/ui/sidebar";

const AppSidebar = () => {
  const userState = useSelector((state: RootState) => state.authReducer);
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <FingerPrintIcon className="text-accent-purple" />
      </SidebarHeader>
      <hr />
      <SidebarContent className="mt-5 flex flex-col">
        <div
          className={`mx-2 p-[0.55rem] rounded-md ${
            chatState.selectedPage === "Home" && "bg-primary/10"
          } hover:bg-primary/10`}
          onClick={() => {
            dispatch(setSelectedPage("Home"));
          }}
        >
          <HomeIcon />
        </div>
        <div
          className={`mx-2 p-[0.55rem] rounded-md ${
            chatState.selectedPage === "Settings" && "bg-primary/10"
          } hover:bg-primary/10`}
          onClick={() => {
            dispatch(setSelectedPage("Settings"));
          }}
        >
          <Cog6ToothIcon />
        </div>
        <div
          className={`mx-2 p-[0.55rem] rounded-md ${
            chatState.selectedPage === "Saved" && "bg-primary/10"
          } hover:bg-primary/10`}
          onClick={() => {
            dispatch(setSelectedPage("Saved"));
          }}
        >
          <BookmarkIcon />
        </div>
      </SidebarContent>
      <SidebarFooter>
        {userState.user && (
          <div className="flex flex-col gap-3 justify-center">
            <div className="w-8 h-8 bg-white rounded-full overflow-hidden">
              <img src={userState.user?.img} className="object-cover" />
            </div>
            <div
              className="p-[0.55rem] rounded-md hover:bg-primary/10"
              onClick={() => {
                localStorage.removeItem("authToken");
                navigate("/");
              }}
            >
              <ArrowRightEndOnRectangleIcon />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
