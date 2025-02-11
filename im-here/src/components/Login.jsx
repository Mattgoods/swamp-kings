import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Image from "../assets/imherelogo-transparent.png";
import Logo from "../assets/imherelogo-transparent.png";
import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                <button type="submit">Log In</button>
                <button type="button">
                  <img src={GoogleSvg} alt="" />
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
