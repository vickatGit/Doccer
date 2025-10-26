import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import Doccer from "./pages/chat";
function App() {
  return (
    <div className="w-screen h-screen ">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Doccer />} />
          <Route path="/chat/:chatId" element={<Doccer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
