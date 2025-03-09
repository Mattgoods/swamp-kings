import { db,auth } from "./firebase";  // Import Firestore instance
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
  arrayRemove,
  setDoc,
  deleteDoc

} from "firebase/firestore";

/**
 * Deletes multiple groups and removes the group IDs from enrolled users.
 * @param {Array} groupIds - Array of group IDs to delete.
 */
export const deleteGroups = async (groupIds) => {
  try {
    console.log(`🗑 Deleting groups: ${groupIds}`);
    for (const groupId of groupIds) {
      const groupRef = doc(db, "groups", groupId);
      // Step 1: Get enrolled users (attendees)
      const groupSnap = await getDocs(collection(db, "groups"));
      let attendees = [];
      groupSnap.forEach(doc => {
        if (doc.id === groupId) {
          attendees = doc.data().attendees || [];
        }
      });
      console.log(`👥 Removing group ${groupId} from ${attendees.length} users`);
      // Step 2: Remove group ID from enrolled users
      for (const userId of attendees) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          groups: arrayRemove(groupId)
        });
      }
      console.log("removed groupid from enrolled");
      // Step 3: Delete all classHistory records in each group
      const classHistoryRef = collection(db, "groups", groupId, "classHistory");
      const classDocs = await getDocs(classHistoryRef);
      classDocs.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
      console.log("remove classhistory");
      // Step 4: Delete group document
      await deleteDoc(groupRef);
      console.log(`✅ Successfully deleted group: ${groupId}`);
    }
  } catch (error) {
    console.error("❌ Error deleting groups:", error);
    throw error;
  }
};

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
    return userSnap.data();
  } catch (error) {
    console.error("❌ Error fetching user info:", error);
    return null;
  }
};

/**
 * Creates a new group with an organizer, including start date, end date, and semester.
 * @param {string} groupName - The name of the group.
 * @param {Array} meetingDays - Array of selected meeting days.
 * @param {string} meetingTime - The selected meeting time.
 * @param {string} location - The location of the group.
 * @param {string} startDate - The start date of the group.
 * @param {string} endDate - The end date of the group.
 * @param {string} semester - The semester (Fall, Spring, Summer).
 * @returns {Promise<string|null>} The ID of the newly created group or null if an error occurs.
 */
export const createGroup = async (
  groupName, 
  meetingDays = [], 
  meetingTime = "00:00", 
  location = "", 
  startDate, 
  endDate, 
  semester
) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User is not authenticated.");
    }
    // Fetch organizer details
    const userDocRef = doc(db, "teachers", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      throw new Error("Organizer not found in Firestore.");
    }
    const organizerName = userDocSnap.data().fullName || "Unknown Organizer";

    // Create the new group in Firestore
    const docRef = await addDoc(collection(db, "groups"), {
      groupName,
      organizerId: user.uid,
      organizerName,
      attendees: [],
      meetingDays,
      meetingTime,
      location,
      startDate,
      endDate,
      semester,
      classHistory: [],
      createdAt: serverTimestamp(),
    });

    console.log("✅ Group created with ID:", docRef.id);

    // Generate sessions in the subcollection with isLive initialized to false
    await generateFakePastClasses(docRef.id, meetingDays, startDate, endDate);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating group:", error);
    return null;
  }
};

/**
 * Generates fake past class sessions for a group, and initializes each session document 
 * with an isLive field set to false and an ended field based on the session date.
 * If the session date is earlier than today, ended is set to true.
 * @param {string} groupId - The ID of the newly created group.
 * @param {Array} meetingDays - The days the group meets.
 * @param {string} startDate - The start date of the group.
 * @param {string} endDate - The end date of the group.
 */
const generateFakePastClasses = async (groupId, meetingDays, startDate, endDate) => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);
    let fakeClasses = [];
    const todayStr = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD

    while (currentDate <= end) {
      // Normalize the day string to lowercase
      const dayOfWeek = currentDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();
      // Normalize meetingDays from the UI to lowercase for comparison
      if (meetingDays.map(day => day.toLowerCase()).includes(dayOfWeek)) {
        const sessionId = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
        // Determine if the session is ended (if session date is before today)
        const ended = sessionId < todayStr;
        fakeClasses.push({
          id: sessionId,
          date: sessionId,
          attendees: [],
          totalStudents: 0,
          isLive: false,
          ended,  // ended is true if session date is before today
        });

        // Store session in Firestore in the classHistory subcollection
        const sessionRef = doc(db, "groups", groupId, "classHistory", sessionId);
        await setDoc(sessionRef, {
          date: sessionId,
          attendees: [],
          totalStudents: 0,
          isLive: false,
          ended,  // Write the ended field to Firestore
        });
      }
      currentDate.setDate(currentDate.getDate() + 1); // Move to next day
    }

    console.log(`📅 Created ${fakeClasses.length} past sessions for group ${groupId}`);
  } catch (error) {
    console.error("❌ Error generating past classes:", error);
  }
};
/**
 * Allows a user to join a group.
 * @param {string} groupId - The ID of the group to join.
 * @param {string} userId - The ID of the user joining the group.
 * @returns {Promise<void>}
 */


/**
 * Fetches all groups created by an organizer, including start date, end date, and semester.
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
 * Marks attendance for a student in a specific session.
 * @param {string} groupId - The ID of the group.
 * @param {string} sessionId - The session date (YYYY-MM-DD).
 * @param {string} studentId - The student ID.
 * @returns {Promise<void>}
 */
export const markAttendance = async (groupId, sessionId, studentId) => {
  try {
    const sessionRef = doc(db, "groups", groupId, "classHistory", sessionId);

    await updateDoc(sessionRef, {
      attendees: arrayUnion(studentId)
    });

    console.log(`✅ Attendance updated for ${studentId} in session ${sessionId}`);
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
  }
};

/**
 * Fetches past classes based on end date.
 * @returns {Promise<Array>} An array of past class sessions.
 */
export const getPastClasses = async () => {
  try {
    const today = new Date();
    const q = query(collection(db, "groups"));
    const querySnapshot = await getDocs(q);
    let pastClasses = [];

    for (const groupDoc of querySnapshot.docs) {
      const groupData = groupDoc.data();
      const groupEndDate = new Date(groupData.endDate);

      if (groupEndDate < today) {
        pastClasses.push({ id: groupDoc.id, ...groupData });
      }
    }

    return pastClasses;
  } catch (error) {
    console.error("❌ Error fetching past classes:", error);
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
    const userRef = doc(db, "users", studentId);

    await updateDoc(groupRef, {
      [`attendees.${studentId}`]: { name: studentName, email: studentEmail }
    });
    console.log(`✅ Student ${studentName} added to group ${groupId}`);
    await updateDoc(userRef, {
      //How to add the groupId to the users collection groups array
    });


  } catch (error) {
    console.error("❌ Error adding student:", error);
  }
};
export const removeStudentFromGroup = async (groupId, studentId) => {
  try {
    // Remove student from group's attendees array
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      attendees: arrayRemove(studentId)
    });

    // Remove groupId from the student's groups array in the "users" collection
    const userRef = doc(db, "users", studentId);
    await updateDoc(userRef, {
      groups: arrayRemove(groupId)
    });

    console.log(`Student ${studentId} removed from group ${groupId}`);
  } catch (error) {
    console.error("Error removing student:", error);
  }
};
export const fetchUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().role; // Return 'organizer' or 'attendee'
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
  return null; // Default to null if not found
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