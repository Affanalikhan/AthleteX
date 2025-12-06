export interface TrainerProfile {
  id: string;
  userId: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    profilePicture?: string;
    bio: string;
  };
  experience: {
    yearsOfExperience: number;
    previousClubs: string[];
    achievements: string[];
    specializations: string[];
  };
  qualifications: {
    degrees: Degree[];
    certificates: Certificate[];
    licenses: License[];
  };
  sportsExpertise: {
    primarySport: string;
    secondarySports: string[];
    ageGroups: string[]; // 'youth', 'adult', 'senior', 'all'
    skillLevels: string[]; // 'beginner', 'intermediate', 'advanced', 'professional'
  };
  pricing: {
    hourlyRate: number;
    currency: string;
    packageDeals: PackageDeal[];
  };
  availability: {
    timeZone: string;
    weeklySchedule: WeeklySchedule;
    blackoutDates: string[];
  };
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedBy?: string;
    verificationDate?: string;
    documents: VerificationDocument[];
    kyc?: {
      aadharCard?: {
        number: string;
        documentUrl?: string;
        verified: boolean;
      };
      panCard?: {
        number: string;
        documentUrl?: string;
        verified: boolean;
      };
      email?: {
        address: string;
        verified: boolean;
        verificationCode?: string;
      };
      phone?: {
        number: string;
        verified: boolean;
        otp?: string;
        otpExpiry?: string;
      };
    };
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
    reviews: Review[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Degree {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
  documentUrl?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface License {
  id: string;
  name: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  documentUrl?: string;
}

export interface PackageDeal {
  id: string;
  name: string;
  sessions: number;
  totalPrice: number;
  description: string;
  validityDays: number;
}

export interface WeeklySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  available: boolean;
}

export interface VerificationDocument {
  id: string;
  type: 'degree' | 'certificate' | 'license' | 'identity' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Review {
  id: string;
  athleteId: string;
  athleteName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CoachingSession {
  id: string;
  trainerId: string;
  athleteId: string;
  sport: string;
  sessionType: 'one-on-one' | 'group' | 'assessment';
  scheduledDate: string;
  duration: number; // in minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  meetingLink?: string;
  notes?: string;
  recording?: string;
  feedback?: SessionFeedback;
  payment: {
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'refunded';
    transactionId?: string;
  };
  createdAt: string;
}

export interface SessionFeedback {
  trainerFeedback: string;
  athleteFeedback?: string;
  skillsWorkedOn: string[];
  improvementAreas: string[];
  nextSessionGoals: string[];
  rating?: number;
}

export interface TrainerApplication {
  id: string;
  applicantEmail: string;
  personalDetails: TrainerProfile['personalDetails'];
  experience: TrainerProfile['experience'];
  qualifications: TrainerProfile['qualifications'];
  sportsExpertise: TrainerProfile['sportsExpertise'];
  documents: VerificationDocument[];
  applicationStatus: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}