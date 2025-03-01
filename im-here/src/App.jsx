
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import OrganizerHome from "./components/OrganizerHome";
import AttendeeHome from "./components/AttendeeHome";
import GroupPage from "./components/groupPage";
import SideNav from "./components/SideNav";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/organizerhome" element={<OrganizerHome />} />
        <Route path="/attendeehome" element={<AttendeeHome />} />
        <Route path="/grouppage" element={<GroupPage />} />

      </Routes>
    </Router>
  );
}

export default App;
