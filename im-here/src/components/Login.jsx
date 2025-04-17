import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Image from "../assets/imherelogo-transparent.png";
import Logo from "../assets/imherelogo-transparent.png";
import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/firebase";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [focus, setFocus] = useState({ email: false, password: false });

  const navigate = useNavigate(); // Instantiate useNavigate

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check Firestore for role
      const userDoc = await getDoc(doc(db, "users", user.uid));    // Attendee
      const teacherDoc = await getDoc(doc(db, "teachers", user.uid)); // Organizer

      if (userDoc.exists()) {
        // If the doc is in 'users', they're an Attendee
        //alert("Sign-in successful! You are logged in as an Attendee.");
        navigate("/attendeehome"); // Redirect to AttendeeHome
      } else if (teacherDoc.exists()) {
        // If the doc is in 'teachers', they're an Organizer
       //alert("Sign-in successful! You are logged in as an Organizer.");
        navigate("/organizerhome"); // Redirect to OrganizerHome
      } else {
        // No matching document found
        alert("Sign-in successful, but no role found in Firestore.");
        // Optionally, navigate to a generic page or log them out
      }
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      setError("Incorrect email or password. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
	try {
	  // 1) Open Google sign-in popup
	  const result = await signInWithPopup(auth, googleProvider);
	  const user = result.user; // The signed-in Firebase User
  
	  // 2) Check Firestore to see if they exist in 'users' or 'teachers'
	  const userDocRef = doc(db, "users", user.uid);
	  const teacherDocRef = doc(db, "teachers", user.uid);
  
	  const userSnap = await getDoc(userDocRef);
	  const teacherSnap = await getDoc(teacherDocRef);
  
	  // 3) If brand new (no doc in either collection), prompt for role:
	  if (!userSnap.exists() && !teacherSnap.exists()) {
		// Prompt the user
		const chosenRole = window.prompt("Are you an Organizer or an Attendee?");
		
		// Guard: If they clicked 'Cancel' or typed nothing, you could default:
		if (!chosenRole) {
		  // If they gave no input, let's default them to 'Attendee' (or handle differently)
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
  
		// Convert their response to lowercase
		const normalizedRole = chosenRole.toLowerCase();
  
		if (normalizedRole === "organizer") {
		  // 3A) If they said 'Organizer', store in 'teachers'
		  await setDoc(teacherDocRef, {
			fullName: user.displayName,
			email: user.email,
			uid: user.uid,
			role: "Organizer",
			groups: [],
			createdAt: new Date(),
		  });
		  alert("You have signed in as an Organizer!");
		  navigate("/organizerhome");
		} else {
		  // 3B) Otherwise, treat them as 'Attendee'
		  await setDoc(userDocRef, {
			fullName: user.displayName,
			email: user.email,
			uid: user.uid,
			role: "Attendee",
			groups: [],
			createdAt: new Date(),
		  });
		  alert("You have signed in as an Attendee!");
		  navigate("/attendeehome");
		}
  
	  } else {
		// 4) If user doc or teacher doc already exists, skip the prompt and send them where they belong
		if (teacherSnap.exists()) {
		  navigate("/organizerhome");
		} else {
		  navigate("/attendeehome");
		}
	  }
	} catch (error) {
	  console.error("Google sign-in error:", error);
	  alert("Failed to sign in with Google. Please try again.");
	}
  };
  


  return (
    <div className="login-main">
      <div className="login-left">
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleLogin} autoComplete="off">
              <div
                className={`floating-label-group${focus.email || email ? " focused filled" : ""}`}
              >
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

              <div className="login-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="remember-checkbox" />
                  <label htmlFor="remember-checkbox">Remember for 30 days</label>
                </div>
                <a href="#" className="forgot-pass-link">
                  Forgot password?
                </a>
              </div>

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
                  Log In
                </button>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
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
                  Log In with Google
                </button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
