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
  arrayUnion

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
export const fetchUserGroups = async (userId) => {
  try {
    const groupsCollection = collection(db, "groups");
    const querySnapshot = await getDocs(groupsCollection);
    const userGroups = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // ✅ Ensure `attendees` is an array before calling `.some()`
      const attendees = Array.isArray(data.attendees) ? data.attendees : [];

      if (attendees.some((attendee) => attendee.id === userId)) {
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
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all groups:", error);
    return [];
  }
};

export const joinGroup = async (groupId, userId, userName, userEmail) => {
  try {
    // ✅ Ensure userName and userEmail are valid before proceeding
    if (!userName || !userEmail) {
      throw new Error("User name or email is missing.");
    }

    const groupRef = doc(db, "groups", groupId);
    const userRef = doc(db, "users", userId);

    // Step 1: Get group details
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) {
      throw new Error("Group not found.");
    }

    const groupData = groupSnap.data();

    // ✅ Fix: Convert `attendees` to an array if it's missing or incorrect
    let attendeesArray = [];
    if (Array.isArray(groupData.attendees)) {
      attendeesArray = groupData.attendees;
    } else if (typeof groupData.attendees === "object" && groupData.attendees !== null) {
      attendeesArray = Object.values(groupData.attendees); // Convert object to array
    }

    // Step 2: Update the group's attendees list (Prevent undefined values)
    await updateDoc(groupRef, {
      attendees: arrayUnion({
        id: userId,
        name: userName || "Unknown User", // ✅ Ensure no undefined value
        email: userEmail || "No Email", // ✅ Ensure no undefined value
      }),
    });

    // Step 3: Update the user's document to include the new group (Prevent undefined values)
    await updateDoc(userRef, {
      groups: arrayUnion({
        groupId: groupId,
        groupName: groupData.groupName || "Unnamed Group", // ✅ Prevent undefined
        organizer: groupData.organizerName || "Unknown Organizer", // ✅ Prevent undefined
      }),
    });

    console.log(`✅ User ${userName} joined group ${groupData.groupName}`);
  } catch (error) {
    console.error("❌ Error joining group:", error);
    throw error;
  }
};
