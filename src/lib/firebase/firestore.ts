
import { db } from './config';
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc, setDoc, updateDoc, Timestamp, writeBatch, collectionGroup } from 'firebase/firestore';
import type { Campaign, DailyChallenge, UserProfile, CampaignApplication, UserDailyChallengeSubmission, Course, Project, QuizChallenge, UserCourseCertificate } from '@/types';

// Helper function to serialize Firestore data
const serializeFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const serializedData: Record<string, any> = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      serializedData[key] = (data[key] as Timestamp).toDate().toISOString();
    } else if (data[key] instanceof Date) { 
      serializedData[key] = data[key].toISOString();
    }
     else {
      serializedData[key] = data[key];
    }
  }
  return serializedData;
};

// CAMPAIGNS
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('startDate', 'asc')); 
    const campaignSnapshot = await getDocs(q);
    const campaignList = campaignSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...serializeFirestoreData(data) } as Campaign;
    });
    return campaignList;
  } catch (error) {
    console.error("Error fetching campaigns: ", error);
    return [];
  }
};

export const getCampaignById = async (campaignId: string): Promise<Campaign | null> => {
  try {
    if (!campaignId) {
      console.warn("getCampaignById called with null or empty campaignId");
      return null;
    }
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (campaignSnap.exists()) {
      const data = campaignSnap.data();
      return { id: campaignSnap.id, ...serializeFirestoreData(data) } as Campaign;
    }
    console.warn(`Campaign with ID ${campaignId} not found.`);
    return null;
  } catch (error) {
    console.error("Error fetching campaign by ID: ", error);
    return null;
  }
}

export const addCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const campaignsCol = collection(db, 'campaigns');
    const dataToAdd: any = {
      ...campaignData,
      createdAt: serverTimestamp(), 
    };
    if (!campaignData.applyLink) {
      delete dataToAdd.applyLink;
    }

    const docRef = await addDoc(campaignsCol, dataToAdd);
    return docRef.id;
  } catch (error) {
    console.error("Error adding new campaign: ", error);
    throw error;
  }
};

// CAMPAIGN APPLICATIONS & ENROLLMENT

export const getCampaignApplicationForUser = async (userId: string, campaignId: string): Promise<CampaignApplication | null> => {
  try {
    const applicationsCol = collection(db, 'campaignApplications');
    const q = query(applicationsCol, where('userId', '==', userId), where('campaignId', '==', campaignId), limit(1));
    const appSnapshot = await getDocs(q);
    if (!appSnapshot.empty) {
      const docData = appSnapshot.docs[0];
      const rawData = docData.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        id: docData.id,
        userId: serialized.userId,
        campaignId: serialized.campaignId,
        status: serialized.status,
        appliedAt: serialized.appliedAt as string, 
        userName: serialized.userName,
        userEmail: serialized.userEmail,
        campaignName: serialized.campaignName,
      } as CampaignApplication;
    }
    return null;
  } catch (error) {
    console.error("Error fetching specific campaign application for user: ", error);
    return null;
  }
};


export const getCampaignApplicationsByUserId = async (userId: string): Promise<CampaignApplication[]> => {
  try {
    const applicationsCol = collection(db, 'campaignApplications');
    const q = query(applicationsCol, where('userId', '==', userId), orderBy('appliedAt', 'desc')); 
    const appSnapshot = await getDocs(q);
    return appSnapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        id: docSnap.id,
        userId: serialized.userId,
        campaignId: serialized.campaignId,
        status: serialized.status,
        appliedAt: serialized.appliedAt as string, 
        userName: serialized.userName,
        userEmail: serialized.userEmail,
        campaignName: serialized.campaignName,
      } as CampaignApplication;
    });
  } catch (error) {
    console.error("Error fetching campaign applications for user: ", error);
    return [];
  }
};

export const getCampaignApplicationsForCampaign = async (campaignId: string): Promise<CampaignApplication[]> => {
  try {
    const applicationsCol = collection(db, 'campaignApplications');
    const q = query(applicationsCol, where('campaignId', '==', campaignId), orderBy('appliedAt', 'desc')); 
    const appSnapshot = await getDocs(q);
    return appSnapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        id: docSnap.id,
        userId: serialized.userId,
        campaignId: serialized.campaignId,
        status: serialized.status,
        appliedAt: serialized.appliedAt as string, 
        userName: serialized.userName,
        userEmail: serialized.userEmail,
        campaignName: serialized.campaignName,
      } as CampaignApplication;
    });
  } catch (error) {
    console.error("Error fetching campaign applications for campaign: ", error);
    return [];
  }
};

export const updateCampaignApplicationStatus = async (applicationId: string, status: CampaignApplication['status']): Promise<void> => {
  try {
    const appRef = doc(db, 'campaignApplications', applicationId);
    await updateDoc(appRef, { status });
  } catch (error) {
    console.error("Error updating application status: ", error);
    throw error;
  }
};

export const enrollUserInCampaignByEmail = async (campaignId: string, email: string, campaignName?: string): Promise<string | null> => {
  try {
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      throw new Error(`User with email ${email} not found.`);
    }
    const userData = userSnapshot.docs[0].data() as UserProfile;
    const userId = userSnapshot.docs[0].id;

    const applicationsCol = collection(db, 'campaignApplications');
    const existingAppQuery = query(applicationsCol, where('userId', '==', userId), where('campaignId', '==', campaignId));
    const existingAppSnapshot = await getDocs(existingAppQuery);

    if (!existingAppSnapshot.empty) {
       const existingAppId = existingAppSnapshot.docs[0].id;
       await updateCampaignApplicationStatus(existingAppId, 'approved');
       return existingAppId;
    }

    const applicationData: Omit<CampaignApplication, 'id' | 'appliedAt'> & { appliedAt: any } = { 
      userId,
      campaignId,
      status: 'approved',
      userName: userData.displayName || userData.username || 'Anonymous',
      userEmail: userData.email || 'N/A',
      campaignName: campaignName || 'N/A',
      appliedAt: serverTimestamp() 
    };
    const docRef = await addDoc(applicationsCol, applicationData);
    return docRef.id;

  } catch (error) {
    console.error("Error enrolling user by email: ", error);
    throw error;
  }
};


// DAILY CHALLENGE SUBMISSIONS
export const submitDailyChallengeSolution = async (
  userId: string,
  dailyProblemDate: string, // Date string, YYYY-MM-DD, used as ID in 'dailyProblems'
  challengeId: string, // Original problem ID, e.g., "Leet-123"
  code: string,
  language: string
): Promise<UserDailyChallengeSubmission> => {
  try {
    const submissionPath = `dailyProblems/${dailyProblemDate}/submittedSolutions/${userId}`;
    const submissionRef = doc(db, submissionPath);

    const existingSubmissionSnap = await getDoc(submissionRef);
    if (existingSubmissionSnap.exists()) {
      throw new Error('You have already submitted a solution for this challenge.');
    }
    
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
        throw new Error('User profile not found.');
    }

    const submissionData: Omit<UserDailyChallengeSubmission, 'id'> & { submittedAt: any } = {
      userId,
      challengeId, 
      dailyProblemDate, 
      code,
      language,
      userName: userProfile.displayName || userProfile.username || 'Anonymous',
      userEmail: userProfile.email || 'N/A',
      submittedAt: serverTimestamp(),
      status: 'review' as const,
      reviewedAt: null,
      adminNotes: null,
    };

    await setDoc(submissionRef, submissionData);
    
    const newSubmissionSnap = await getDoc(submissionRef);
    if (!newSubmissionSnap.exists()) {
        throw new Error("Failed to retrieve submission after saving.");
    }
    const rawData = newSubmissionSnap.data();
    const serialized = serializeFirestoreData(rawData);

    return {
      id: newSubmissionSnap.id, 
      ...serialized,
    } as UserDailyChallengeSubmission;

  } catch (error) {
    console.error('Error submitting daily challenge solution:', error);
    throw error;
  }
};

export const getUserDailyChallengeSubmission = async (
  userId: string,
  dailyProblemDate: string 
): Promise<UserDailyChallengeSubmission | null> => {
  try {
    if (!userId || !dailyProblemDate) {
        console.warn("getUserDailyChallengeSubmission called with invalid userId or dailyProblemDate");
        return null;
    }
    const submissionPath = `dailyProblems/${dailyProblemDate}/submittedSolutions/${userId}`;
    const submissionRef = doc(db, submissionPath);
    const docSnap = await getDoc(submissionRef);

    if (docSnap.exists()) {
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        id: docSnap.id, 
        ...serialized,
      } as UserDailyChallengeSubmission;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user daily challenge submission:', error);
    return null;
  }
};

export const getAllSubmissionsForDailyProblem = async (dailyProblemDate: string): Promise<UserDailyChallengeSubmission[]> => {
  try {
    const submissionsPath = `dailyProblems/${dailyProblemDate}/submittedSolutions`;
    const submissionsColRef = collection(db, submissionsPath);
    const q = query(submissionsColRef, orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        id: docSnap.id, // This will be the userId
        ...serialized,
      } as UserDailyChallengeSubmission;
    });
  } catch (error) {
    console.error(`Error fetching submissions for daily problem ${dailyProblemDate}:`, error);
    return [];
  }
};

export const updateDailyChallengeSubmissionStatus = async (
  dailyProblemDate: string,
  submissionUserId: string,
  newStatus: 'approved' | 'rejected' | 'review',
  adminNotes: string | null,
  challengePoints: number
): Promise<void> => {
  const submissionPath = `dailyProblems/${dailyProblemDate}/submittedSolutions/${submissionUserId}`;
  const submissionRef = doc(db, submissionPath);
  const userProfileRef = doc(db, 'users', submissionUserId);

  const batch = writeBatch(db);

  try {
    const submissionSnap = await getDoc(submissionRef);
    if (!submissionSnap.exists()) {
      throw new Error('Submission not found.');
    }
    const currentSubmission = submissionSnap.data() as UserDailyChallengeSubmission;
    const previousStatus = currentSubmission.status;

    // Update submission document
    const submissionUpdateData: any = {
      status: newStatus,
      adminNotes: adminNotes || null,
      reviewedAt: serverTimestamp(),
    };
    batch.update(submissionRef, submissionUpdateData);

    // Update user profile if status changes involve 'approved'
    if (newStatus === 'approved' && previousStatus !== 'approved') {
      const userProfileSnap = await getDoc(userProfileRef);
      if (userProfileSnap.exists()) {
        const userProfileData = userProfileSnap.data() as UserProfile;
        batch.update(userProfileRef, {
          points: (userProfileData.points || 0) + challengePoints,
          dailyChallengeStreak: (userProfileData.dailyChallengeStreak || 0) + 1,
        });
      }
    } else if (newStatus !== 'approved' && previousStatus === 'approved') {
      // Reverting an approval
      const userProfileSnap = await getDoc(userProfileRef);
      if (userProfileSnap.exists()) {
        const userProfileData = userProfileSnap.data() as UserProfile;
        batch.update(userProfileRef, {
          points: Math.max(0, (userProfileData.points || 0) - challengePoints),
          dailyChallengeStreak: Math.max(0, (userProfileData.dailyChallengeStreak || 0) - 1),
        });
      }
    }
    await batch.commit();
  } catch (error) {
    console.error('Error updating daily challenge submission status:', error);
    throw error;
  }
};


// DAILY PROBLEM HANDLING
export const getDailyProblemByDate = async (dateString: string): Promise<DailyChallenge | null> => {
  try {
    const problemRef = doc(db, 'dailyProblems', dateString);
    const problemSnap = await getDoc(problemRef);

    if (problemSnap.exists()) {
      const data = problemSnap.data();
      console.log(`[getDailyProblemByDate] Found problem for date ${dateString} in Firestore.`);
      // Ensure the date from Firestore is a string matching dateString if it's used for validation
      if (data.date && data.date !== dateString) {
         console.warn(`[getDailyProblemByDate] Mismatch: Firestore doc ID is ${dateString}, but problem.date is ${data.date}. Using doc ID.`);
         data.date = dateString; // Ensure consistency
      } else if (!data.date) {
         console.warn(`[getDailyProblemByDate] Problem for ${dateString} is missing 'date' field. Setting it to doc ID.`);
         data.date = dateString;
      }
      
      const serializedData = serializeFirestoreData(data);
      return {
        id: serializedData.id, 
        title: serializedData.title,
        description: serializedData.description,
        difficulty: serializedData.difficulty,
        points: serializedData.points,
        date: serializedData.date, 
        examples: serializedData.examples,
        cachedAt: serializedData.cachedAt as string | undefined,
      } as DailyChallenge;
    }
    console.log(`[getDailyProblemByDate] No problem found for date ${dateString} in Firestore.`);
    return null;
  } catch (error) {
    console.error(`Error fetching problem for date ${dateString}:`, error);
    return null;
  }
};

export const saveDailyProblem = async (problem: DailyChallenge): Promise<void> => {
  try {
    const problemRef = doc(db, 'dailyProblems', problem.date); // Use problem.date as document ID
    const dataToSave = {
      ...problem, 
      cachedAt: serverTimestamp(), 
    };
    await setDoc(problemRef, dataToSave);
    console.log(`[saveDailyProblem] Problem ${problem.id} saved for date ${problem.date}.`);
  } catch (error) {
    console.error(`Error saving problem ${problem.id} for date ${problem.date}:`, error);
  }
};


// USER PROFILE
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const rawData = userSnap.data();
      const serialized = serializeFirestoreData(rawData);
      return {
        uid: serialized.uid,
        email: serialized.email,
        displayName: serialized.displayName,
        photoURL: serialized.photoURL,
        username: serialized.username,
        phoneNumber: serialized.phoneNumber,
        dailyChallengeStreak: serialized.dailyChallengeStreak,
        points: serialized.points,
        isAdmin: serialized.isAdmin,
        profileCompleted: serialized.profileCompleted,
        createdAt: serialized.createdAt as string | null, 
        lastLogin: serialized.lastLogin as string | null, 
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile: ", error);
    return null;
  }
};

export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const rawData = querySnapshot.docs[0].data();
      const serialized = serializeFirestoreData(rawData);
       return {
        uid: serialized.uid,
        email: serialized.email,
        displayName: serialized.displayName,
        photoURL: serialized.photoURL,
        username: serialized.username,
        phoneNumber: serialized.phoneNumber,
        dailyChallengeStreak: serialized.dailyChallengeStreak,
        points: serialized.points,
        isAdmin: serialized.isAdmin,
        profileCompleted: serialized.profileCompleted,
        createdAt: serialized.createdAt as string | null, 
        lastLogin: serialized.lastLogin as string | null, 
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile by username: ", error);
    return null;
  }
};

export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username: ", error);
    return true; 
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const dataToUpdate = { ...data };
    if ('createdAt' in dataToUpdate && dataToUpdate.createdAt === 'SERVER_TIMESTAMP_PLACEHOLDER') { 
        (dataToUpdate as any).createdAt = serverTimestamp();
    }
    if ('lastLogin' in dataToUpdate && dataToUpdate.lastLogin === 'SERVER_TIMESTAMP_PLACEHOLDER') {
        (dataToUpdate as any).lastLogin = serverTimestamp();
    }
    await updateDoc(userRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw error;
  }
};


// CAMPAIGN CONTENT MANAGEMENT (COURSES, PROJECTS, QUIZZES)

// Courses
export const addCourseToCampaign = async (campaignId: string, courseData: Omit<Course, 'id' | 'campaignId' | 'createdAt'>): Promise<Course> => {
  try {
    const coursesColRef = collection(db, 'campaigns', campaignId, 'courses');
    const newCourseDataWithTimestamp = {
      ...courseData,
      campaignId,
      createdAt: serverTimestamp(), 
    };
    const docRef = await addDoc(coursesColRef, newCourseDataWithTimestamp);

    const newDocSnap = await getDoc(docRef);
    const rawData = newDocSnap.data();
    if (!rawData) throw new Error("Failed to fetch newly added course.");
    const serialized = serializeFirestoreData(rawData);

    return {
        id: docRef.id,
        campaignId: serialized.campaignId,
        title: serialized.title,
        description: serialized.description,
        courseUrl: serialized.courseUrl,
        resources: serialized.resources,
        createdAt: serialized.createdAt as string, 
     } as Course;
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
};

export const getCoursesForCampaign = async (campaignId: string): Promise<Course[]> => {
  if (!campaignId) {
    console.error('getCoursesForCampaign called with no campaignId.');
    return [];
  }
  try {
    const coursesColRef = collection(db, 'campaigns', campaignId, 'courses');
    const q = query(coursesColRef, orderBy('createdAt', 'asc')); 
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No courses found for campaignId: ${campaignId}. This could be because no courses exist, or they are missing the 'createdAt' field (of Timestamp type) required by the query's orderBy clause. Please check your Firestore data.`);
    }
    
    return snapshot.docs.map(docSnap => {
        const rawData = docSnap.data();
        const serialized = serializeFirestoreData(rawData);

        let createdAtIsoString: string;
        if (serialized.createdAt && typeof serialized.createdAt === 'string') { 
            createdAtIsoString = serialized.createdAt;
        } else {
            console.warn(`Course ${docSnap.id} for campaign ${campaignId} is missing or has an invalid 'createdAt' field (expected ISO string after serialization). Using current date as fallback. Original rawData.createdAt:`, rawData.createdAt);
            createdAtIsoString = new Date().toISOString(); 
        }

        return {
            id: docSnap.id,
            campaignId: serialized.campaignId || campaignId,
            title: serialized.title || 'Untitled Course',
            description: serialized.description || 'No description available.',
            courseUrl: serialized.courseUrl || '#',
            resources: serialized.resources || [],
            createdAt: createdAtIsoString,
        } as Course;
    });
  } catch (error) {
    console.error(`Error fetching courses for campaignId ${campaignId}:`, error);
    return [];
  }
};

// Projects
export const addProjectToCampaign = async (campaignId: string, projectData: Omit<Project, 'id' | 'campaignId' | 'createdAt'>): Promise<Project> => {
  try {
    const projectsColRef = collection(db, 'campaigns', campaignId, 'projects');
    const newProjectDataWithTimestamp = {
        ...projectData,
        campaignId,
        createdAt: serverTimestamp(), 
    };
    const docRef = await addDoc(projectsColRef, newProjectDataWithTimestamp);
    const newDocSnap = await getDoc(docRef);
    const rawData = newDocSnap.data();
    if (!rawData) throw new Error("Failed to fetch newly added project.");
    const serialized = serializeFirestoreData(rawData);
    return {
        id: docRef.id,
        campaignId: serialized.campaignId,
        title: serialized.title,
        description: serialized.description,
        submissionLinkRequired: serialized.submissionLinkRequired,
        learningObjectives: serialized.learningObjectives,
        createdAt: serialized.createdAt as string, 
    } as Project;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

export const getProjectsForCampaign = async (campaignId: string): Promise<Project[]> => {
   try {
    const projectsColRef = collection(db, 'campaigns', campaignId, 'projects');
    const q = query(projectsColRef, orderBy('createdAt', 'asc')); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
        const rawData = docSnap.data();
        const serialized = serializeFirestoreData(rawData);
        return {
            id: docSnap.id,
            campaignId: serialized.campaignId,
            title: serialized.title,
            description: serialized.description,
            submissionLinkRequired: serialized.submissionLinkRequired,
            learningObjectives: serialized.learningObjectives,
            createdAt: serialized.createdAt as string, 
        } as Project;
    });
  } catch (error)
{
    console.error('Error fetching projects:', error);
    return [];
  }
};

// Quizzes/Challenges
export const addQuizChallengeToCampaign = async (campaignId: string, quizData: Omit<QuizChallenge, 'id' | 'campaignId' | 'createdAt'>): Promise<QuizChallenge> => {
  try {
    const quizzesColRef = collection(db, 'campaigns', campaignId, 'quizzes');
    const newQuizDataWithTimestamp = {
        ...quizData,
        campaignId,
        createdAt: serverTimestamp(), 
    };
    const docRef = await addDoc(quizzesColRef, newQuizDataWithTimestamp);
    const newDocSnap = await getDoc(docRef);
    const rawData = newDocSnap.data();
    if (!rawData) throw new Error("Failed to fetch newly added quiz.");
    const serialized = serializeFirestoreData(rawData);
    return {
        id: docRef.id,
        campaignId: serialized.campaignId,
        title: serialized.title,
        description: serialized.description,
        type: serialized.type,
        points: serialized.points,
        questions: serialized.questions,
        codingPrompt: serialized.codingPrompt,
        testCases: serialized.testCases,
        createdAt: serialized.createdAt as string, 
    } as QuizChallenge;
  } catch (error) {
    console.error('Error adding quiz/challenge:', error);
    throw error;
  }
};

export const getQuizChallengesForCampaign = async (campaignId: string): Promise<QuizChallenge[]> => {
  try {
    const quizzesColRef = collection(db, 'campaigns', campaignId, 'quizzes');
    const q = query(quizzesColRef, orderBy('createdAt', 'asc')); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
        const rawData = docSnap.data();
        const serialized = serializeFirestoreData(rawData);
        return {
            id: docSnap.id,
            campaignId: serialized.campaignId,
            title: serialized.title,
            description: serialized.description,
            type: serialized.type,
            points: serialized.points,
            questions: serialized.questions,
            codingPrompt: serialized.codingPrompt,
            testCases: serialized.testCases,
            createdAt: serialized.createdAt as string, 
        } as QuizChallenge;
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
};

// USER COURSE CERTIFICATES
export const submitOrUpdateCourseCertificate = async (
  userId: string,
  campaignId: string,
  courseId: string,
  certificateUrl: string
): Promise<UserCourseCertificate> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found for certificate submission.');
    }

    const certificatesCol = collection(db, 'userCourseCertificates');
    const q = query(
      certificatesCol,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    const dataToUpsert: any = { 
      userId,
      campaignId,
      courseId,
      userName: userProfile.displayName || userProfile.username || 'Anonymous',
      userEmail: userProfile.email || 'N/A',
      certificateUrl,
      status: 'review',
      submittedAt: serverTimestamp(), 
      reviewedAt: null, 
      adminNotes: null,
    };

    let docId: string;

    if (snapshot.empty) {
      const docRef = await addDoc(certificatesCol, dataToUpsert);
      docId = docRef.id;
    } else {
      const existingDoc = snapshot.docs[0];
      docId = existingDoc.id;
      const existingData = existingDoc.data() as Partial<UserCourseCertificate>;

      if (existingData.status === 'approved') {
        throw new Error('Cannot update an approved certificate.');
      }
      await updateDoc(doc(db, 'userCourseCertificates', docId), {
        certificateUrl: dataToUpsert.certificateUrl,
        userName: dataToUpsert.userName,
        userEmail: dataToUpsert.userEmail,
        status: 'review',
        submittedAt: dataToUpsert.submittedAt, 
        reviewedAt: null, 
        adminNotes: null,
      });
    }

    const finalDocSnap = await getDoc(doc(db, 'userCourseCertificates', docId));
    if (!finalDocSnap.exists()) {
        throw new Error('Failed to retrieve certificate after submission.');
    }
    const rawFinalData = finalDocSnap.data();
    const serializedFinal = serializeFirestoreData(rawFinalData);

    return {
        id: finalDocSnap.id,
        userId: serializedFinal.userId,
        campaignId: serializedFinal.campaignId,
        courseId: serializedFinal.courseId,
        userName: serializedFinal.userName,
        userEmail: serializedFinal.userEmail,
        certificateUrl: serializedFinal.certificateUrl,
        status: serializedFinal.status,
        submittedAt: serializedFinal.submittedAt as string, 
        reviewedAt: serializedFinal.reviewedAt ? serializedFinal.reviewedAt as string : null, 
        adminNotes: serializedFinal.adminNotes || null,
     } as UserCourseCertificate;

  } catch (error) {
    console.error('Error submitting/updating course certificate:', error);
    throw error;
  }
};

export const getUserCourseCertificateForCourse = async (
  userId: string,
  courseId: string
): Promise<UserCourseCertificate | null> => {
  try {
    const certificatesCol = collection(db, 'userCourseCertificates');
    const q = query(
      certificatesCol,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);

      return {
        id: docSnap.id,
        userId: serialized.userId,
        campaignId: serialized.campaignId,
        courseId: serialized.courseId,
        userName: serialized.userName,
        userEmail: serialized.userEmail,
        certificateUrl: serialized.certificateUrl,
        status: serialized.status,
        submittedAt: serialized.submittedAt as string, 
        reviewedAt: serialized.reviewedAt ? serialized.reviewedAt as string : null, 
        adminNotes: serialized.adminNotes || null,
      } as UserCourseCertificate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user course certificate:', error);
    return null;
  }
};

// Admin functions for certificates
export const getCertificatesForCourseForAdmin = async (courseId: string): Promise<UserCourseCertificate[]> => {
  try {
    const certificatesCol = collection(db, 'userCourseCertificates');
    const q = query(certificatesCol, where('courseId', '==', courseId), orderBy('submittedAt', 'desc')); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const rawData = docSnap.data();
      const serialized = serializeFirestoreData(rawData);

      return {
        id: docSnap.id,
        userId: serialized.userId,
        campaignId: serialized.campaignId,
        courseId: serialized.courseId,
        userName: serialized.userName,
        userEmail: serialized.userEmail,
        certificateUrl: serialized.certificateUrl,
        status: serialized.status,
        submittedAt: serialized.submittedAt as string, 
        reviewedAt: serialized.reviewedAt ? serialized.reviewedAt as string : null, 
        adminNotes: serialized.adminNotes || null,
      } as UserCourseCertificate;
    });
  } catch (error) {
    console.error('Error fetching certificates for course (admin):', error);
    return [];
  }
};

export const updateCertificateStatusByAdmin = async (certificateId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<void> => {
  try {
    const certRef = doc(db, 'userCourseCertificates', certificateId);
    const updateData: Partial<UserCourseCertificate> & { reviewedAt: any } = { 
      status,
      reviewedAt: String(serverTimestamp()), 
    };
    if (adminNotes && adminNotes.trim() !== "") {
      updateData.adminNotes = adminNotes;
    } else if (status === 'rejected' && (!adminNotes || adminNotes.trim() === "")) {
      updateData.adminNotes = 'No specific reason provided.';
    } else {
       updateData.adminNotes = null;
    }

    await updateDoc(certRef, updateData as any);
  } catch (error) {
    console.error('Error updating certificate status by admin:', error);
    throw error;
  }
};


// SEEDING (Keep existing seed functions)
export const seedCampaigns = async () => {
  const campaignsCol = collection(db, 'campaigns');
  const snapshot = await getDocs(query(campaignsCol, limit(1)));
  if (snapshot.empty) {
    const dummyCampaigns: Omit<Campaign, 'id' | 'createdAt'>[] = [
      {
        name: 'Web Dev Bootcamp',
        description: 'Master full-stack web development with React, Node.js, and Firebase.',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        imageUrl: 'https://placehold.co/600x300.png/7DF9FF/222831?text=Web+Dev',
        requiredPoints: 0,
      },
      {
        name: 'AI Innovators Challenge (External Link)',
        description: 'Dive into machine learning and build innovative AI projects. Apply via external form.',
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'upcoming',
        imageUrl: 'https://placehold.co/600x300.png/FFD700/222831?text=External+AI',
        requiredPoints: 20,
        applyLink: 'https://forms.gle/example',
      },
      {
        name: 'Data Science Hackathon (Internal)',
        description: 'Compete in a 48-hour data science hackathon. Apply directly through our platform.',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ongoing',
        imageUrl: 'https://placehold.co/600x300.png/39FF14/222831?text=AI+Challenge',
        requiredPoints: 100,
      },
      {
        name: 'Mobile App Accelerator',
        description: 'Learn to build cross-platform mobile apps with Flutter.',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'past',
        imageUrl: 'https://placehold.co/600x300.png/FFFFFF/222831?text=Mobile+Apps',
        requiredPoints: 50,
      },
    ];
    for (const camp of dummyCampaigns) {
      await addCampaign(camp);
    }
    console.log('Dummy campaigns seeded.');
  }
};
    
