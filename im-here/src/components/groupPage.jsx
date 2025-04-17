import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SideNav from "../components/SideNav";
import "./GroupPage.css";
import { auth, db } from "../firebase/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  setDoc,
  addDoc
} from "firebase/firestore";
import {
  fetchOrganizerGroups,
  leaveGroup,
  deleteGroups,
  removeStudentFromGroup
} from "../firebase/firebaseGroups";
import { signOut } from "firebase/auth";
import { saveAs } from "file-saver";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Helper function to format seconds as mm:ss
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const formatDateTime = (isoString) => {
	if (!isoString) return "";
	const date = new Date(isoString);
	return date.toLocaleString(undefined, {
	  dateStyle: "medium",
	  timeStyle: "short",
	});
};
  

const OrganizerGroupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const group = location.state?.group;

  // Page and tab states – default active tab is "group"
  const [activePage, setActivePage] = useState("group");
  // Active tab options: "active", "upcoming", "student", "history", "settings"
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Data for tabs
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [attendeeDetails, setAttendeeDetails] = useState([]);
  // State for the active class session
  const [activeSession, setActiveSession] = useState(null);
  // Timer state (in seconds)
  const [elapsedTime, setElapsedTime] = useState(0);
  // Reference to timer interval (to clear later)
  const timerRef = useRef(null);
  // State for the leaving process in settings
  const [leaving, setLeaving] = useState(false);

  // Modal state for starting a class
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([])

  const [showManualCheckInModal, setShowManualCheckInModal] = useState(false);
  const [manualCheckInStudentId, setManualCheckInStudentId] = useState("");

  // Unique cache keys for sessions (based on group ID)
  const upcomingKey = group ? `upcoming_${group.id}` : "upcoming";
  const pastKey = group ? `past_${group.id}` : "past";

  const [groupData, setGroupData] = useState(group); // Local state for group data

  // Fetch attendee details (for the Students tab)
  useEffect(() => {
    const fetchAttendees = async () => {
      if (!group?.id) return;
      try {
        const groupRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const attendeeIds = groupData.attendees || [];
          // For each attendeeId, get user info from "users" collection
          const attendeePromises = attendeeIds.map((uid) =>
            getDoc(doc(db, "users", uid)).then((snap) =>
              snap.exists() ? { id: uid, ...snap.data() } : null
            )
          );
          const attendees = (await Promise.all(attendeePromises)).filter(
            (u) => u !== null
          );
          setAttendeeDetails(attendees);
        }
      } catch (error) {
        console.error("❌ Error fetching attendees:", error);
      }
    };
    fetchAttendees();
  }, [group]);

  // Fetch sessions from Firestore, split them into upcoming and past, and cache them
  const fetchSessions = async () => {
    if (!group?.id) return;
    try {
      const classRef = collection(db, "groups", group.id, "classHistory");
      const classSnap = await getDocs(classRef);
      let sessions = [];
      classSnap.forEach((docSnap) => {
        sessions.push({ id: docSnap.id, ...docSnap.data() });
      });
      const today = new Date();
      // Upcoming sessions: date in future and not ended
      const upcoming = sessions.filter(
        (session) => new Date(session.date) >= today && !session.ended
      );
      // Past sessions: date in past or explicitly ended
      const past = sessions.filter(
        (session) => new Date(session.date) < today || session.ended === true
      );
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      past.sort((a, b) => new Date(b.date) - new Date(a.date));
      setUpcomingSessions(upcoming);
      setPastSessions(past);
      sessionStorage.setItem(upcomingKey, JSON.stringify(upcoming));
      sessionStorage.setItem(pastKey, JSON.stringify(past));
    } catch (error) {
      console.error("❌ Error fetching sessions:", error);
    }
  };

  // When activeTab is "upcoming" or "history", load sessions from cache or fetch them
  useEffect(() => {
    if ((activeTab === "upcoming" || activeTab === "history") && group?.id) {
      const cachedUpcoming = sessionStorage.getItem(upcomingKey);
      const cachedPast = sessionStorage.getItem(pastKey);
      if (cachedUpcoming && cachedPast) {
        setUpcomingSessions(JSON.parse(cachedUpcoming));
        setPastSessions(JSON.parse(cachedPast));
      } else {
        fetchSessions();
      }
    }
  }, [activeTab, group]);

  // Clear session cache when navigating away from the group page
  useEffect(() => {
    if (activePage !== "group" && group?.id) {
      sessionStorage.removeItem(upcomingKey);
      sessionStorage.removeItem(pastKey);
    }
  }, [activePage, group]);

  // Real‑time listener on the active session (via a query)
  useEffect(() => {
    if (group?.id) {
      const classRef = collection(db, "groups", group.id, "classHistory");
      const liveQuery = query(classRef, where("isLive", "==", true));
      const unsubscribe = onSnapshot(liveQuery, (querySnapshot) => {
        let liveSession = null;
        querySnapshot.forEach((docSnap) => {
          liveSession = { id: docSnap.id, ...docSnap.data() };
        });
        setActiveSession(liveSession);
      });
      return () => unsubscribe();
    }
  }, [group]);

  // Fallback fetch for active session on mount
  const fetchActiveSession = async () => {
    if (!group?.id) return;
    try {
      const classRef = collection(db, "groups", group.id, "classHistory");
      const classSnap = await getDocs(classRef);
      let liveSession = null;
      classSnap.forEach((docSnap) => {
        const session = { id: docSnap.id, ...docSnap.data() };
        if (session.isLive) {
          liveSession = session;
        }
      });
      if (liveSession) {
        setActiveSession(liveSession);
        setActiveTab("active");
      }
    } catch (error) {
      console.error("❌ Error fetching active session:", error);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, [group]);

  // Timer: start when active session is live and has a startTime.
  useEffect(() => {
    // Clear any existing interval first.
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (activeSession && activeSession.isLive && activeSession.startTime) {
      const start = new Date(activeSession.startTime);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - start) / 1000));
      }, 1000);
    } else {
      // If no active session or session ended, clear timer.
      setElapsedTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  // Handle starting a class: also record startTime in Firestore.
  const handleStartClass = async () => {
    if (!selectedSession) return;
    const inputClassName = window.prompt("Enter the class name:");
    if (!inputClassName) {
      alert("Class name is required to start a class.");
      return;
    }
    try {
      const sessionRef = doc(
        db,
        "groups",
        group.id,
        "classHistory",
        selectedSession.id
      );
      const groupRef = doc(db, "groups", group.id);
      const startTime = new Date().toISOString();
      await updateDoc(sessionRef, {
        isLive: true,
        startTime,
        className: inputClassName,
      });
      const updatedGroupSnap = await getDoc(groupRef);
      // emailRef.on('value', (snapshot) => {
      //   console.log(snapshot.val());
      // }, (errorObject) => {
      //   console.log('The read failed: ' + errorObject.name);
      // }); 
      let email_arr = [];
      if (updatedGroupSnap.exists()) {
        email_arr = updatedGroupSnap.data().attendees_email;
        console.log(updatedGroupSnap.data().attendees_email);
      } else {
        console.log('No such document!');
        return null;
      }
      await addDoc(collection(db, "mail"), {
        to: email_arr,
        message: {
          html: "This is the <code>HTML</code> section of the email body.",
          subject: "imHere: Class '" + inputClassName + "' is starting",
          text: "This is the plaintext portion of the email."
        }
      });
      alert("Class has been started and is now live.");
      const liveSession = {
        ...selectedSession,
        isLive: true,
        startTime,
        className: inputClassName,
      };
      setActiveSession(liveSession);
      // Remove from upcoming
      setUpcomingSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setActiveTab("active");
      closeModal();
    } catch (error) {
      console.error("❌ Error starting class:", error);
      alert("Failed to start class.");
    }
  };

  // Handle ending a class: record endTime and update attendees' leave times.
  const handleEndClass = async () => {
    if (!activeSession) return;
    try {
      const endTime = new Date().toISOString();
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      const sessionSnap = await getDoc(sessionRef);
      let updatedAttendees = [];
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        const attendees = data.attendees || [];
        updatedAttendees = attendees.map((record) =>
          record.left ? record : { ...record, left: endTime }
        );
      }
      await updateDoc(sessionRef, {
        isLive: false,
        ended: true,
        endTime,
        attendees: updatedAttendees,
      });
      alert("Class has ended.");
      setActiveSession(null);
      await fetchSessions();
      setActiveTab("history");
    } catch (error) {
      console.error("❌ Error ending class:", error);
      alert("Failed to end class.");
    }
  };

  const handleManualCheckIn = async () => {
    if (!activeSession || !manualCheckInStudentId) return;

    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      // Can prompt or just use new Date
      const joinedTime = new Date().toISOString();

      await updateDoc(sessionRef, {
        attendees: arrayUnion({
          id: manualCheckInStudentId,
          joined: joinedTime,
        }),
      });

      alert("Manually checked in student: " + manualCheckInStudentId);
      setShowManualCheckInModal(false);
      setManualCheckInStudentId("");
    } catch (error) {
      console.error("❌ Error manually checking in student:", error);
      alert("Failed to manually check in student.");
    }
  };

  const handleEditAttendance = async (attendee) => {
    const newJoined = window.prompt("Enter new joined time (ISO string)", attendee.joined);
    if (!newJoined) return; // if they canceled
    const newLeft = window.prompt("Enter new left time or leave blank", attendee.left || "");
    // Build updated object
    const updatedAttendee = {
      ...attendee,
      joined: newJoined,
    };
    if (newLeft) updatedAttendee.left = newLeft;

    try {
      const sessionRef = doc(db, "groups", group.id, "classHistory", activeSession.id);
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) return;
      const sessionData = sessionSnap.data();
      const oldList = sessionData.attendees || [];
      // Replace the old record with the updated one
      const newList = oldList.map((a) => (a.id === attendee.id ? updatedAttendee : a));
      await updateDoc(sessionRef, { attendees: newList });
      alert("Attendance updated for " + attendee.id);
    } catch (error) {
      console.error("❌ Error editing attendance:", error);
      alert("Failed to edit attendance record.");
    }
  };

  // Handle deleting the group.
  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteGroups([group.id]);
      alert("Group deleted successfully.");
      navigate("/organizerhome");
    } catch (error) {
      console.error("❌ Error deleting group:", error);
      alert("Failed to delete group.");
    }
  };

  // Leave Group handler
  const handleLeaveGroup = async () => {
    setLeaving(true);
    try {
      await leaveGroup(group.id, auth.currentUser.uid);
      alert("You have left the group.");
      navigate("/organizerhome");
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      alert("Failed to leave group.");
    } finally {
      setLeaving(false);
    }
  };

  const refreshGroupData = async () => {
    if (!group?.id) return;
    try {
      const groupRef = doc(db, "groups", group.id);
      const updatedGroupSnap = await getDoc(groupRef);
      if (updatedGroupSnap.exists()) {
        const updatedGroup = { id: updatedGroupSnap.id, ...updatedGroupSnap.data() };
        setGroupData(updatedGroup); // Update local state with new group data
      }
    } catch (error) {
      console.error("❌ Error refreshing group data:", error);
    }
  };

  const handleUpdateGroupField = async (field, newValue) => {
    if (!group?.id) return;
    try {
      const groupRef = doc(db, "groups", group.id);
      await updateDoc(groupRef, { [field]: newValue });
      alert(`${field} updated successfully.`);
      await refreshGroupData(); // Refresh group data after the update
    } catch (error) {
      console.error(`❌ Error updating ${field}:`, error);
      alert(`Failed to update ${field}.`);
    }
  };

  const handleAddStudentToGroup = async () => {
    if (!newStudentEmail) return;
    setAddingStudent(true);

    try {
      // Find user doc by email
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", newStudentEmail));
      const results = await getDocs(q);
      if (results.empty) {
        alert("No user found with that email.");
        setAddingStudent(false);
        return;
      }
      // For simplicity, assume first match
      const matchedUser = results.docs[0];
      const studentId = matchedUser.id;

      // 1) Add the student to the group's 'attendees' array
      const groupRef = doc(db, "groups", group.id);
      await updateDoc(groupRef, {
        attendees: arrayUnion(studentId),
      });

      const emailRef = doc(db, "groups", group.id);
      await updateDoc(emailRef, {
        attendees_email: arrayUnion(newStudentEmail),
      });

      console.log(newStudentEmail);

      // 2) Add the groupId to the student's 'groups' array
      const studentRef = doc(db, "users", studentId);
      await updateDoc(studentRef, {
        groups: arrayUnion(group.id),
      });

      alert("Student added successfully!");
      setNewStudentEmail("");
      setShowAddStudentModal(false);
      // Re-fetch the group’s attendee details
      const updatedSnap = await getDoc(groupRef);
      if (updatedSnap.exists()) {
        const gdata = updatedSnap.data();
        const attendeeIds = gdata.attendees || [];
        const attendeePromises = attendeeIds.map((uid) =>
          getDoc(doc(db, "users", uid)).then((snap) =>
            snap.exists() ? { id: uid, ...snap.data() } : null
          )
        );
        const attendees = (await Promise.all(attendeePromises)).filter((u) => u !== null);
        setAttendeeDetails(attendees);
      }
    } catch (error) {
      console.error("❌ Error adding student:", error);
      alert("Could not add student.");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveSelectedStudents = async () => {
	    if (selectedStudentIds.length === 0) {
	      alert("No students selected.");
	      return;
	    }
	    const confirmed = window.confirm(
	      `Are you sure you want to remove ${selectedStudentIds.length} student(s) from this group?`
	    );
	    if (!confirmed) return;
	
	    try {
	      // Remove each selected student
	      for (const studentId of selectedStudentIds) {
	        await removeStudentFromGroup(group.id, studentId);
	      }
	      alert("Selected students have been removed.");
	
	      // Clear selection
	      setSelectedStudentIds([]);
	
	      // Refresh the attendee list so removed students disappear
	      const groupRef = doc(db, "groups", group.id);
	      const groupSnap = await getDoc(groupRef);
	      if (groupSnap.exists()) {
	        const gdata = groupSnap.data();
	        const attendeeIds = gdata.attendees || [];
	        const promises = attendeeIds.map((uid) =>
	          getDoc(doc(db, "users", uid)).then((snap) =>
	            snap.exists() ? { id: uid, ...snap.data() } : null
	          )
	        );
	        const updatedAttendees = (await Promise.all(promises)).filter(Boolean);
	        setAttendeeDetails(updatedAttendees);
	      }
	    } catch (error) {
	      console.error("Error removing students:", error);
	      alert("Failed to remove one or more students.");
	    }
	  };
	

  // Logout function for SideNav
  const handleLogout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
    } else {
      try {
        await signOut(auth);
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  const exportHistoryToCSV = () => {
    if (pastSessions.length === 0) {
      alert("No history data to export.");
      return;
    }
  
    const headers = ["Session Date", "Attendee Name", "Joined Time", "Left Time"];
    const rows = [];
  
    pastSessions.forEach((session) => {
      const sessionDate = formatDateTime(session.date);
      (session.attendees || []).forEach((att) => {
        const student = attendeeDetails.find((s) => s.id === att.id);
        const attendeeName = student?.fullName || att.id;
        const joinedTime = formatDateTime(att.joined);
        const leftTime = att.left ? formatDateTime(att.left) : "";
        rows.push([sessionDate, attendeeName, joinedTime, leftTime]);
      });
    });
  
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${group.groupName}_history.csv`);
  };

  // --- Analytics Computation ---
  // Only compute when pastSessions or attendeeDetails change
  const [analytics, setAnalytics] = useState({});
  useEffect(() => {
    if (!pastSessions || pastSessions.length === 0) {
      setAnalytics({});
      return;
    }
    // Attendance per session (by date)
    const attendanceBySession = pastSessions.map((session) => ({
      date: session.date,
      count: Array.isArray(session.attendees) ? session.attendees.length : 0,
    }));
    // Participation rate per session
    const totalMembers = attendeeDetails.length || 1;
    const participationRates = attendanceBySession.map((s) => ({
      date: s.date,
      rate: ((s.count / totalMembers) * 100).toFixed(1),
    }));
    // Average attendance
    const avgAttendance =
      attendanceBySession.reduce((sum, s) => sum + s.count, 0) /
      attendanceBySession.length;
    // Best/worst attended session
    const bestSession = attendanceBySession.reduce((a, b) => (a.count > b.count ? a : b), attendanceBySession[0]);
    const worstSession = attendanceBySession.reduce((a, b) => (a.count < b.count ? a : b), attendanceBySession[0]);
    setAnalytics({
      attendanceBySession,
      participationRates,
      avgAttendance,
      bestSession,
      worstSession,
      totalSessions: attendanceBySession.length,
    });
  }, [pastSessions, attendeeDetails]);

  if (!group) {
    return (
      <div className="group-page">
        <p>
          No group data found. <a href="/organizerhome">⬅ Go Back</a>
        </p>
      </div>
    );
  }

  // In the History tab, for each past session, calculate unique attendees and attendance ratio.
  const renderHistorySession = (session) => {
    const uniqueAttendees = new Set((session.attendees || []).map((att) => att.id));
    const uniqueCount = uniqueAttendees.size;
    const totalMembers = attendeeDetails.length || 1;
    const ratio = ((uniqueCount / totalMembers) * 100).toFixed(1);
	
    return (
      <div
        key={session.id}
        className="session-item"
        style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}
      >
        <p>
			<strong>{formatDateTime(session.date)}</strong>
        </p>
        {session.attendees && session.attendees.length > 0 && (
			<ul style={{ listStyle: "none", padding: 0 }}>
			{session.attendees.map((att) => {
				const student = attendeeDetails.find((s) => s.id === att.id);
				const displayName = student?.fullName || att.id;
				return (
					<li key={att.id}>
						{displayName} - Joined at {formatDateTime(att.joined)}
						{att.left && ` | Left at ${formatDateTime(att.left)}`}
					</li>
				);
			})}
			</ul>
        )}
        <p>
          Attendance Ratio: {uniqueCount} / {totalMembers} ({ratio}%)
        </p>
      </div>
    );
  };

  // Modal close function
  const closeModal = () => {
    setShowStartModal(false);
    setSelectedSession(null);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f4f4" }}>
      <SideNav
        activePage={activePage}
        setActivePage={setActivePage}
        handleLogout={handleLogout}
        confirmLogout={confirmLogout}
        setConfirmLogout={setConfirmLogout}
      />
      <main
        className="group-content"
        style={{ flex: 1, padding: "3rem 2.5rem", backgroundColor: "#ecf0f1" }}
      >
        <h1 style={{ marginBottom: "2.5rem", fontSize: "2.5rem", color: "#333" }}>
          {groupData.groupName}
        </h1>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📍 Location:</strong> {groupData.location || "No location set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "1rem" }}>
          <strong>📅 Meeting Days:</strong>{" "}
          {Array.isArray(groupData.meetingDays) && groupData.meetingDays.length > 0
            ? groupData.meetingDays.join(", ")
            : "No days selected"}{" "}
          at {groupData.meetingTime || "No time set"}
        </p>
        <p style={{ fontSize: "1.3rem", color: "#555", marginBottom: "2rem" }}>
          <strong>👤 Organizer:</strong> {groupData.organizerName || "Unknown Organizer"}
        </p>

        {/* Tab Menu */}
        <div className="tab-menu">
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
          >
            Active Class
          </button>
          <button
            className={activeTab === "upcoming" ? "active" : ""}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Classes
          </button>
          <button
            className={activeTab === "student" ? "active" : ""}
            onClick={() => setActiveTab("student")}
          >
            📋 Students
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            📜 History
          </button>
          <button
            className={activeTab === "settings" ? "active" : ""}
            onClick={() => setActiveTab("settings")}
          >
            ⚙ Group Settings
          </button>
          <button
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ marginBottom: "2rem" }}>
          {activeTab === "active" && (
            <div>
              <h3>Active Class</h3>
              {activeSession ? (
                <div>
                  <p>
				  	<strong>Date:</strong> {formatDateTime(activeSession.date)}
                  </p>
                  {activeSession.startTime && (
                    <p>Elapsed Time: {formatTime(elapsedTime)}</p>
                  )}
                  <h4>Attendees Checked In:</h4>
                  {activeSession.attendees && activeSession.attendees.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
						{activeSession.attendees.map((att) => {
						const student = attendeeDetails.find((s) => s.id === att.id);
						const displayName = student?.fullName || att.id;
						return (
							<li key={att.id} style={{ marginBottom: "5px" }}>
							{displayName} - Joined at {formatDateTime(att.joined)}{" "}
							{att.left && `| Left at ${formatDateTime(att.left)}`}

							<button
								style={{
								marginLeft: "10px",
								padding: "2px 6px",
								fontSize: "0.8rem",
								}}
								onClick={() => handleEditAttendance(att)}
							>
								Edit
							</button>
							</li>
						);
						})}
                    </ul>
                  ) : (
                    <p>No attendees have checked in yet.</p>
                  )}
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      className="button primary"
                      style={{ marginRight: "1rem" }}
                      onClick={() => setShowManualCheckInModal(true)}
                    >
                      + Manual Check In
                    </button>
                    <button
                      className="button danger remove-student"
                      onClick={handleEndClass}
                    >
                      End Class
                    </button>
                  </div>
                </div>
              ) : (
                <p>No active class. View upcoming classes to start a session.</p>
              )}
            </div>
          )}
          {activeTab === "upcoming" && (
            <div>
              <h3>Upcoming Classes</h3>
              {upcomingSessions.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {upcomingSessions.map((session) => (
                    <li
                      key={session.id}
                      className="session-item"
                      onClick={() => {
                        setSelectedSession(session);
                        setShowStartModal(true);
                      }}
                      style={{
                        cursor: "pointer",
                        padding: "0.5rem",
                        borderBottom: "1px solid #ccc",
                      }}
                    >
                      {formatDateTime(session.date)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No upcoming classes available.</p>
              )}
            </div>
          )}
          {activeTab === "student" && (
            <div>
              <h3>Student List</h3>
              {attendeeDetails.length > 0 ? (
                <ul className="student-list">
                  {attendeeDetails.map((student) => {
					const isSelected = selectedStudentIds.includes(student.id);
					return (
						<li key={student.id} className="student-item">
						<input
							type="checkbox"
							checked={isSelected}
							onChange={() => {
							if (isSelected) {
								setSelectedStudentIds((prev) =>
								prev.filter((id) => id !== student.id)
								);
							} else {
								setSelectedStudentIds((prev) => [...prev, student.id]);
							}
							}}
							style={{ marginRight: "8px" }}
						/>
						<strong>{student.fullName}</strong> - {student.email}
						</li>
					);
					})}
                </ul>
              ) : (
                <p>No students have joined this group yet.</p>
              )}
            </div>
          )}
          {activeTab === "history" && (
            <div>
              <h3>Class History</h3>
              <button className="button primary" onClick={exportHistoryToCSV} style={{ marginBottom: "1rem" }}>
                Export to CSV
              </button>
              {pastSessions.length > 0 ? (
                pastSessions.map((session) => renderHistorySession(session))
              ) : (
                <p>No past classes available.</p>
              )}
            </div>
          )}
          {activeTab === "settings" && (
            <div style={{ padding: "1.5rem", border: "1px solid #e9ecef", borderRadius: "8px", backgroundColor: "#ffffff" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>Settings</h3>
              <p style={{ marginBottom: "1.5rem", color: "#555" }}>Update group details below:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newName = window.prompt("Enter new group name:", group.groupName);
                    if (newName) handleUpdateGroupField("groupName", newName);
                  }}
                >
                  ✏ Update Group Name
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newLocation = window.prompt("Enter new location:", group.location);
                    if (newLocation) handleUpdateGroupField("location", newLocation);
                  }}
                >
                  ✏ Update Location
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newDays = window.prompt(
                      "Enter new meeting days (comma-separated):",
                      group.meetingDays?.join(", ")
                    );
                    if (newDays) handleUpdateGroupField("meetingDays", newDays.split(",").map((d) => d.trim()));
                  }}
                >
                  ✏ Update Meeting Days
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newTime = window.prompt("Enter new meeting time (HH:MM):", group.meetingTime);
                    if (newTime) handleUpdateGroupField("meetingTime", newTime);
                  }}
                >
                  ✏ Update Meeting Time
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newStartDate = window.prompt("Enter new start date (YYYY-MM-DD):", group.startDate);
                    if (newStartDate) handleUpdateGroupField("startDate", newStartDate);
                  }}
                >
                  ✏ Update Start Date
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newEndDate = window.prompt("Enter new end date (YYYY-MM-DD):", group.endDate);
                    if (newEndDate) handleUpdateGroupField("endDate", newEndDate);
                  }}
                >
                  ✏ Update End Date
                </button>
                <button
                  className="button primary"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={() => {
                    const newSemester = window.prompt(
                      "Enter new semester (Spring, Summer, Fall):",
                      group.semester
                    );
                    if (newSemester) handleUpdateGroupField("semester", newSemester);
                  }}
                >
                  ✏ Update Semester
                </button>
              </div>
              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <button
                  className="button danger"
                  style={{
                    padding: "0.8rem 1.5rem",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  onClick={handleDeleteGroup}
                >
                  🗑 Delete Group
                </button>
              </div>
            </div>
          )}
          {activeTab === "analytics" && (
            <div>
              <h3>Session Analytics Dashboard</h3>
              {analytics.attendanceBySession && analytics.attendanceBySession.length > 0 ? (
                <>
                  <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <h4>Attendance Over Time</h4>
                      <Line
                        data={{
                          labels: analytics.attendanceBySession.map((s) => formatDateTime(s.date)),
                          datasets: [
                            {
                              label: "Attendance",
                              data: analytics.attendanceBySession.map((s) => s.count),
                              borderColor: "#4a90e2",
                              backgroundColor: "rgba(74,144,226,0.2)",
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 300 }}>
                      <h4>Participation Rate (%)</h4>
                      <Bar
                        data={{
                          labels: analytics.participationRates.map((s) => formatDateTime(s.date)),
                          datasets: [
                            {
                              label: "Participation %",
                              data: analytics.participationRates.map((s) => s.rate),
                              backgroundColor: "#7ed957",
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: { legend: { display: false } },
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: "2rem" }}>
                    <h4>Key Stats</h4>
                    <ul>
                      <li>Average Attendance: {analytics.avgAttendance.toFixed(2)}</li>
                      <li>Total Sessions: {analytics.totalSessions}</li>
                      <li>Best Attended Session: {formatDateTime(analytics.bestSession.date)} ({analytics.bestSession.count} attendees)</li>
                      <li>Lowest Attendance: {formatDateTime(analytics.worstSession.date)} ({analytics.worstSession.count} attendees)</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p>No session data available for analytics.</p>
              )}
            </div>
          )}
        </div>

        <div className="button-container">
          <button className="button back-button" onClick={() => navigate("/organizerhome")}>
            ⬅ Back to Organizer Home
          </button>
          <button
            className="button primary add-student"
            onClick={() => setShowAddStudentModal(true)}
          >
            ✅ Add Student
          </button>
          <button
            className="button danger remove-student"
            onClick={handleRemoveSelectedStudents}
          >
            ❌ Remove Selected Students
          </button>
          <button
            className="button danger"
            onClick={handleDeleteGroup}
            style={{ marginTop: "1rem" }}
          >
            🗑 Delete Group
          </button>
        </div>
      </main>

      {/* Modal for Starting Class */}
      {showStartModal && selectedSession && (
        <div className="modal">
          <div className="modal-content">
            <h3>Start Class</h3>
            <p>
              <strong>Date:</strong> {selectedSession.date}
            </p>
            <p>
              <strong>Time:</strong> {group.meetingTime || "Not set"}
            </p>
            <div className="modal-buttons">
              <button className="button primary" onClick={handleStartClass}>
                Start Class
              </button>
              <button className="button danger" onClick={closeModal}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddStudentModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Student to Group</h3>
            <input
              type="email"
              placeholder="Student's email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              style={{ marginBottom: "1rem", padding: "0.5rem" }}
            />
            <div className="modal-buttons">
              <button
                className="button primary"
                onClick={handleAddStudentToGroup}
                disabled={addingStudent}
              >
                {addingStudent ? "Adding..." : "Add Student"}
              </button>
              <button
                className="button danger"
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudentEmail("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showManualCheckInModal && activeSession && (
        <div className="modal">
          <div className="modal-content">
            <h3>Manual Check In</h3>
            <p>Select or type the Student ID to check in:</p>
            <select
              onChange={(e) => setManualCheckInStudentId(e.target.value)}
              defaultValue=""
              style={{ width: "100%", marginBottom: "1rem" }}
            >
              <option value="" disabled>
                -- Choose Student --
              </option>
              {attendeeDetails
                .filter((student) => {
                  // exclude students who are already in the activeSession
                  const alreadyIn = activeSession.attendees?.some((a) => a.id === student.id);
                  return !alreadyIn;
                })
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.email})
                  </option>
                ))}
            </select>

            <div className="modal-buttons">
              <button className="button primary" onClick={handleManualCheckIn}>
                Check In
              </button>
              <button
                className="button danger"
                onClick={() => setShowManualCheckInModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerGroupPage;
