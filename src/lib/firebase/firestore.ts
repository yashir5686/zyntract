
import { db } from './config';
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Campaign, DailyChallenge, UserProfile, CampaignApplication, UserSolution } from '@/types';

// CAMPAIGNS
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const campaignsCol = collection(db, 'campaigns');
    const q = query(campaignsCol, orderBy('startDate', 'asc'));
    const campaignSnapshot = await getDocs(q);
    const campaignList = campaignSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
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
      return { id: campaignSnap.id, ...campaignSnap.data() } as Campaign;
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
      delete dataToAdd.applyLink; // Don't store empty string, store undefined or remove field
    }

    const docRef = await addDoc(campaignsCol, dataToAdd);
    return docRef.id;
  } catch (error) {
    console.error("Error adding new campaign: ", error);
    throw error; // Re-throw to be handled by the caller
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

    const applicationData: Omit<CampaignApplication, 'id'> = {
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const challengesCol = collection(db, 'dailyChallenges');
    const q = query(challengesCol, where('date', '==', today), limit(1));
    const challengeSnapshot = await getDocs(q);
    if (!challengeSnapshot.empty) {
      const docData = challengeSnapshot.docs[0];
      return { id: docData.id, ...docData.data() } as DailyChallenge;
    }
    const fallbackQuery = query(challengesCol, orderBy('date', 'desc'), limit(1));
    const fallbackSnapshot = await getDocs(fallbackQuery);
    if (!fallbackSnapshot.empty) {
        const docData = fallbackSnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as DailyChallenge;
    }

    return null;
  } catch (error) {
    console.error("Error fetching today's daily challenge: ", error);
    return null;
  }
};

export const submitChallengeSolution = async (userId: string, challengeId: string, solution: string): Promise<UserSolution | null> => {
  try {
    const userSolutionData: Omit<UserSolution, 'pointsAwarded'> = {
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
    
    return { ...userSolutionData, pointsAwarded: 10 };
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
      return userSnap.data() as UserProfile;
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
      return querySnapshot.docs[0].data() as UserProfile;
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
    await updateDoc(userRef, {
      ...data,
    });
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
    return appSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampaignApplication));
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
        applyLink: 'https://forms.gle/example', // Replace with a real or placeholder Google Form link
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
      await addCampaign(camp); // Use the updated addCampaign function
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

