import { db } from "./firebase";  // Import Firestore instance
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  getDoc ,
  arrayUnion,
  arrayRemove

} from "firebase/firestore";

/**
 * Fetches user details from Firestore by user ID.
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The user details or null if not found.
 */
export const fetchUserInfo = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.warn(`⚠️ User with ID ${userId} not found in Firestore.`);
      return null;
    }

    return userSnap.data(); // ✅ Return user info
  } catch (error) {
    console.error("❌ Error fetching user info:", error);
    return null;
  }
};

/**
 * Creates a new group with an organizer.
 * @param {string} groupName - The name of the group.
 * @param {Array} meetingDays - Array of selected meeting days.
 * @param {string} meetingTime - The selected meeting time.
 * @param {string} location - The location of the group.
 * @returns {Promise<string|null>} The ID of the newly created group or null if an error occurs.
 */
export const createGroup = async (groupName, meetingDays = [], meetingTime = "00:00", location = "") => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated.");
    }

    // ✅ Fetch the organizer's name from Firestore
    const userDocRef = doc(db, "teachers", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      throw new Error("Organizer not found in Firestore.");
    }

    const organizerName = userDocSnap.data().fullName || "Unknown Organizer"; // ✅ Fetch full name

    // ✅ Create the new group with the organizer's name
    const docRef = await addDoc(collection(db, "groups"), {
      groupName: groupName,
      organizerId: user.uid,
      organizerName: organizerName, // ✅ Store organizer name
      attendees: [], // Empty initially
      meetingDays: meetingDays || [], // Ensure array format
      meetingTime: meetingTime, // Default value ensured
      location: location,
      createdAt: serverTimestamp(),
    });

    console.log("✅ Group created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating group:", error);
    return null;
  }
};


/**
 * Allows a user to join a group.
 * @param {string} groupId - The ID of the group to join.
 * @param {string} userId - The ID of the user joining the group.
 * @returns {Promise<void>}
 */

/**
 * Fetches all groups created by an organizer.
 * @param {string} organizerId - The ID of the organizer.
 * @returns {Promise<Array>} An array of groups created by the organizer.
 */
export const fetchOrganizerGroups = async (organizerId) => {
  try {
    const q = query(collection(db, "groups"), where("organizerId", "==", organizerId));
    const querySnapshot = await getDocs(q);
    let groups = [];

    for (const groupDoc of querySnapshot.docs) {
      const groupData = groupDoc.data();
      groups.push({ id: groupDoc.id, ...groupData });
    }

    return groups;
  } catch (error) {
    console.error("Error fetching organizer's groups:", error);
    return [];
  }
};

/**
 * Fetches all groups a user is a part of.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} An array of groups the user is in.
 */

export const addStudentToGroup = async (groupId, studentId, studentName, studentEmail) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      [`attendees.${studentId}`]: { name: studentName, email: studentEmail }
    });
    console.log(`✅ Student ${studentName} added to group ${groupId}`);
  } catch (error) {
    console.error("❌ Error adding student:", error);
  }
};
export const removeStudentFromGroup = async (groupId, studentId) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      [`attendees.${studentId}`]: null // Removes student
    });
    console.log(`❌ Student ${studentId} removed from group ${groupId}`);
  } catch (error) {
    console.error("❌ Error removing student:", error);
  }
};
export const markAttendance = async (groupId, sessionId, studentId) => {
  try {
    const sessionRef = doc(db, "groups", groupId, "classHistory", sessionId);
    await updateDoc(sessionRef, {
      attendees: arrayUnion(studentId) // ✅ Store only student ID
    });
    console.log(`✅ Attendance updated for ${studentId} in session ${sessionId}`);
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
  }
};

export const fetchUserGroups = async (userId) => {
  try {
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);
    const userGroups = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // ✅ Ensure `attendees` is an array before calling `.includes()`
      const attendees = Array.isArray(data.attendees) ? data.attendees : [];

      if (attendees.includes(userId)) {  // ✅ Check directly against the array of user IDs
        userGroups.push({ id: doc.id, ...data });
      }
    });

    return userGroups;
  } catch (error) {
    console.error("❌ Error fetching user groups:", error);
    return [];
  }
};

// Fetch all available groups for searching
export const fetchAllGroups = async () => {
  try {
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      groupName: doc.data().groupName,
      organizerName: doc.data().organizerName,
      attendeesCount: doc.data().attendees.length || 0 // ✅ Include attendees count instead of full list
    }));
  } catch (error) {
    console.error("Error fetching all groups:", error);
    return [];
  }
};


export const joinGroup = async (groupId, userId) => {
  try {
    console.log(`🔍 Attempting to join group: ${groupId} for user: ${userId}`);

    const groupRef = doc(db, "groups", groupId);
    const userRef = doc(db, "users", userId);

    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      throw new Error("❌ Group not found.");
    }

    await updateDoc(groupRef, {
      attendees: arrayUnion(userId) // ✅ Store only user ID
    });

    await updateDoc(userRef, {
      groups: arrayUnion(groupId) // ✅ Store only group ID
    });

    console.log(`✅ User ${userId} joined group ${groupId}`);

    // ✅ Update session storage
    const storedGroups = JSON.parse(sessionStorage.getItem("userGroups")) || [];
    const updatedGroups = [...storedGroups, { id: groupId, groupName: groupSnap.data().groupName }];
    sessionStorage.setItem("userGroups", JSON.stringify(updatedGroups));

  } catch (error) {
    console.error("❌ Error joining group:", error);
    throw error;
  }
};


export const leaveGroup = async (groupId, userId) => {
  try {
    console.log(`🔍 Attempting to leave group ${groupId} for user ${userId}`);

    const groupRef = doc(db, "groups", groupId);
    const userRef = doc(db, "users", userId);

    // ✅ Remove user ID from group's `attendees` array
    await updateDoc(groupRef, {
      attendees: arrayRemove(userId) // ✅ Now works correctly
    });

    // ✅ Remove group ID from user's `groups` array
    await updateDoc(userRef, {
      groups: arrayRemove(groupId) // ✅ Now works correctly
    });

    console.log(`❌ User ${userId} successfully left group ${groupId}`);
  } catch (error) {
    console.error("❌ Error leaving group:", error);
    throw error;
  }
};
