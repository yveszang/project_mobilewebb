import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddClass from "./pages/AddClass";
import EditProfile from "./pages/EditProfile";
import ManageClass from "./pages/ManageClass";
import CheckinPage from "./pages/CheckinPage";
import QAPage from "./pages/QAPage";
import "./index.css"; 
import "bootstrap/dist/css/bootstrap.min.css";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-class" element={<AddClass />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/manage-class/:classId" element={<ManageClass />} />
        <Route path="/checkin/:classId" element={<CheckinPage />} />
        <Route path="/qa/:classId" element={<QAPage />} />
      </Routes>
    </Router>
  );
}

export default App;
