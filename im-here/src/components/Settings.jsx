import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"; 
import SideNav from "./SideNav";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import "./SettingsPage.css";

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

  const handlePasswordUpdate = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("No user is currently logged in.");
      return;
    }

    if (!newPassword.trim()) {
      setMessage("Please enter a new password.");
      return;
    }

    const currentPassword = prompt("Enter your CURRENT password:");
    if (!currentPassword) {
      setMessage("Password update cancelled.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword.trim());
      setMessage("✅ Password updated successfully!");
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        setMessage("❌ Current password is incorrect.");
      } else {
        setMessage("❌ Failed to update password. Try again.");
      }

	  setTimeout(() => setMessage(""), 5000);
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

			  {message && (
				<p
					style={{
					  color: message.startsWith("✅") ? "green" : "red",
					  fontWeight: "bold",
					  marginBottom: "1rem"
					}}
				>
						{message}
					</p>
				)}

                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button onClick={handlePasswordUpdate}>Update Password</button>
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
