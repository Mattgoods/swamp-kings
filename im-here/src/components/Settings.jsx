import React, { useState, useEffect } from "react";
import { auth } from "../firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import SideNav from "./SideNav"; // ✅ Import the shared SideNav
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import "./SettingsPage.css"; // Import CSS file

const SettingsPage = () => {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [activePage, setActivePage] = useState("settings");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // ✅ Check if the user exists in "teachers" collection
          const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            setFullName(teacherData.fullName);
            setEmail(user.email); // Firebase provides the email directly
            setUserRole("Organizer");
            setLoading(false);
            return;
          }

          // ✅ If not in "teachers", check "users" collection
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFullName(userData.fullName);
            setEmail(user.email);
            setUserRole("Attendee");
            setLoading(false);
            return;
          }

          // If user not found in either collection
          console.error("User not found in either collection.");
          setLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <div className="settings-page-wrapper">
      <SideNav 
        activePage={activePage} 
        setActivePage={setActivePage} 
        handleLogout={handleLogout} 
        confirmLogout={confirmLogout}   
        setConfirmLogout={setConfirmLogout} 
      />
      
      {/* ✅ Apply .settings-page styles here */}
      <div className="settings-page">
        <main className="settings-content">
          <h1>Account Settings</h1>
          {loading ? <p>Loading...</p> : (
            <>
              {/* User Details */}
              <div className="settings-section">
                <h2>Your Information</h2>
                <p><strong>Name:</strong> {fullName}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Role:</strong> {userRole}</p>
              </div>

              {/* Change Password */}
              <div className="settings-section">
                <h2>Change Password</h2>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button>Update Password</button>
              </div>

              {/* Account Deletion */}
              <div className="settings-section delete-account">
                <h2>Delete Account</h2>
                <p>⚠ This action is irreversible!</p>
                <button className="delete-button">
                  {confirmDelete ? "Confirm Delete?" : "Delete Account"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
