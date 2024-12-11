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
                <button type="button" onClick={handleGoogleSignUp}>
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
