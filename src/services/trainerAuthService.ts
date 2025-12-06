import { TrainerProfile } from '../models/trainer';
import mongoService from './mongoService';

interface TrainerUser {
  id: string;
  email: string;
  role: 'trainer';
  profile?: TrainerProfile;
}

interface TrainerCredentials {
  email: string;
  password: string;
}

interface TrainerRegistration extends TrainerCredentials {
  firstName: string;
  lastName: string;
  phone: string;
}

class TrainerAuthService {
  private readonly TRAINER_STORAGE_KEY = 'athletex_trainer_user';
  private readonly TRAINERS_DB_KEY = 'athletex_trainers_db';

  // Register new trainer
  async register(registrationData: TrainerRegistration): Promise<TrainerUser> {
    const trainerId = `trainer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTrainer: TrainerUser = {
      id: trainerId,
      email: registrationData.email,
      role: 'trainer',
      profile: {
        id: `profile_${Date.now()}`,
        userId: trainerId,
        personalDetails: {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email,
          phone: registrationData.phone,
          dateOfBirth: '',
          gender: 'other',
          bio: '',
        },
        experience: {
          yearsOfExperience: 0,
          previousClubs: [],
          achievements: [],
          specializations: [],
        },
        qualifications: {
          degrees: [],
          certificates: [],
          licenses: [],
        },
        sportsExpertise: {
          primarySport: '',
          secondarySports: [],
          ageGroups: [],
          skillLevels: [],
        },
        pricing: {
          hourlyRate: 0,
          currency: 'USD',
          packageDeals: [],
        },
        availability: {
          timeZone: 'UTC',
          weeklySchedule: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
          blackoutDates: [],
        },
        verification: {
          status: 'pending',
          documents: [],
        },
        ratings: {
          averageRating: 0,
          totalReviews: 0,
          reviews: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };

    try {
      // Save to MongoDB
      const mongoResponse = await mongoService.createTrainer({
        _id: trainerId,
        email: registrationData.email,
        password: registrationData.password, // In production, hash this
        role: 'trainer',
        ...newTrainer.profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Trainer saved to MongoDB:', mongoResponse);
    } catch (error: any) {
      console.error('Error saving trainer to MongoDB:', error);
      
      // Check if email already exists
      if (error?.error?.includes('duplicate') || error?.error?.includes('already exists')) {
        throw new Error('Email already registered');
      }
    }

    // Also save locally for offline access
    const trainersDb = this.getTrainersDb();
    
    // Check if email already exists locally
    if (trainersDb.find(t => t.email === registrationData.email)) {
      throw new Error('Email already registered');
    }

    trainersDb.push(newTrainer);
    this.setTrainersDb(trainersDb);

    // Store current trainer
    localStorage.setItem(this.TRAINER_STORAGE_KEY, JSON.stringify(newTrainer));
    
    return newTrainer;
  }

  // Login trainer
  async login(credentials: TrainerCredentials): Promise<TrainerUser> {
    try {
      // Try to get trainer from MongoDB
      const trainers: any = await mongoService.getAllTrainers();
      
      if (trainers.success && trainers.data) {
        const mongoTrainer: any = trainers.data.find((t: any) => 
          t.email === credentials.email || 
          t.personalDetails?.email === credentials.email
        );
        
        if (mongoTrainer) {
          // Verify password (in production, use proper password hashing)
          if (mongoTrainer.password === credentials.password) {
            const trainer: TrainerUser = {
              id: mongoTrainer._id || mongoTrainer.id,
              email: mongoTrainer.email || mongoTrainer.personalDetails?.email,
              role: 'trainer',
              profile: {
                id: mongoTrainer.id || mongoTrainer._id,
                userId: mongoTrainer.userId || mongoTrainer._id,
                personalDetails: mongoTrainer.personalDetails || {
                  firstName: '',
                  lastName: '',
                  email: mongoTrainer.email,
                  phone: '',
                  dateOfBirth: '',
                  gender: 'other',
                  bio: '',
                },
                experience: mongoTrainer.experience || {
                  yearsOfExperience: 0,
                  previousClubs: [],
                  achievements: [],
                  specializations: [],
                },
                qualifications: mongoTrainer.qualifications || {
                  degrees: [],
                  certificates: [],
                  licenses: [],
                },
                sportsExpertise: mongoTrainer.sportsExpertise || {
                  primarySport: '',
                  secondarySports: [],
                  ageGroups: [],
                  skillLevels: [],
                },
                pricing: mongoTrainer.pricing || {
                  hourlyRate: 0,
                  currency: 'USD',
                  packageDeals: [],
                },
                availability: mongoTrainer.availability || {
                  timeZone: 'UTC',
                  weeklySchedule: {
                    monday: [],
                    tuesday: [],
                    wednesday: [],
                    thursday: [],
                    friday: [],
                    saturday: [],
                    sunday: [],
                  },
                  blackoutDates: [],
                },
                verification: mongoTrainer.verification || {
                  status: 'pending',
                  documents: [],
                },
                ratings: mongoTrainer.ratings || {
                  averageRating: 0,
                  totalReviews: 0,
                  reviews: [],
                },
                createdAt: mongoTrainer.createdAt || new Date().toISOString(),
                updatedAt: mongoTrainer.updatedAt || new Date().toISOString(),
              }
            };
            
            // Store current trainer locally
            localStorage.setItem(this.TRAINER_STORAGE_KEY, JSON.stringify(trainer));
            
            // Also update local database
            const trainersDb = this.getTrainersDb();
            const existingIndex = trainersDb.findIndex(t => t.id === trainer.id);
            if (existingIndex >= 0) {
              trainersDb[existingIndex] = trainer;
            } else {
              trainersDb.push(trainer);
            }
            this.setTrainersDb(trainersDb);
            
            return trainer;
          }
        }
      }
    } catch (error) {
      console.log('MongoDB login failed, trying local storage:', error);
    }
    
    // Fallback to local storage
    const trainersDb = this.getTrainersDb();
    const trainer = trainersDb.find(t => t.email === credentials.email);
    
    if (trainer) {
      // Store current trainer
      localStorage.setItem(this.TRAINER_STORAGE_KEY, JSON.stringify(trainer));
      return trainer;
    }
    
    throw new Error('Invalid email or password');
  }

  // Logout trainer
  logout(): void {
    localStorage.removeItem(this.TRAINER_STORAGE_KEY);
  }

  // Get current trainer
  getCurrentTrainer(): TrainerUser | null {
    const trainerData = localStorage.getItem(this.TRAINER_STORAGE_KEY);
    if (trainerData) {
      try {
        return JSON.parse(trainerData) as TrainerUser;
      } catch (error) {
        console.error('Error parsing trainer data:', error);
        localStorage.removeItem(this.TRAINER_STORAGE_KEY);
      }
    }
    return null;
  }

  // Check if trainer is logged in
  isTrainerLoggedIn(): boolean {
    return this.getCurrentTrainer() !== null;
  }

  // Update trainer profile
  async updateProfile(profileData: Partial<TrainerProfile>): Promise<TrainerProfile> {
    const currentTrainer = this.getCurrentTrainer();
    if (!currentTrainer || !currentTrainer.profile) {
      throw new Error('No trainer logged in');
    }

    const updatedProfile = {
      ...currentTrainer.profile,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    const updatedTrainer = {
      ...currentTrainer,
      profile: updatedProfile,
    };

    try {
      // Update in MongoDB
      await mongoService.updateTrainer(currentTrainer.id, {
        ...updatedProfile,
        updatedAt: new Date().toISOString()
      });

      console.log('Trainer profile updated in MongoDB');
    } catch (error) {
      console.error('Error updating trainer in MongoDB:', error);
    }

    // Update in local database
    const trainersDb = this.getTrainersDb();
    const index = trainersDb.findIndex(t => t.id === currentTrainer.id);
    if (index >= 0) {
      trainersDb[index] = updatedTrainer;
      this.setTrainersDb(trainersDb);
    }

    // Update current trainer
    localStorage.setItem(this.TRAINER_STORAGE_KEY, JSON.stringify(updatedTrainer));
    
    return updatedProfile;
  }

  // Get all trainers (for admin/SAI portal)
  getAllTrainers(): TrainerUser[] {
    return this.getTrainersDb();
  }

  // Get verified trainers (for athletes to browse)
  getVerifiedTrainers(): TrainerUser[] {
    return this.getTrainersDb().filter(t => 
      t.profile?.verification.status === 'verified'
    );
  }

  // Get trainers by sport
  getTrainersBySport(sport: string): TrainerUser[] {
    return this.getVerifiedTrainers().filter(t => 
      t.profile?.sportsExpertise.primarySport === sport ||
      t.profile?.sportsExpertise.secondarySports.includes(sport)
    );
  }

  // Private helper methods
  private getTrainersDb(): TrainerUser[] {
    const data = localStorage.getItem(this.TRAINERS_DB_KEY);
    return data ? JSON.parse(data) : [];
  }

  private setTrainersDb(trainers: TrainerUser[]): void {
    localStorage.setItem(this.TRAINERS_DB_KEY, JSON.stringify(trainers));
  }

  // Initialize with demo data
  initializeDemoData(): void {
    // Always refresh demo data to ensure we have all coaches
    this.refreshDemoData();
  }

  // Force refresh demo data (clears existing and adds all demo trainers)
  refreshDemoData(): void {
      const demoTrainers: TrainerUser[] = [
        {
          id: 'trainer_demo_1',
          email: 'john.coach@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_1',
            userId: 'trainer_demo_1',
            personalDetails: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.coach@example.com',
              phone: '+1-555-0123',
              dateOfBirth: '1985-03-15',
              gender: 'male',
              profilePicture: '',
              bio: 'Professional football coach with 10+ years experience training athletes at all levels.',
            },
            experience: {
              yearsOfExperience: 12,
              previousClubs: ['Manchester United Youth', 'Chelsea Academy', 'Arsenal Training Center'],
              achievements: ['UEFA Pro License', 'Youth Coach of the Year 2022', 'Premier League Academy Certification'],
              specializations: ['Technical Skills', 'Tactical Awareness', 'Physical Conditioning'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_1',
                institution: 'University of Sports Science',
                degree: 'Bachelor of Sports Science',
                field: 'Sports Coaching',
                graduationYear: 2008,
              }],
              certificates: [{
                id: 'cert_1',
                name: 'UEFA Pro License',
                issuingOrganization: 'UEFA',
                issueDate: '2015-06-01',
                expiryDate: '2025-06-01',
              }],
              licenses: [{
                id: 'lic_1',
                name: 'Professional Coaching License',
                licenseNumber: 'PCL-2015-001234',
                issuingAuthority: 'National Football Association',
                issueDate: '2015-01-15',
                expiryDate: '2025-01-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Football',
              secondarySports: ['Soccer', 'Futsal'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['intermediate', 'advanced', 'professional'],
            },
            pricing: {
              hourlyRate: 75,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_1',
                name: '4-Session Package',
                sessions: 4,
                totalPrice: 280,
                description: 'Intensive skill development package',
                validityDays: 30,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                tuesday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                wednesday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                thursday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                friday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                saturday: [{ startTime: '10:00', endTime: '16:00', available: true }],
                sunday: [{ startTime: '10:00', endTime: '16:00', available: false }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-01-15',
              documents: [],
            },
            ratings: {
              averageRating: 4.8,
              totalReviews: 24,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_2',
          email: 'sarah.tennis@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_2',
            userId: 'trainer_demo_2',
            personalDetails: {
              firstName: 'Sarah',
              lastName: 'Williams',
              email: 'sarah.tennis@example.com',
              phone: '+1-555-0124',
              dateOfBirth: '1988-07-22',
              gender: 'female',
              profilePicture: '',
              bio: 'Former professional tennis player turned coach. Specializing in technique and mental game.',
            },
            experience: {
              yearsOfExperience: 8,
              previousClubs: ['Wimbledon Tennis Academy', 'US Open Training Center'],
              achievements: ['WTA Certified Coach', 'Junior Coach of the Year 2021'],
              specializations: ['Serve Technique', 'Mental Training', 'Match Strategy'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_2',
                institution: 'Tennis Academy International',
                degree: 'Professional Tennis Coaching',
                field: 'Tennis Coaching',
                graduationYear: 2012,
              }],
              certificates: [{
                id: 'cert_2',
                name: 'WTA Coaching Certification',
                issuingOrganization: 'WTA',
                issueDate: '2016-03-01',
                expiryDate: '2026-03-01',
              }],
              licenses: [{
                id: 'lic_2',
                name: 'Professional Tennis Coach License',
                licenseNumber: 'PTC-2016-005678',
                issuingAuthority: 'International Tennis Federation',
                issueDate: '2016-01-15',
                expiryDate: '2026-01-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Tennis',
              secondarySports: ['Badminton'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['beginner', 'intermediate', 'advanced'],
            },
            pricing: {
              hourlyRate: 85,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_2',
                name: '6-Session Tennis Package',
                sessions: 6,
                totalPrice: 480,
                description: 'Complete tennis skill development',
                validityDays: 45,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                tuesday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                wednesday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                thursday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                friday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                saturday: [{ startTime: '09:00', endTime: '15:00', available: true }],
                sunday: [{ startTime: '09:00', endTime: '15:00', available: false }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-01-20',
              documents: [],
            },
            ratings: {
              averageRating: 4.9,
              totalReviews: 18,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-20T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_3',
          email: 'mike.swimming@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_3',
            userId: 'trainer_demo_3',
            personalDetails: {
              firstName: 'Mike',
              lastName: 'Johnson',
              email: 'mike.swimming@example.com',
              phone: '+1-555-0125',
              dateOfBirth: '1982-11-10',
              gender: 'male',
              profilePicture: '',
              bio: 'Olympic swimming coach with expertise in competitive swimming and water safety.',
            },
            experience: {
              yearsOfExperience: 15,
              previousClubs: ['Olympic Training Center', 'National Swimming Academy'],
              achievements: ['Olympic Coach 2020', 'National Swimming Coach Award'],
              specializations: ['Competitive Swimming', 'Stroke Technique', 'Endurance Training'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_3',
                institution: 'Sports University',
                degree: 'Master of Aquatic Sports',
                field: 'Swimming Coaching',
                graduationYear: 2005,
              }],
              certificates: [{
                id: 'cert_3',
                name: 'Olympic Coaching Certification',
                issuingOrganization: 'IOC',
                issueDate: '2018-01-01',
                expiryDate: '2028-01-01',
              }],
              licenses: [{
                id: 'lic_3',
                name: 'Professional Swimming Coach',
                licenseNumber: 'PSC-2018-009876',
                issuingAuthority: 'World Swimming Federation',
                issueDate: '2018-01-15',
                expiryDate: '2028-01-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Swimming',
              secondarySports: ['Water Polo', 'Diving'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['intermediate', 'advanced', 'professional'],
            },
            pricing: {
              hourlyRate: 95,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_3',
                name: '8-Session Swimming Package',
                sessions: 8,
                totalPrice: 720,
                description: 'Intensive swimming technique and endurance',
                validityDays: 60,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '06:00', endTime: '14:00', available: true }],
                tuesday: [{ startTime: '06:00', endTime: '14:00', available: true }],
                wednesday: [{ startTime: '06:00', endTime: '14:00', available: true }],
                thursday: [{ startTime: '06:00', endTime: '14:00', available: true }],
                friday: [{ startTime: '06:00', endTime: '14:00', available: true }],
                saturday: [{ startTime: '07:00', endTime: '13:00', available: true }],
                sunday: [{ startTime: '07:00', endTime: '13:00', available: false }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-01-25',
              documents: [],
            },
            ratings: {
              averageRating: 4.7,
              totalReviews: 32,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-25T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_4',
          email: 'alex.basketball@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_4',
            userId: 'trainer_demo_4',
            personalDetails: {
              firstName: 'Alex',
              lastName: 'Rodriguez',
              email: 'alex.basketball@example.com',
              phone: '+1-555-0126',
              dateOfBirth: '1985-09-15',
              gender: 'male',
              profilePicture: '',
              bio: 'Former NBA player turned coach. Specializing in basketball fundamentals and advanced techniques.',
            },
            experience: {
              yearsOfExperience: 10,
              previousClubs: ['Los Angeles Lakers Academy', 'Golden State Warriors Training'],
              achievements: ['NBA Championship Ring', 'Basketball Coach of the Year 2023'],
              specializations: ['Shooting Mechanics', 'Team Strategy', 'Player Development'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_4',
                institution: 'UCLA',
                degree: 'Bachelor of Kinesiology',
                field: 'Sports Science',
                graduationYear: 2007,
              }],
              certificates: [{
                id: 'cert_4',
                name: 'NBA Coaching Certification',
                issuingOrganization: 'NBA',
                issueDate: '2017-08-01',
                expiryDate: '2027-08-01',
              }],
              licenses: [{
                id: 'lic_4',
                name: 'Professional Basketball Coach',
                licenseNumber: 'PBC-2017-012345',
                issuingAuthority: 'USA Basketball',
                issueDate: '2017-08-15',
                expiryDate: '2027-08-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Basketball',
              secondarySports: ['Volleyball'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['intermediate', 'advanced', 'professional'],
            },
            pricing: {
              hourlyRate: 120,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_4',
                name: '10-Session Basketball Package',
                sessions: 10,
                totalPrice: 1100,
                description: 'Complete basketball skill development program',
                validityDays: 90,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '16:00', endTime: '20:00', available: true }],
                tuesday: [{ startTime: '16:00', endTime: '20:00', available: true }],
                wednesday: [{ startTime: '16:00', endTime: '20:00', available: true }],
                thursday: [{ startTime: '16:00', endTime: '20:00', available: true }],
                friday: [{ startTime: '16:00', endTime: '20:00', available: true }],
                saturday: [{ startTime: '08:00', endTime: '16:00', available: true }],
                sunday: [{ startTime: '08:00', endTime: '16:00', available: false }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-02-01',
              documents: [],
            },
            ratings: {
              averageRating: 4.9,
              totalReviews: 45,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-02-01T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_5',
          email: 'maria.athletics@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_5',
            userId: 'trainer_demo_5',
            personalDetails: {
              firstName: 'Maria',
              lastName: 'Garcia',
              email: 'maria.athletics@example.com',
              phone: '+1-555-0127',
              dateOfBirth: '1990-03-20',
              gender: 'female',
              profilePicture: '',
              bio: 'Olympic track and field athlete with expertise in sprinting and long jump training.',
            },
            experience: {
              yearsOfExperience: 7,
              previousClubs: ['Olympic Training Center', 'Stanford Athletics'],
              achievements: ['Olympic Bronze Medal', 'World Championships Finalist'],
              specializations: ['Sprint Training', 'Long Jump', 'Athletic Conditioning'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_5',
                institution: 'Stanford University',
                degree: 'Master of Exercise Science',
                field: 'Athletic Performance',
                graduationYear: 2014,
              }],
              certificates: [{
                id: 'cert_5',
                name: 'USATF Level 3 Certification',
                issuingOrganization: 'USA Track & Field',
                issueDate: '2019-05-01',
                expiryDate: '2029-05-01',
              }],
              licenses: [{
                id: 'lic_5',
                name: 'Professional Athletics Coach',
                licenseNumber: 'PAC-2019-067890',
                issuingAuthority: 'World Athletics',
                issueDate: '2019-05-15',
                expiryDate: '2029-05-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Athletics',
              secondarySports: ['Cross Country'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['beginner', 'intermediate', 'advanced'],
            },
            pricing: {
              hourlyRate: 90,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_5',
                name: '8-Session Sprint Package',
                sessions: 8,
                totalPrice: 680,
                description: 'Sprint technique and speed development',
                validityDays: 60,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '06:00', endTime: '10:00', available: true }],
                tuesday: [{ startTime: '06:00', endTime: '10:00', available: true }],
                wednesday: [{ startTime: '06:00', endTime: '10:00', available: true }],
                thursday: [{ startTime: '06:00', endTime: '10:00', available: true }],
                friday: [{ startTime: '06:00', endTime: '10:00', available: true }],
                saturday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                sunday: [{ startTime: '07:00', endTime: '11:00', available: true }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-02-05',
              documents: [],
            },
            ratings: {
              averageRating: 4.8,
              totalReviews: 28,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-02-05T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_6',
          email: 'david.cricket@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_6',
            userId: 'trainer_demo_6',
            personalDetails: {
              firstName: 'David',
              lastName: 'Kumar',
              email: 'david.cricket@example.com',
              phone: '+1-555-0128',
              dateOfBirth: '1983-12-08',
              gender: 'male',
              profilePicture: '',
              bio: 'Former international cricket player with expertise in batting and bowling techniques.',
            },
            experience: {
              yearsOfExperience: 12,
              previousClubs: ['Mumbai Indians Academy', 'Royal Challengers Academy'],
              achievements: ['IPL Champion', 'International Cricket Coach Award'],
              specializations: ['Batting Technique', 'Bowling Mechanics', 'Match Strategy'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_6',
                institution: 'National Cricket Academy',
                degree: 'Advanced Cricket Coaching',
                field: 'Cricket Coaching',
                graduationYear: 2010,
              }],
              certificates: [{
                id: 'cert_6',
                name: 'ICC Level 3 Coaching',
                issuingOrganization: 'International Cricket Council',
                issueDate: '2015-07-01',
                expiryDate: '2025-07-01',
              }],
              licenses: [{
                id: 'lic_6',
                name: 'Professional Cricket Coach',
                licenseNumber: 'PCC-2015-098765',
                issuingAuthority: 'Board of Control for Cricket',
                issueDate: '2015-07-15',
                expiryDate: '2025-07-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Cricket',
              secondarySports: ['Baseball'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['beginner', 'intermediate', 'advanced'],
            },
            pricing: {
              hourlyRate: 80,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_6',
                name: '12-Session Cricket Package',
                sessions: 12,
                totalPrice: 900,
                description: 'Complete cricket skills development',
                validityDays: 120,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '14:00', endTime: '18:00', available: true }],
                tuesday: [{ startTime: '14:00', endTime: '18:00', available: true }],
                wednesday: [{ startTime: '14:00', endTime: '18:00', available: true }],
                thursday: [{ startTime: '14:00', endTime: '18:00', available: true }],
                friday: [{ startTime: '14:00', endTime: '18:00', available: true }],
                saturday: [{ startTime: '09:00', endTime: '17:00', available: true }],
                sunday: [{ startTime: '09:00', endTime: '17:00', available: true }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-02-10',
              documents: [],
            },
            ratings: {
              averageRating: 4.7,
              totalReviews: 38,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-02-10T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_7',
          email: 'lisa.yoga@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_7',
            userId: 'trainer_demo_7',
            personalDetails: {
              firstName: 'Lisa',
              lastName: 'Chen',
              email: 'lisa.yoga@example.com',
              phone: '+1-555-0129',
              dateOfBirth: '1988-06-25',
              gender: 'female',
              profilePicture: '',
              bio: 'Certified yoga instructor and fitness coach specializing in flexibility and mindfulness training.',
            },
            experience: {
              yearsOfExperience: 9,
              previousClubs: ['Zen Wellness Center', 'Elite Fitness Studio'],
              achievements: ['Yoga Alliance Certified', 'Mindfulness Coach Award'],
              specializations: ['Hatha Yoga', 'Flexibility Training', 'Meditation'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_7',
                institution: 'Yoga Institute',
                degree: 'Yoga Teacher Training',
                field: 'Yoga & Wellness',
                graduationYear: 2015,
              }],
              certificates: [{
                id: 'cert_7',
                name: 'RYT-500 Certification',
                issuingOrganization: 'Yoga Alliance',
                issueDate: '2016-09-01',
                expiryDate: '2026-09-01',
              }],
              licenses: [{
                id: 'lic_7',
                name: 'Professional Fitness Instructor',
                licenseNumber: 'PFI-2016-123456',
                issuingAuthority: 'Fitness Australia',
                issueDate: '2016-09-15',
                expiryDate: '2026-09-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Yoga',
              secondarySports: ['Pilates', 'Meditation'],
              ageGroups: ['adult'],
              skillLevels: ['beginner', 'intermediate', 'advanced'],
            },
            pricing: {
              hourlyRate: 65,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_7',
                name: '6-Session Wellness Package',
                sessions: 6,
                totalPrice: 360,
                description: 'Yoga and mindfulness training program',
                validityDays: 45,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                tuesday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                wednesday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                thursday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                friday: [{ startTime: '07:00', endTime: '11:00', available: true }],
                saturday: [{ startTime: '08:00', endTime: '12:00', available: true }],
                sunday: [{ startTime: '08:00', endTime: '12:00', available: true }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-02-15',
              documents: [],
            },
            ratings: {
              averageRating: 4.9,
              totalReviews: 52,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-02-15T00:00:00Z',
          }
        },
        {
          id: 'trainer_demo_8',
          email: 'james.boxing@example.com',
          role: 'trainer',
          profile: {
            id: 'profile_demo_8',
            userId: 'trainer_demo_8',
            personalDetails: {
              firstName: 'James',
              lastName: 'Thompson',
              email: 'james.boxing@example.com',
              phone: '+1-555-0130',
              dateOfBirth: '1980-11-12',
              gender: 'male',
              profilePicture: '',
              bio: 'Professional boxing coach and former heavyweight contender with 15+ years of training experience.',
            },
            experience: {
              yearsOfExperience: 16,
              previousClubs: ['Golden Gloves Gym', 'Elite Boxing Academy'],
              achievements: ['Professional Boxing License', 'Trainer of the Year 2022'],
              specializations: ['Boxing Technique', 'Combat Training', 'Strength & Conditioning'],
            },
            qualifications: {
              degrees: [{
                id: 'deg_8',
                institution: 'Boxing Academy',
                degree: 'Professional Boxing Coaching',
                field: 'Combat Sports',
                graduationYear: 2008,
              }],
              certificates: [{
                id: 'cert_8',
                name: 'USA Boxing Certification',
                issuingOrganization: 'USA Boxing',
                issueDate: '2012-04-01',
                expiryDate: '2027-04-01',
              }],
              licenses: [{
                id: 'lic_8',
                name: 'Professional Boxing Trainer',
                licenseNumber: 'PBT-2012-567890',
                issuingAuthority: 'World Boxing Association',
                issueDate: '2012-04-15',
                expiryDate: '2027-04-15',
              }],
            },
            sportsExpertise: {
              primarySport: 'Boxing',
              secondarySports: ['MMA', 'Kickboxing'],
              ageGroups: ['youth', 'adult'],
              skillLevels: ['beginner', 'intermediate', 'advanced'],
            },
            pricing: {
              hourlyRate: 100,
              currency: 'USD',
              packageDeals: [{
                id: 'pkg_8',
                name: '8-Session Boxing Package',
                sessions: 8,
                totalPrice: 750,
                description: 'Complete boxing training program',
                validityDays: 60,
              }],
            },
            availability: {
              timeZone: 'UTC',
              weeklySchedule: {
                monday: [{ startTime: '17:00', endTime: '21:00', available: true }],
                tuesday: [{ startTime: '17:00', endTime: '21:00', available: true }],
                wednesday: [{ startTime: '17:00', endTime: '21:00', available: true }],
                thursday: [{ startTime: '17:00', endTime: '21:00', available: true }],
                friday: [{ startTime: '17:00', endTime: '21:00', available: true }],
                saturday: [{ startTime: '10:00', endTime: '18:00', available: true }],
                sunday: [{ startTime: '10:00', endTime: '18:00', available: false }],
              },
              blackoutDates: [],
            },
            verification: {
              status: 'verified',
              verifiedBy: 'SAI Admin',
              verificationDate: '2024-02-20',
              documents: [],
            },
            ratings: {
              averageRating: 4.8,
              totalReviews: 41,
              reviews: [],
            },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-02-20T00:00:00Z',
          }
        }
      ];
      
      this.setTrainersDb(demoTrainers);
  }
}

const trainerAuthService = new TrainerAuthService();
export default trainerAuthService;