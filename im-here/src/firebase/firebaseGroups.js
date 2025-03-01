import { db } from "./firebase";  // Import Firestore instance
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { auth } from "./firebase"; // Import Firebase Auth for authentication

/**
 * Creates a new group with an organizer.
 * @param {string} groupName - The name of the group.
 * @param {Array} meetingDays - Array of selected meeting days.
 * @param {string} meetingTime - The selected meeting time.
 * @returns {Promise<string|null>} The ID of the newly created group or null if an error occurs.
 */
export const createGroup = async (groupName, meetingDays = [], meetingTime = "00:00", location = "") => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated.");
    }

    if (!meetingTime || meetingTime.trim() === "") {
      throw new Error("Invalid meeting time. Please select a valid time.");
    }
    if (!location || location.trim() === "") {
      throw new Error("Location cannot be empty.");
    }

    const docRef = await addDoc(collection(db, "groups"), {
      groupName: groupName,
      organizerId: user.uid,
      attendees: {}, // Empty initially
      meetingDays: meetingDays, // Array of selected days
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
    console.log("fetching groups for", organizerId);
    const q = query(collection(db, "groups"), where("organizerId", "==", organizerId));
    const querySnapshot = await getDocs(q);
    let groups = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });

    console.log("✅ Fetched groups for organizer:", organizerId);
    return groups;
  } catch (error) {
    console.error("❌ Error fetching organizer's groups:", error);
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
