import React, { useState } from "react";
import Image from "../assets/imherelogo-transparent.png";
import Logo from "../assets/imherelogo-transparent.png";
import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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
        createdAt: new Date(),
      });

      console.log(`User stored in Firestore: ${collectionName}`);
      alert("Account created successfully!");
    } catch (error) {
      setError(error.message);
      console.error("Error creating account:", error.message);
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

            <form onSubmit={handleSignUp}>
              {/* Full Name */}
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              {/* Email */}
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password */}
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

              {/* Confirm Password */}
              <div className="pass-input-div">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {showConfirmPassword ? (
                  <FaEyeSlash onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                ) : (
                  <FaEye onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="login-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="terms-checkbox" required />
                  <label htmlFor="terms-checkbox">
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>

              {/* Organizer vs. Attendee */}
              <div className="login-center-options">
                <div className="remember-div">
                  <input
                    type="checkbox"
                    id="organizer-checkbox"
                    checked={isOrganizer}
                    onChange={() => {
                      setIsOrganizer(!isOrganizer);
                      setIsAttendee(false);
                    }}
                  />
                  <label htmlFor="organizer-checkbox">Sign up as Organizer</label>
                </div>

                <div className="remember-div">
                  <input
                    type="checkbox"
                    id="attendee-checkbox"
                    checked={isAttendee}
                    onChange={() => {
                      setIsAttendee(!isAttendee);
                      setIsOrganizer(false);
                    }}
                  />
                  <label htmlFor="attendee-checkbox">Sign up as Attendee</label>
                </div>
              </div>

              {/* Buttons */}
              <div className="login-center-buttons">
                <button type="submit">Sign Up</button>
                <button type="button">
                  <img src={GoogleSvg} alt="Google Logo" />
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
