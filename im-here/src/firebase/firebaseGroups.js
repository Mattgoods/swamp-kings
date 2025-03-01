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
  getDoc 

} from "firebase/firestore";
import { auth } from "./firebase"; // Import Firebase Auth for authentication


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
      attendees: {}, // Empty initially
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
export const joinGroup = async (groupId, userId) => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      [`attendees.${userId}`]: true, // Adds user to the attendees list
    });

    console.log(`✅ User ${userId} joined group ${groupId}`);
  } catch (error) {
    console.error("❌ Error joining group:", error);
  }
};

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
      
      // Fetch organizer's full name from Firestore
      const userDoc = await getDoc(doc(db, "teachers", groupData.organizerId));
      const organizerName = userDoc.exists() ? userDoc.data().fullName : "Unknown Organizer";

      groups.push({ id: groupDoc.id, ...groupData, organizerName });
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
export const fetchUserGroups = async (userId) => {
  try {
    const querySnapshot = await getDocs(collection(db, "groups"));
    let userGroups = [];

    querySnapshot.forEach((doc) => {
      if (doc.data().attendees && doc.data().attendees[userId]) {
        userGroups.push({ id: doc.id, ...doc.data() });
      }
    });

    console.log("✅ Fetched groups for user:", userId);
    return userGroups;
  } catch (error) {
    console.error("❌ Error fetching user groups:", error);
    return [];
  }
};

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
export const markAttendance = async (groupId, sessionId, studentId, attended) => {
  try {
    const sessionRef = doc(db, "groups", groupId, "classHistory", sessionId);
    await updateDoc(sessionRef, {
      [`attendees.${studentId}`]: attended
    });
    console.log(`✅ Attendance updated for ${studentId} in session ${sessionId}`);
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
  }
};
