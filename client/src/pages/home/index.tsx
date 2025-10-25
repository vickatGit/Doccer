import { useEffect } from "react";

import { setupDocApi } from "@/api";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import chatbot from "../../assets/chatbot.png";
import check from "../../assets/check.png";
import files from "../../assets/files.png";

const index = () => {
  const navigate = useNavigate();
  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (auth) => {
      const env = import.meta.env.VITE_ENV;
      const devBaseurl = import.meta.env.VITE_DEV_BASE_URL;
      const prodBaseurl = import.meta.env.VITE_PROD_BASE_URL;
      const baseUrl = env === "dev" ? devBaseurl : prodBaseurl;
      const res = await axios.post(`${baseUrl}/api/auth/google`, {
        token: auth.code,
      });
      const authToken = res.data.authToken;
      localStorage.setItem("authToken", authToken);
      setupDocApi(authToken);
      navigate("/chat");
    },
  });
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken && authToken.trim()) {
      navigate("/chat");
    }
  }, []);

  return (
    <div className="absolute flex justify-center inset-0 z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(145%_135%_at_50%_10%,#000_30%,#7D50DC_50%,#E5DCFA_70%)] ">
      <div className="absolute top-5 right-5 flex gap-2">
        {/* Login */}
        {/* <div
          onClick={() => login()}
          className="
      bg-primary px-5 py-1 rounded-full cursor-pointer shadow-2xl
      border-2 border-transparent 
      hover:border-[#613EAB] 
      transition
    "
        >
          <p className="text-secondary text-[0.7rem] font-bold">Login</p>
        </div> */}

        {/* Signup */}
        <div
          className="
      bg-secondary px-5 py-1 rounded-full cursor-pointer shadow-2xl
      border-2 border-transparent 
      hover:border-[#613EAB] 
      transition
    "
          onClick={() => login()}
        >
          <p className="text-primary text-[0.7rem] font-bold">Login</p>
        </div>
      </div>

      <div className=" w-[60%] flex flex-col justify-center items-center">
        <div className="flex items-center w-[60%] justify-between">
          <div className="w-16 h-16 rounded-full overflow-hidden  p-2 border border-[#2B1E52] ">
            <div className="w-full h-full rounded-full  border border-[#2B1E52] p-3.5">
              <img src={files} />
            </div>
          </div>
          <hr className="flex-1 border-[#2B1E52] border-[0.05rem]" />
          <div className="w-20 h-20 rounded-full overflow-hidden  p-4 border border-[#2B1E52] [background:radial-gradient(145%_135%_at_50%_10%,#000_30%,#7D50DC_80%,#E5DCFA_95%)]">
            {/* <div className="w-full h-full rounded-full  border border-[#2B1E52] p-3"> */}
            <img src={chatbot} />
            {/* </div> */}
          </div>
          <hr className="flex-1 border-[#2B1E52] border-[0.05rem]" />
          <div className="w-16 h-16 rounded-full overflow-hidden  p-2 border border-[#2B1E52]">
            <div className="w-full h-full rounded-full  border border-[#2B1E52] p-3.5">
              <img src={check} />
            </div>
          </div>
        </div>
        <p className="text-5xl font-medium text-center leading-[4rem] mt-20 text-white">
          Because Reading the Whole Document Is Overrated
        </p>
        <p className="text-md font-medium text-center mt-5 text-[#d5cedc]">
          Skip the hassle of skimming.
          <br /> Upload,ask, and move on like a boss.
        </p>

        <div
          onClick={() => login()}
          className="
        bg-white px-8 py-2.5 rounded-full mt-20 cursor-pointer shadow-2xl"
        >
          <p className="text-[0.9rem] font-medium text-black">Get Started</p>
        </div>
      </div>
    </div>
  );
};

export default index;
