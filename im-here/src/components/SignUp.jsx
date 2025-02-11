import React, { useState } from "react";
import Image from "../assets/imherelogo-transparent.png";
import Logo from "../assets/imherelogo-transparent.png";
import GoogleSvg from "../assets/icons8-google.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { auth, db } from "../firebase/firebase"; // Import Firebase
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
    e.preventDefault(); // Prevent form from refreshing the page

    if (!isOrganizer && !isAttendee) {
      setError("Please select either Organizer or Attendee.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine which Firestore collection to store user data
      const collectionName = isOrganizer ? "teachers" : "users";

      await setDoc(doc(db, collectionName, user.uid), {
        fullName: fullName,
        email: email,
        uid: user.uid,
        role: isOrganizer ? "Organizer" : "Attendee",
        createdAt: new Date()
      });

      console.log(`User stored in Firestore collection: ${collectionName}`);
      alert("Account created successfully!");
    } catch (error) {
      setError(error.message);
      console.error("Error creating account:", error.message);
    }
  };

  return (
    <div className="signup-main">
      <div className="signup-left">
        <img src={Image} alt="Signup Left Image" />
      </div>
      <div className="signup-right">
        <div className="signup-right-container">
          <div className="signup-logo">
            <img src={Logo} alt="Logo" />
          </div>
          <div className="signup-center">
            <h2>Create an account</h2>
            <p>Please fill in your details</p>
            
            {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error message */}

            <form onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
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

              {/* Terms & Conditions Checkbox */}
              <div className="signup-center-options">
                <div className="remember-div">
                  <input type="checkbox" id="terms-checkbox" required />
                  <label htmlFor="terms-checkbox">
                    I agree to the terms and conditions
                  </label>
                </div>
              </div>

              {/* Organizer & Attendee Selection */}
              <div className="signup-center-options">
                <div className="remember-div">
                  <input
                    type="checkbox"
                    id="organizer-checkbox"
                    checked={isOrganizer}
                    onChange={() => {
                      setIsOrganizer(!isOrganizer);
                      setIsAttendee(false); // Uncheck attendee if organizer is selected
                    }}
                  />
                  <label htmlFor="organizer-checkbox">Sign up as an Organizer</label>
                </div>
                <div className="remember-div">
                  <input
                    type="checkbox"
                    id="attendee-checkbox"
                    checked={isAttendee}
                    onChange={() => {
                      setIsAttendee(!isAttendee);
                      setIsOrganizer(false); // Uncheck organizer if attendee is selected
                    }}
                  />
                  <label htmlFor="attendee-checkbox">Sign up as an Attendee</label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="signup-center-buttons">
                <button type="submit">Sign Up</button>
                <button type="button">
                  <img src={GoogleSvg} alt="Google Logo" />
                  Sign Up with Google
                </button>
              </div>
            </form>
          </div>

          <p className="signup-bottom-p">
            Already have an account? <a href="/login">Log In</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
