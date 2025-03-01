
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import OrganizerHome from "./components/OrganizerHome";
import AttendeeHome from "./components/AttendeeHome";
import GroupPage from "./components/groupPage";
import SideNav from "./components/SideNav";
import AttendeeGroupPage from "./components/attendeeGroupPage";

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
        <Route path="/attendeegrouppage" element={<AttendeeGroupPage />} />


      </Routes>
    </Router>
  );
}

export default App;
