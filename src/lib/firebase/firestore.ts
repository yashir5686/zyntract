
import { db } from './config';
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc, setDoc, updateDoc, Timestamp, writeBatch, collectionGroup } from 'firebase/firestore';
import type { Campaign, DailyChallenge, UserProfile, CampaignApplication, UserSolution, Course, Project, QuizChallenge, UserCourseCertificate } from '@/types';

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
      return {
        id: docData.id,
        ...serializeFirestoreData(docData.data()),
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
    const q = query(applicationsCol, where('userId', '==', userId), orderBy('appliedAtTimestamp', 'desc'));
    const appSnapshot = await getDocs(q);
    return appSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const serializedData = { ...data };
      if (serializedData.appliedAtTimestamp instanceof Timestamp) {
        serializedData.appliedAt = serializedData.appliedAtTimestamp.toDate().toISOString();
      } else if (typeof serializedData.appliedAtTimestamp === 'object' && serializedData.appliedAtTimestamp && 'toDate' in serializedData.appliedAtTimestamp) {
        serializedData.appliedAt = (serializedData.appliedAtTimestamp as { toDate: () => Date }).toDate().toISOString();
      }


      return { 
        id: docSnap.id, 
        ...serializeFirestoreData(serializedData), 
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
    const q = query(applicationsCol, where('campaignId', '==', campaignId), orderBy('appliedAtTimestamp', 'desc'));
    const appSnapshot = await getDocs(q);
    return appSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const serializedData = { ...data };
      if (serializedData.appliedAtTimestamp instanceof Timestamp) {
        serializedData.appliedAt = serializedData.appliedAtTimestamp.toDate().toISOString();
      } else if (typeof serializedData.appliedAtTimestamp === 'object' && serializedData.appliedAtTimestamp && 'toDate' in serializedData.appliedAtTimestamp) {
        serializedData.appliedAt = (serializedData.appliedAtTimestamp as { toDate: () => Date }).toDate().toISOString();
      }

      return { 
        id: docSnap.id, 
        ...serializeFirestoreData(serializedData),
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
    
    const applicationData: Omit<CampaignApplication, 'id' | 'appliedAt'> & { appliedAtTimestamp: any } = {
      userId,
      campaignId,
      status: 'approved', 
      userName: userData.displayName || userData.username || 'N/A',
      userEmail: userData.email || email,
      campaignName: campaignName || 'N/A',
      appliedAtTimestamp: serverTimestamp()
    };
    const docRef = await addDoc(applicationsCol, applicationData);
    return docRef.id;

  } catch (error) {
    console.error("Error enrolling user by email: ", error);
    throw error;
  }
};


// DAILY CHALLENGES
export const getTodaysDailyChallenge = async (): Promise<DailyChallenge | null> => {
  try {
    const today = new Date().toISOString().split('T')[0]; 
    const challengesCol = collection(db, 'dailyChallenges');
    const q = query(challengesCol, where('date', '==', today), limit(1));
    const challengeSnapshot = await getDocs(q);
    if (!challengeSnapshot.empty) {
      const docData = challengeSnapshot.docs[0];
      return { id: docData.id, ...serializeFirestoreData(docData.data()) } as DailyChallenge;
    }
    const fallbackQuery = query(challengesCol, orderBy('date', 'desc'), limit(1));
    const fallbackSnapshot = await getDocs(fallbackQuery);
    if (!fallbackSnapshot.empty) {
        const docData = fallbackSnapshot.docs[0];
        return { id: docData.id, ...serializeFirestoreData(docData.data()) } as DailyChallenge;
    }

    return null;
  } catch (error) {
    console.error("Error fetching today's daily challenge: ", error);
    return null;
  }
};

export const submitChallengeSolution = async (userId: string, challengeId: string, solution: string): Promise<UserSolution | null> => {
  try {
    const userSolutionData: Omit<UserSolution, 'pointsAwarded' | 'submittedAt' | 'submittedAtTimestamp'> & { submittedAtTimestamp: any } = {
      userId,
      challengeId,
      solution,
      submittedAtTimestamp: serverTimestamp(),
    };
    const submissionRef = doc(db, `userSubmissions/${userId}_${challengeId}`); 
    await setDoc(submissionRef, userSolutionData );

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const currentPoints = userSnap.data()?.points || 0;
        const currentStreak = userSnap.data()?.dailyChallengeStreak || 0;
        await updateDoc(userRef, {
            points: currentPoints + 10, 
            dailyChallengeStreak: currentStreak + 1,
        });
    }
    
    return { ...userSolutionData, submittedAt: new Date().toISOString(), pointsAwarded: 10 };
  } catch (error) {
    console.error("Error submitting challenge solution: ", error);
    throw error; 
  }
};

// USER PROFILE
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return serializeFirestoreData(userSnap.data()) as UserProfile;
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
      return serializeFirestoreData(querySnapshot.docs[0].data()) as UserProfile;
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
    const updateData: Partial<UserProfile> = { ...data };
    if (updateData.createdAt && typeof updateData.createdAt === 'string') {
        // If it's already a string, it might be from client, keep as is or re-evaluate if it needs to be a serverTimestamp
    }
    if (updateData.lastLogin && typeof updateData.lastLogin === 'string') {
        // Same as createdAt
    }
    await updateDoc(userRef, updateData);
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
    const newCourseData = {
      ...courseData,
      campaignId,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(coursesColRef, newCourseData);
    const serializedNewData = serializeFirestoreData(newCourseData);
    return { id: docRef.id, ...serializedNewData, createdAt: new Date().toISOString() } as Course;
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
};

export const getCoursesForCampaign = async (campaignId: string): Promise<Course[]> => {
  try {
    const coursesColRef = collection(db, 'campaigns', campaignId, 'courses');
    const q = query(coursesColRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...serializeFirestoreData(docSnap.data()) } as Course));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

// Projects
export const addProjectToCampaign = async (campaignId: string, projectData: Omit<Project, 'id' | 'campaignId' | 'createdAt'>): Promise<Project> => {
  try {
    const projectsColRef = collection(db, 'campaigns', campaignId, 'projects');
    const newProjectData = {
        ...projectData,
        campaignId,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(projectsColRef, newProjectData);
    const serializedNewData = serializeFirestoreData(newProjectData);
    return { id: docRef.id, ...serializedNewData, createdAt: new Date().toISOString() } as Project;
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
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...serializeFirestoreData(docSnap.data()) } as Project));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

// Quizzes/Challenges
export const addQuizChallengeToCampaign = async (campaignId: string, quizData: Omit<QuizChallenge, 'id' | 'campaignId' | 'createdAt'>): Promise<QuizChallenge> => {
  try {
    const quizzesColRef = collection(db, 'campaigns', campaignId, 'quizzes');
    const newQuizData = {
        ...quizData,
        campaignId,
        createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(quizzesColRef, newQuizData);
    const serializedNewData = serializeFirestoreData(newQuizData);
    return { id: docRef.id, ...serializedNewData, createdAt: new Date().toISOString() } as QuizChallenge;
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
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...serializeFirestoreData(docSnap.data()) } as QuizChallenge));
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
    const certificatesCol = collection(db, 'userCourseCertificates');
    const q = query(
      certificatesCol,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    const dataToUpsert: Omit<UserCourseCertificate, 'id' | 'submittedAt' | 'reviewedAt' | 'adminNotes'> & { submittedAtTimestamp: any } = {
      userId,
      campaignId,
      courseId,
      certificateUrl,
      status: 'review', 
      submittedAtTimestamp: serverTimestamp(),
    };

    let docId: string;
    let newStatus: UserCourseCertificate['status'] = 'review';

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
      // If existing and not approved, update URL and reset status to 'review'
      await updateDoc(doc(db, 'userCourseCertificates', docId), {
        certificateUrl: dataToUpsert.certificateUrl,
        status: newStatus,
        submittedAtTimestamp: dataToUpsert.submittedAtTimestamp,
        reviewedAtTimestamp: null, // Clear previous review details
        adminNotes: null, // Clear previous admin notes
      });
    }
    
    // Fetch the potentially created/updated document to return actual server timestamp
    const finalDoc = await getDoc(doc(db, 'userCourseCertificates', docId));
    if (!finalDoc.exists()) {
        throw new Error('Failed to retrieve certificate after submission.');
    }

    return { id: finalDoc.id, ...serializeFirestoreData(finalDoc.data()) } as UserCourseCertificate;

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
      const docData = snapshot.docs[0];
      return { id: docData.id, ...serializeFirestoreData(docData.data()) } as UserCourseCertificate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user course certificate:', error);
    return null;
  }
};

// Admin functions for certificates (Placeholders for now)
export const getCertificatesForCourseForAdmin = async (courseId: string): Promise<UserCourseCertificate[]> => {
    console.log("getCertificatesForCourseForAdmin called for courseId:", courseId);
    // In a real implementation, query 'userCourseCertificates' collection
    // where('courseId', '==', courseId).orderBy('submittedAtTimestamp', 'desc')
    return []; 
};

export const updateCertificateStatusByAdmin = async (certificateId: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<void> => {
    console.log("updateCertificateStatusByAdmin called for certId:", certificateId, "status:", status, "notes:", adminNotes);
    // In a real implementation, update the document in 'userCourseCertificates'
    // with the new status, adminNotes, and reviewedAtTimestamp: serverTimestamp()
    const certRef = doc(db, 'userCourseCertificates', certificateId);
    await updateDoc(certRef, {
        status,
        adminNotes: adminNotes || null,
        reviewedAtTimestamp: serverTimestamp()
    });
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

export const seedDailyChallenge = async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const challengesCol = collection(db, 'dailyChallenges');
  const q = query(challengesCol, where('date', '==', todayStr), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const dummyChallenge: Omit<DailyChallenge, 'id'> = {
      title: 'Two Sum Problem',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
      difficulty: 'easy',
      points: 10,
      date: todayStr,
    };
    await addDoc(challengesCol, dummyChallenge);
    console.log('Dummy daily challenge for today seeded.');
  }
};

