import { Athlete } from '../models';
import mongoService from './mongoService';

class AthleteService {
  private readonly ATHLETES_KEY = 'athletex_athletes';

  async createProfile(userId: string, athleteData: Partial<Athlete>): Promise<Athlete> {
    const athlete: Athlete = {
      id: userId,
      name: '',
      email: '',
      phoneNumber: '',
      age: 0,
      gender: 'other' as const,
      weight: 0,
      height: 0,
      sportsPlayed: [],
      country: '',
      state: '',
      city: '',
      pinCode: '',
      profilePictureUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...athleteData
    };

    try {
      // Save to MongoDB
      const response = await mongoService.updateAthleteProfile(userId, {
        profile: {
          name: athlete.name,
          email: athlete.email,
          sport: athlete.sportsPlayed[0] || '',
          age: athlete.age,
          height: athlete.height,
          weight: athlete.weight,
          goals: [],
          bio: ''
        },
        phoneNumber: athlete.phoneNumber,
        gender: athlete.gender,
        sportsPlayed: athlete.sportsPlayed,
        country: athlete.country,
        state: athlete.state,
        city: athlete.city,
        pinCode: athlete.pinCode,
        profilePictureUrl: athlete.profilePictureUrl,
        dietPreference: athleteData.dietPreference,
        updatedAt: new Date().toISOString()
      });

      console.log('Profile saved to MongoDB:', response);
    } catch (error) {
      console.error('Error saving to MongoDB, using local storage:', error);
    }

    // Also save locally for offline access
    const athletes = this.getAthletes();
    const existingIndex = athletes.findIndex(a => a.id === userId);
    
    if (existingIndex >= 0) {
      athletes[existingIndex] = athlete;
    } else {
      athletes.push(athlete);
    }
    
    this.setAthletes(athletes);
    return athlete;
  }

  async getProfile(userId: string): Promise<Athlete | null> {
    try {
      // Try to get from MongoDB first
      const response: any = await mongoService.getAthleteByUserId(userId);
      
      if (response.success && response.data) {
        const mongoAthlete: any = response.data;
        
        // Convert MongoDB athlete to local Athlete format
        const athlete: Athlete = {
          id: mongoAthlete.userId || mongoAthlete._id,
          name: mongoAthlete.profile?.name || mongoAthlete.name || '',
          email: mongoAthlete.profile?.email || mongoAthlete.email || '',
          phoneNumber: mongoAthlete.phoneNumber || '',
          age: mongoAthlete.profile?.age || mongoAthlete.age || 0,
          gender: mongoAthlete.gender || 'other',
          weight: mongoAthlete.profile?.weight || mongoAthlete.weight || 0,
          height: mongoAthlete.profile?.height || mongoAthlete.height || 0,
          sportsPlayed: mongoAthlete.sportsPlayed || [mongoAthlete.profile?.sport].filter(Boolean) || [],
          country: mongoAthlete.country || '',
          state: mongoAthlete.state || '',
          city: mongoAthlete.city || '',
          pinCode: mongoAthlete.pinCode || '',
          profilePictureUrl: mongoAthlete.profilePictureUrl || '',
          dietPreference: mongoAthlete.dietPreference,
          createdAt: new Date(mongoAthlete.createdAt),
          updatedAt: new Date(mongoAthlete.updatedAt)
        };
        
        // Also save to local storage for offline access
        const athletes = this.getAthletes();
        const existingIndex = athletes.findIndex(a => a.id === userId);
        if (existingIndex >= 0) {
          athletes[existingIndex] = athlete;
        } else {
          athletes.push(athlete);
        }
        this.setAthletes(athletes);
        
        return athlete;
      }
    } catch (error) {
      console.log('Error fetching from MongoDB, using local storage:', error);
    }
    
    // Fallback to local storage
    const athletes = this.getAthletes();
    const athlete = athletes.find(a => a.id === userId);
    return athlete || null;
  }

  async updateProfile(userId: string, updates: Partial<Athlete>): Promise<void> {
    try {
      // Update in MongoDB
      await mongoService.updateAthleteProfile(userId, {
        profile: {
          name: updates.name,
          email: updates.email,
          sport: updates.sportsPlayed?.[0],
          age: updates.age,
          height: updates.height,
          weight: updates.weight,
          goals: [],
          bio: ''
        },
        phoneNumber: updates.phoneNumber,
        gender: updates.gender,
        sportsPlayed: updates.sportsPlayed,
        country: updates.country,
        state: updates.state,
        city: updates.city,
        pinCode: updates.pinCode,
        profilePictureUrl: updates.profilePictureUrl,
        dietPreference: updates.dietPreference,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating MongoDB, using local storage:', error);
    }
    
    // Also update locally
    const athletes = this.getAthletes();
    const index = athletes.findIndex(a => a.id === userId);
    
    if (index >= 0) {
      athletes[index] = {
        ...athletes[index],
        ...updates,
        updatedAt: new Date()
      };
      this.setAthletes(athletes);
    }
  }

  async uploadProfilePicture(userId: string, file: File): Promise<string> {
    // For demo purposes, create a data URL from the file
    const dataURL = await this.fileToDataURL(file);
    await this.updateProfile(userId, { profilePictureUrl: dataURL });
    return dataURL;
  }

  async deleteProfilePicture(userId: string): Promise<void> {
    await this.updateProfile(userId, { profilePictureUrl: '' });
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return this.getAthletes();
  }

  async getAthleteById(athleteId: string): Promise<Athlete | null> {
    const athletes = this.getAthletes();
    return athletes.find(a => a.id === athleteId) || null;
  }

  // Helper methods
  private getAthletes(): Athlete[] {
    try {
      const stored = localStorage.getItem(this.ATHLETES_KEY);
      return stored ? JSON.parse(stored).map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt)
      })) : [];
    } catch {
      return [];
    }
  }

  private setAthletes(athletes: Athlete[]): void {
    localStorage.setItem(this.ATHLETES_KEY, JSON.stringify(athletes));
  }

  private fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

const athleteService = new AthleteService();
export default athleteService;
