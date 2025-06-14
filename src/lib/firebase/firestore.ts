
import { db } from './config';
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Campaign, DailyChallenge, UserProfile, CampaignApplication, UserSolution } from '@/types';

// Helper function to serialize Firestore data
const serializeFirestoreData = (data: Record<string, any>): Record<string, any> => {
  const serializedData: Record<string, any> = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      serializedData[key] = (data[key] as Timestamp).toDate().toISOString();
    } else if (data[key] instanceof Date) { // Also handle JS Date objects if they sneak in
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

export const addCampaign = async (campaignData: Omit<Campaign, 'id'>): Promise<string> => {
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

export const applyToCampaign = async (userId: string, campaignId: string, userName?: string, userEmail?: string, campaignName?: string): Promise<string | null> => {
  try {
    const applicationsCol = collection(db, 'campaignApplications');
    const q = query(applicationsCol, where('userId', '==', userId), where('campaignId', '==', campaignId));
    const existingApplication = await getDocs(q);

    if (!existingApplication.empty) {
      throw new Error("You have already applied to this campaign.");
    }

    const applicationData: Omit<CampaignApplication, 'id' | 'appliedAt'> & { appliedAt: Date } = {
      userId,
      campaignId,
      status: 'pending',
      appliedAt: new Date(), 
      userName: userName || 'N/A',
      userEmail: userEmail || 'N/A',
      campaignName: campaignName || 'N/A',
    };
    
    const docRef = await addDoc(collection(db, 'campaignApplications'), {
      ...applicationData,
      appliedAtTimestamp: serverTimestamp() 
    });
    return docRef.id;
  } catch (error) {
    console.error("Error applying to campaign: ", error);
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
    const userSolutionData: Omit<UserSolution, 'pointsAwarded' | 'submittedAt'> & { submittedAt: Date } = {
      userId,
      challengeId,
      solution,
      submittedAt: new Date(),
    };
    const submissionRef = doc(db, `userSubmissions/${userId}_${challengeId}`); 
    await setDoc(submissionRef, { ...userSolutionData, submittedAtTimestamp: serverTimestamp() });

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
    
    return { ...userSolutionData, submittedAt: userSolutionData.submittedAt.toISOString(), pointsAwarded: 10 };
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
    // Ensure timestamps are handled correctly if they are part of data
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

export const getCampaignApplicationsByUserId = async (userId: string): Promise<CampaignApplication[]> => {
  try {
    const applicationsCol = collection(db, 'campaignApplications');
    const q = query(applicationsCol, where('userId', '==', userId), orderBy('appliedAtTimestamp', 'desc'));
    const appSnapshot = await getDocs(q);
    return appSnapshot.docs.map(doc => {
      const data = doc.data();
      // The CampaignApplication type expects appliedAt to be a string.
      // applyToCampaign stores appliedAt as a Date, and appliedAtTimestamp as serverTimestamp.
      // We should prioritize appliedAtTimestamp if available for accuracy.
      let appliedAtString: string;
      if (data.appliedAtTimestamp instanceof Timestamp) {
        appliedAtString = data.appliedAtTimestamp.toDate().toISOString();
      } else if (data.appliedAt instanceof Timestamp) { // Fallback to appliedAt if it's a Timestamp
        appliedAtString = data.appliedAt.toDate().toISOString();
      } else if (data.appliedAt instanceof Date) { // Fallback if it's a JS Date
         appliedAtString = data.appliedAt.toISOString();
      }
       else if (typeof data.appliedAt === 'string') { // If it's already a string
        appliedAtString = data.appliedAt;
      }
      else {
        appliedAtString = new Date().toISOString(); // Default if no valid date found
      }

      const serializedApp = serializeFirestoreData(data);

      return { 
        id: doc.id, 
        ...serializedApp,
        appliedAt: appliedAtString // Ensure appliedAt is a string
      } as CampaignApplication;
    });
  } catch (error) {
    console.error("Error fetching campaign applications for user: ", error);
    return [];
  }
};

export const seedCampaigns = async () => {
  const campaignsCol = collection(db, 'campaigns');
  const snapshot = await getDocs(query(campaignsCol, limit(1)));
  if (snapshot.empty) {
    const dummyCampaigns: Omit<Campaign, 'id'>[] = [
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
