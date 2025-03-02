import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchUserInfo, removeStudentFromGroup, addStudentToGroup } from "../firebase/firebaseGroups";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "./GroupPage.css";
import SideNav from "../components/SideNav";

const GroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  const [activePage, setActivePage] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("student");
  const [attendeeDetails, setAttendeeDetails] = useState([]);
  const [pastClasses, setPastClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");

  // State for selected students
  const [selectedStudents, setSelectedStudents] = useState([]);

  // State for adding a student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");

  // Fetch attendee details
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!group?.id) return;

      try {
        const groupRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const attendeeIds = groupData.attendees || [];

          const attendeePromises = attendeeIds.map((userId) => fetchUserInfo(userId));
          const attendeeData = await Promise.all(attendeePromises);
          setAttendeeDetails(attendeeData.filter((user) => user !== null));
        }
      } catch (error) {
        console.error("❌ Error fetching attendees:", error);
      }
    };

    fetchAttendees();
  }, [group]);

  // Fetch past class sessions
  useEffect(() => {
    const fetchPastClasses = async () => {
      if (!group?.id) return;

      try {
        const classRef = collection(db, "groups", group.id, "classHistory");
        const classSnap = await getDocs(classRef);
        let pastSessions = [];

        classSnap.forEach((doc) => {
          const session = doc.data();
          pastSessions.push({ id: doc.id, ...session });
        });

        setPastClasses(pastSessions);
      } catch (error) {
        console.error("❌ Error fetching past classes:", error);
      }
    };

    fetchPastClasses();
  }, [group]);

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    console.log("selected ", studentId);
    setSelectedStudents((prevSelected) => {
      if (prevSelected.includes(studentId)) {
        // Remove this student ID
        return prevSelected.filter(id => id !== studentId);
      } else {
        // Add this student ID
        return [...prevSelected, studentId];
      }
    });
  };

  // Remove selected students
  const handleRemoveSelectedStudents = async () => {
    if (selectedStudents.length === 0) {
      alert("Select at least one student to remove.");
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        await removeStudentFromGroup(group.id, studentId);
      }

      // Update the list
      setAttendeeDetails((prevAttendees) =>
        prevAttendees.filter((attendee) => !selectedStudents.includes(attendee.id))
      );
      setSelectedStudents([]);
      alert("✅ Selected students removed successfully.");
    } catch (error) {
      console.error("❌ Error removing students:", error);
    }
  };
  // Add a new student
  

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setNewStudentId("");
  };

  // Add a new student
  const handleAddStudent = async () => {
    if (!newStudentId.trim()) {
      alert("Please enter a valid student ID.");
      return;
    }

    try {
      await addStudentToGroup(group.id, newStudentId);

      setAttendeeDetails([...attendeeDetails, { id: newStudentId, fullName: `Student ${newStudentId}`, email: "" }]);
      closeModal();
      alert(`✅ Student "${newStudentId}" added successfully.`);
    } catch (error) {
      console.error("❌ Error adding student:", error);
    }
  };

  if (!group) {
    return (
      <div className="group-page">
        <p>No group data found. <a href="/organizerhome">⬅ Go Back</a></p>
      </div>
    );
  }


  return (
    <div className="group-page">
      <SideNav activePage={activePage} setActivePage={setActivePage} />

      <main className="group-content">
        <h1>{group.groupName}</h1>
        <p>📍 {group.location || "No location set"}</p>
        <p>📅 {group.meetingDays?.join(", ") || "No days selected"} at {group.meetingTime || "No time set"}</p>

        <div className="tab-menu">
          <button className={activeTab === "student" ? "active" : ""} onClick={() => setActiveTab("student")}>
            📋 Students
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            📜 Class History
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            ⚙ Group Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "student" && (
            <div>
              <h3>📋 Student List</h3>
              <br></br>
              {attendeeDetails.length > 0 ? (
                <ul className="student-list">
                {attendeeDetails.map((attendee) => (
                  <li key={attendee.uid} className="student-item">
                    <input
                      type="checkbox"
                      uid={`student-${attendee.uid}`} // Ensure unique uid for each checkbox
                      className="student-checkbox"
                      checked={selectedStudents.includes(attendee.uid)}
                      onChange={() => toggleStudentSelection(attendee.uid)}
                    />
                    <label htmlFor={`student-${attendee.id}`} className="student-name">
                      <strong>{attendee.fullName}</strong> - {attendee.email}
                    </label>
                  </li>
                ))}
              </ul>
              
              
              ) : (
                <p>No students have joined this group yet.</p>
              )}
            </div>
          )}
        </div>
        <div className="button-container">
  <button className="button back-button" onClick={() => navigate("/organizerhome")}>
    ⬅ Back to Organizer Home
  </button>
  
  <button className="button primary add-student" onClick={openModal}>
    ✅ Add Student
  </button>

  <button className="button danger remove-student" onClick={handleRemoveSelectedStudents}>
    ❌ Remove Selected Students
  </button>
</div>

{/* Add Student Modal */}
{isModalOpen && (
  <div className="modal">
    <div className="modal-content">
      <h3>Add Student</h3>
      <input
        type="text"
        placeholder="Enter Student ID"
        value={newStudentId}
        onChange={(e) => setNewStudentId(e.target.value)}
      />
      <button className="button primary" onClick={handleAddStudent}>
        Add
      </button>
      <button className="button danger" onClick={closeModal}>
        Cancel
      </button>
    </div>
  </div>
)}

      </main>
    </div>
  );
};

export default GroupPage;