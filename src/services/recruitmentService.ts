export interface RecruitmentRegistration {
  id: string;
  campaignId: string;
  campaignName: string;
  userId: string;
  userEmail: string;
  fullName: string;
  age: string;
  sport: string;
  city: string;
  phoneNumber: string;
  experience: string;
  achievements: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'shortlisted';
}

export interface RecruitmentCampaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  targetSports: string[];
  recruitmentQuota: number;
  eligibilityCriteria: { minScore: number };
  cities: string[];
  state: string;
  startDate: string;
  endDate: string;
  coordinator: string;
  contactEmail: string;
  totalApplicants: number;
  shortlisted: number;
}

class RecruitmentService {
  private readonly REGISTRATIONS_KEY = 'sai_registrations';
  private readonly CAMPAIGNS_KEY = 'sai_campaigns';

  // Get all active campaigns
  getActiveCampaigns(): RecruitmentCampaign[] {
    const campaigns = this.getAllCampaigns();
    return campaigns.filter(c => c.status === 'active' || c.status === 'upcoming');
  }

  // Get all campaigns
  getAllCampaigns(): RecruitmentCampaign[] {
    try {
      const stored = localStorage.getItem(this.CAMPAIGNS_KEY);
      return stored ? JSON.parse(stored) : this.generateDefaultCampaigns();
    } catch {
      return this.generateDefaultCampaigns();
    }
  }

  // Register for a campaign
  registerForCampaign(registration: Omit<RecruitmentRegistration, 'id' | 'registrationDate' | 'status'>): RecruitmentRegistration {
    const newRegistration: RecruitmentRegistration = {
      ...registration,
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationDate: new Date().toISOString(),
      status: 'pending'
    };

    const registrations = this.getRegistrations();
    registrations.push(newRegistration);
    this.saveRegistrations(registrations);

    return newRegistration;
  }

  // Get user's registrations
  getUserRegistrations(userId: string): RecruitmentRegistration[] {
    const registrations = this.getRegistrations();
    return registrations.filter(r => r.userId === userId);
  }

  // Get all registrations
  getRegistrations(): RecruitmentRegistration[] {
    try {
      const stored = localStorage.getItem(this.REGISTRATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Check if user is already registered for a campaign
  isUserRegistered(userId: string, campaignId: string): boolean {
    const registrations = this.getRegistrations();
    return registrations.some(r => r.userId === userId && r.campaignId === campaignId);
  }

  // Update registration status
  updateRegistrationStatus(registrationId: string, status: RecruitmentRegistration['status']): boolean {
    const registrations = this.getRegistrations();
    const index = registrations.findIndex(r => r.id === registrationId);
    
    if (index !== -1) {
      registrations[index].status = status;
      this.saveRegistrations(registrations);
      return true;
    }
    
    return false;
  }

  // Get campaign statistics
  getCampaignStats(campaignId: string) {
    const registrations = this.getRegistrations();
    const campaignRegistrations = registrations.filter(r => r.campaignId === campaignId);
    
    return {
      total: campaignRegistrations.length,
      pending: campaignRegistrations.filter(r => r.status === 'pending').length,
      approved: campaignRegistrations.filter(r => r.status === 'approved').length,
      rejected: campaignRegistrations.filter(r => r.status === 'rejected').length,
      shortlisted: campaignRegistrations.filter(r => r.status === 'shortlisted').length
    };
  }

  // Private methods
  private saveRegistrations(registrations: RecruitmentRegistration[]): void {
    localStorage.setItem(this.REGISTRATIONS_KEY, JSON.stringify(registrations));
  }

  private generateDefaultCampaigns(): RecruitmentCampaign[] {
    const indianStatesData = [
      { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'] },
      { state: 'Arunachal Pradesh', cities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila'] },
      { state: 'Assam', cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'] },
      { state: 'Bihar', cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'] },
      { state: 'Chhattisgarh', cities: ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg'] },
      { state: 'Goa', cities: ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda'] },
      { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'] },
      { state: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar'] },
      { state: 'Himachal Pradesh', cities: ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'] },
      { state: 'Jharkhand', cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'] },
      { state: 'Karnataka', cities: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'] },
      { state: 'Kerala', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'] },
      { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'] },
      { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'] },
      { state: 'Manipur', cities: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'] },
      { state: 'Meghalaya', cities: ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara'] },
      { state: 'Mizoram', cities: ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'] },
      { state: 'Nagaland', cities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'] },
      { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'] },
      { state: 'Punjab', cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'] },
      { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Udaipur'] },
      { state: 'Sikkim', cities: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Soreng'] },
      { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'] },
      { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar'] },
      { state: 'Tripura', cities: ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia'] },
      { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi'] },
      { state: 'Uttarakhand', cities: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur'] },
      { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'] },
      { state: 'Delhi', cities: ['New Delhi', 'Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi'] }
    ];

    return indianStatesData.map((stateData, index) => ({
      id: `campaign-${index}`,
      name: `${stateData.state} Talent Hunt 2024`,
      description: `State-level athletics talent identification program for ${stateData.state}`,
      status: (index % 3 === 0 ? 'active' : index % 3 === 1 ? 'upcoming' : 'completed') as 'active' | 'upcoming' | 'completed',
      targetSports: ['Athletics', 'Football', 'Hockey', 'Basketball', 'Wrestling'],
      recruitmentQuota: Math.floor(Math.random() * 50) + 20,
      eligibilityCriteria: { minScore: 70 },
      cities: stateData.cities,
      state: stateData.state,
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      coordinator: `SAI ${stateData.state} Office`,
      contactEmail: `sai.${stateData.state.toLowerCase().replace(/\s+/g, '')}@gov.in`,
      totalApplicants: Math.floor(Math.random() * 500) + 100,
      shortlisted: Math.floor(Math.random() * 50) + 10
    }));
  }
}

const recruitmentService = new RecruitmentService();
export default recruitmentService;