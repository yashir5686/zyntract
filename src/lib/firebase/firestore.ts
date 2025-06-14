import { db } from './config';
import { collection, getDocs, addDoc, query, where, orderBy, limit, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import type { Campaign, DailyChallenge, UserProfile, CampaignApplication, UserSolution } from '@/types';

// CAMPAIGNS
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const campaignsCol = collection(db, 'campaigns');
    // Example: order by start date, filter for upcoming/ongoing
    const q = query(campaignsCol, where('status', 'in', ['ongoing', 'upcoming']), orderBy('startDate', 'asc'));
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
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (campaignSnap.exists()) {
      return { id: campaignSnap.id, ...campaignSnap.data() } as Campaign;
    }
    return null;
  } catch (error) {
    console.error("Error fetching campaign by ID: ", error);
    return null;
  }
}

export const applyToCampaign = async (userId: string, campaignId: string, userName?: string, userEmail?: string, campaignName?: string): Promise<string | null> => {
  try {
    // Check if user already applied
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
      appliedAt: new Date(), // Client-side date, Firestore serverTimestamp is better for distributed systems
      userName: userName || 'N/A',
      userEmail: userEmail || 'N/A',
      campaignName: campaignName || 'N/A',
    };
    
    const docRef = await addDoc(collection(db, 'campaignApplications'), {
      ...applicationData,
      appliedAtTimestamp: serverTimestamp() // Use server timestamp for consistency
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
    // For simplicity, fetch the latest challenge. In a real app, this would be date-based.
    // This requires challenges to have a 'date' field (YYYY-MM-DD string) or a timestamp.
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const challengesCol = collection(db, 'dailyChallenges');
    const q = query(challengesCol, where('date', '==', today), limit(1));
    // As a fallback if no challenge for 'today', get the most recent one.
    // const q = query(challengesCol, orderBy('date', 'desc'), limit(1));
    const challengeSnapshot = await getDocs(q);
    if (!challengeSnapshot.empty) {
      const docData = challengeSnapshot.docs[0];
      return { id: docData.id, ...docData.data() } as DailyChallenge;
    }
    // Fallback: If no challenge for today, try to get the most recent one.
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
    // This would typically involve a Firebase Function to evaluate the solution and award points.
    // For now, just save the submission.
    const submissionRef = doc(db, `userSubmissions/${userId}_${challengeId}`); // Composite ID or subcollection
    await setDoc(submissionRef, { ...userSolutionData, submittedAtTimestamp: serverTimestamp() });

    // Placeholder: award points and update streak (this logic should be in a backend function)
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: ((await getDoc(userRef)).data()?.points || 0) + 10, // Example: 10 points
      dailyChallengeStreak: ((await getDoc(userRef)).data()?.dailyChallengeStreak || 0) + 1,
    });
    
    return { ...userSolutionData, pointsAwarded: 10 }; // Return with dummy points
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

// Helper to create some dummy campaigns if the collection is empty
export const seedCampaigns = async () => {
  const campaignsCol = collection(db, 'campaigns');
  const snapshot = await getDocs(query(campaignsCol, limit(1)));
  if (snapshot.empty) {
    const dummyCampaigns: Omit<Campaign, 'id'>[] = [
      {
        name: 'Web Dev Bootcamp',
        description: 'Master full-stack web development with React, Node.js, and Firebase.',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(), // 33 days from now
        status: 'upcoming',
        imageUrl: 'https://placehold.co/600x300.png/7DF9FF/222831?text=Web+Dev',
        requiredPoints: 0,
      },
      {
        name: 'AI Innovators Challenge',
        description: 'Dive into machine learning and build innovative AI projects.',
        startDate: new Date().toISOString(), // Starts today
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        status: 'ongoing',
        imageUrl: 'https://placehold.co/600x300.png/39FF14/222831?text=AI+Challenge',
        requiredPoints: 100,
      },
      {
        name: 'Mobile App Accelerator',
        description: 'Learn to build cross-platform mobile apps with Flutter.',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Started 30 days ago
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Ended yesterday
        status: 'past',
        imageUrl: 'https://placehold.co/600x300.png/FFFFFF/222831?text=Mobile+Apps',
        requiredPoints: 50,
      },
    ];
    for (const camp of dummyCampaigns) {
      await addDoc(campaignsCol, camp);
    }
    console.log('Dummy campaigns seeded.');
  }
};

// Helper to create a dummy daily challenge if none exists for today
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
