import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Image from "../assets/imherelogo-transparent.png";
import Logo from "../assets/imherelogo-transparent.png";
import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/firebase";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isAttendee, setIsAttendee] = useState(false);
  const [error, setError] = useState("");
  const [focus, setFocus] = useState({ fullName: false, email: false, password: false, confirmPassword: false });
  const navigate = useNavigate();

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check role selection
    if (!isOrganizer && !isAttendee) {
      setError("Please select either Organizer or Attendee.");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine which collection to use
      const collectionName = isOrganizer ? "teachers" : "users";

      await setDoc(doc(db, collectionName, user.uid), {
        fullName: fullName,
        email: email,
        uid: user.uid,
        role: isOrganizer ? "Organizer" : "Attendee",
        groups: [],
        createdAt: new Date(),
      });

      console.log(`User stored in Firestore: ${collectionName}`);
      alert("Account created successfully!");
      navigate("/login");
    } catch (error) {
      setError(error.message);
      console.error("Error creating account:", error.message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      // 1) Open Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2) Check if user is already in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const teacherDocRef = doc(db, "teachers", user.uid);
      const userSnap = await getDoc(userDocRef);
      const teacherSnap = await getDoc(teacherDocRef);

      if (!userSnap.exists() && !teacherSnap.exists()) {
        // 3) If brand new, decide or ask about role
        const chosenRole = window.prompt("Are you an Organizer or an Attendee?");

        if (!chosenRole) {
          // If they clicked "Cancel" or typed nothing, default to Attendee
          await setDoc(userDocRef, {
            fullName: user.displayName,
            email: user.email,
            uid: user.uid,
            role: "Attendee",
            groups: [],
            createdAt: new Date(),
          });
          alert("No role selected, so we defaulted you to Attendee.");
          navigate("/attendeehome");
          return;
        }

        const normalizedRole = chosenRole.toLowerCase();
        if (normalizedRole === "organizer") {
          await setDoc(teacherDocRef, {
            fullName: user.displayName,
            email: user.email,
            uid: user.uid,
            role: "Organizer",
            groups: [],
            createdAt: new Date(),
          });
          alert("Signed up as Organizer via Google!");
          navigate("/organizerhome");
        } else {
          await setDoc(userDocRef, {
            fullName: user.displayName,
            email: user.email,
            uid: user.uid,
            role: "Attendee",
            groups: [],
            createdAt: new Date(),
          });
          alert("Signed up as Attendee via Google!");
          navigate("/attendeehome");
        }
      } else {
        // 4) If they already exist in Firestore, user is not "new."
        // Possibly just sign them in:
        alert("This Google account is already registered. Logging you in...");
        if (teacherSnap.exists()) {
          navigate("/organizerhome");
        } else {
          navigate("/attendeehome");
        }
      }
    } catch (err) {
      console.error("Sign Up with Google error:", err);
      alert("Failed to sign up with Google. Please try again.");
    }
  };

  return (
    <div className="login-main">{/* Reusing 'login-main' class for matching style */}
      <div className="login-left">
        <img src={Image} alt="Sign Up Left" />
      </div>

      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="Logo" />
          </div>

          <div className="login-center">
            <h2>Create an account</h2>
            <p>Please fill in your details</p>

            {/* Error message */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleSignUp} autoComplete="off">
              <div className={`floating-label-group${focus.fullName || fullName ? " focused filled" : ""}`}>
                <input
                  className="floating-label-input"
                  type="text"
                  value={fullName}
                  onFocus={() => setFocus(f => ({ ...f, fullName: true }))}
                  onBlur={() => setFocus(f => ({ ...f, fullName: false }))}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="off"
                  required
                />
                <label className="floating-label">Full Name</label>
              </div>
              <div className={`floating-label-group${focus.email || email ? " focused filled" : ""}`}>
                <input
                  className="floating-label-input"
                  type="email"
                  value={email}
                  onFocus={() => setFocus(f => ({ ...f, email: true }))}
                  onBlur={() => setFocus(f => ({ ...f, email: false }))}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
                <label className="floating-label">Email</label>
              </div>
              <div className={`floating-label-group${focus.password || password ? " focused filled" : ""} pass-input-div`}>
                <input
                  className="floating-label-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onFocus={() => setFocus(f => ({ ...f, password: true }))}
                  onBlur={() => setFocus(f => ({ ...f, password: false }))}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
                <label className="floating-label">Password</label>
                {showPassword ? (
                  <FaEyeSlash onClick={() => setShowPassword(!showPassword)} />
                ) : (
                  <FaEye onClick={() => setShowPassword(!showPassword)} />
                )}
              </div>
              <div className={`floating-label-group${focus.confirmPassword || confirmPassword ? " focused filled" : ""} pass-input-div`}>
                <input
                  className="floating-label-input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onFocus={() => setFocus(f => ({ ...f, confirmPassword: true }))}
                  onBlur={() => setFocus(f => ({ ...f, confirmPassword: false }))}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
                <label className="floating-label">Confirm Password</label>
                {showConfirmPassword ? (
                  <FaEyeSlash onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                ) : (
                  <FaEye onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                )}
              </div>

              {/* Organizer vs. Attendee */}
              <div className="login-center-options" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <label
                  htmlFor="role-select"
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  Select your role:
                </label>
                <select
                  id="role-select"
                  value={isOrganizer ? "organizer" : isAttendee ? "attendee" : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsOrganizer(value === "organizer");
                    setIsAttendee(value === "attendee");
                  }}
                  style={{
                    flex: "1",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "1.2rem",
                    fontFamily: "Poppins, sans-serif",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled>
                    -- Select Role --
                  </option>
                  <option value="organizer">Organizer</option>
                  <option value="attendee">Attendee</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="login-center-buttons">
                <button
                  type="submit"
                  style={{
                    padding: "1rem 2rem",
                    backgroundColor: "#4a90e2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#357abd")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#4a90e2")}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  style={{
                    padding: "1rem 2rem",
                    backgroundColor: "#f0f0f0",
                    color: "#333",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#e0e0e0")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0f0f0")}
                >
                  <img src={GoogleSvg} alt="Google Logo" style={{ width: "20px" }} />
                  Sign Up with Google
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account? <a href="/login">Log In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
