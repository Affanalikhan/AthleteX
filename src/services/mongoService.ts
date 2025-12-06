import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class MongoService {
  // Users
  async createUser(userData: any) {
    try {
      const response = await axios.post(`${API_URL}/users`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error.response?.data || error;
    }
  }

  async getUserById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      throw error.response?.data || error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const response = await axios.get(`${API_URL}/users/email/${email}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user by email:', error);
      throw error.response?.data || error;
    }
  }

  async updateUser(id: string, userData: any) {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw error.response?.data || error;
    }
  }

  // Trainers
  async createTrainer(trainerData: any) {
    try {
      const response = await axios.post(`${API_URL}/trainers`, trainerData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      throw error.response?.data || error;
    }
  }

  async getTrainerById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/trainers/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trainer:', error);
      throw error.response?.data || error;
    }
  }

  async getAllTrainers() {
    try {
      const response = await axios.get(`${API_URL}/trainers`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      throw error.response?.data || error;
    }
  }

  async getVerifiedTrainers() {
    try {
      const response = await axios.get(`${API_URL}/trainers/verified`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching verified trainers:', error);
      throw error.response?.data || error;
    }
  }

  async getTrainersBySport(sport: string) {
    try {
      const response = await axios.get(`${API_URL}/trainers/sport/${sport}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trainers by sport:', error);
      throw error.response?.data || error;
    }
  }

  async updateTrainer(id: string, trainerData: any) {
    try {
      const response = await axios.put(`${API_URL}/trainers/${id}`, trainerData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      throw error.response?.data || error;
    }
  }

  // KYC Verification
  async updateTrainerKYC(trainerId: string, kycData: any) {
    try {
      const response = await axios.put(`${API_URL}/trainers/${trainerId}/kyc`, kycData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating KYC:', error);
      throw error.response?.data || error;
    }
  }

  async getTrainerKYC(trainerId: string) {
    try {
      const response = await axios.get(`${API_URL}/trainers/${trainerId}/kyc`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching KYC:', error);
      throw error.response?.data || error;
    }
  }

  async verifyAadhar(trainerId: string) {
    try {
      const response = await axios.post(`${API_URL}/trainers/${trainerId}/kyc/aadhar/verify`);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying Aadhar:', error);
      throw error.response?.data || error;
    }
  }

  async verifyPAN(trainerId: string) {
    try {
      const response = await axios.post(`${API_URL}/trainers/${trainerId}/kyc/pan/verify`);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying PAN:', error);
      throw error.response?.data || error;
    }
  }

  async verifyEmail(trainerId: string) {
    try {
      const response = await axios.post(`${API_URL}/trainers/${trainerId}/kyc/email/verify`);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying email:', error);
      throw error.response?.data || error;
    }
  }

  async verifyPhone(trainerId: string) {
    try {
      const response = await axios.post(`${API_URL}/trainers/${trainerId}/kyc/phone/verify`);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying phone:', error);
      throw error.response?.data || error;
    }
  }

  // Athletes
  async createAthlete(athleteData: any) {
    try {
      const response = await axios.post(`${API_URL}/athletes`, athleteData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating athlete:', error);
      throw error.response?.data || error;
    }
  }

  async getAthleteById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/athletes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athlete:', error);
      throw error.response?.data || error;
    }
  }

  async getAthleteByUserId(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/athletes/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athlete by user ID:', error);
      throw error.response?.data || error;
    }
  }

  async getAllAthletes() {
    try {
      const response = await axios.get(`${API_URL}/athletes`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athletes:', error);
      throw error.response?.data || error;
    }
  }

  async getTopAthletes(limit: number = 10) {
    try {
      const response = await axios.get(`${API_URL}/athletes/top/${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching top athletes:', error);
      throw error.response?.data || error;
    }
  }

  async getAthletesBySport(sport: string) {
    try {
      const response = await axios.get(`${API_URL}/athletes/sport/${sport}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athletes by sport:', error);
      throw error.response?.data || error;
    }
  }

  async updateAthlete(id: string, athleteData: any) {
    try {
      const response = await axios.put(`${API_URL}/athletes/${id}`, athleteData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating athlete:', error);
      throw error.response?.data || error;
    }
  }

  async updateAthleteProfile(userId: string, profileData: any) {
    try {
      const response = await axios.put(`${API_URL}/athletes/user/${userId}/profile`, profileData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating athlete profile:', error);
      throw error.response?.data || error;
    }
  }

  // Assessments
  async createAssessment(assessmentData: any) {
    try {
      const response = await axios.post(`${API_URL}/assessments`, assessmentData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating assessment:', error);
      throw error.response?.data || error;
    }
  }

  async getAssessmentById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/assessments/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assessment:', error);
      throw error.response?.data || error;
    }
  }

  async getAssessmentsByUserId(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/assessments/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assessments by user ID:', error);
      throw error.response?.data || error;
    }
  }

  async getAssessmentsByAthleteId(athleteId: string) {
    try {
      const response = await axios.get(`${API_URL}/assessments/athlete/${athleteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assessments by athlete ID:', error);
      throw error.response?.data || error;
    }
  }

  async getRecentAssessments(limit: number = 10) {
    try {
      const response = await axios.get(`${API_URL}/assessments/recent/${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching recent assessments:', error);
      throw error.response?.data || error;
    }
  }

  async getAssessmentStats(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/assessments/user/${userId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assessment stats:', error);
      throw error.response?.data || error;
    }
  }

  async updateAssessment(id: string, assessmentData: any) {
    try {
      const response = await axios.put(`${API_URL}/assessments/${id}`, assessmentData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating assessment:', error);
      throw error.response?.data || error;
    }
  }

  // Performance
  async createPerformanceMetric(performanceData: any) {
    try {
      const response = await axios.post(`${API_URL}/performance`, performanceData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating performance metric:', error);
      throw error.response?.data || error;
    }
  }

  async getPerformanceByUserId(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/performance/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching performance by user ID:', error);
      throw error.response?.data || error;
    }
  }

  async getPerformanceByDateRange(userId: string, startDate: string, endDate: string) {
    try {
      const response = await axios.get(`${API_URL}/performance/user/${userId}/range`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching performance by date range:', error);
      throw error.response?.data || error;
    }
  }

  async getLatestPerformance(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/performance/user/${userId}/latest`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching latest performance:', error);
      throw error.response?.data || error;
    }
  }

  async getPerformanceAverages(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/performance/user/${userId}/averages`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching performance averages:', error);
      throw error.response?.data || error;
    }
  }

  async updatePerformanceMetric(id: string, performanceData: any) {
    try {
      const response = await axios.put(`${API_URL}/performance/${id}`, performanceData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating performance metric:', error);
      throw error.response?.data || error;
    }
  }

  // SAI Dashboard
  async getSAIDashboardStats() {
    try {
      const response = await axios.get(`${API_URL}/sai/dashboard/stats`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching SAI dashboard stats:', error);
      throw error.response?.data || error;
    }
  }

  async getAthleteRankings(limit: number = 50) {
    try {
      const response = await axios.get(`${API_URL}/sai/athletes/rankings/${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching athlete rankings:', error);
      throw error.response?.data || error;
    }
  }

  async getTrainerVerificationQueue() {
    try {
      const response = await axios.get(`${API_URL}/sai/trainers/verification-queue`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching trainer verification queue:', error);
      throw error.response?.data || error;
    }
  }

  async getPerformanceTrends(days: number = 30) {
    try {
      const response = await axios.get(`${API_URL}/sai/analytics/performance-trends/${days}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching performance trends:', error);
      throw error.response?.data || error;
    }
  }

  async getSportDistribution() {
    try {
      const response = await axios.get(`${API_URL}/sai/analytics/sport-distribution`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sport distribution:', error);
      throw error.response?.data || error;
    }
  }

  // Sessions
  async createSession(sessionData: any) {
    try {
      const response = await axios.post(`${API_URL}/sessions`, sessionData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating session:', error);
      throw error.response?.data || error;
    }
  }

  async getSessionById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching session:', error);
      throw error.response?.data || error;
    }
  }

  async getSessionsByTrainerId(trainerId: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions/trainer/${trainerId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sessions by trainer ID:', error);
      throw error.response?.data || error;
    }
  }

  async getSessionsByAthleteId(athleteId: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions/athlete/${athleteId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching sessions by athlete ID:', error);
      throw error.response?.data || error;
    }
  }

  async getUpcomingSessions(trainerId: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions/trainer/${trainerId}/upcoming`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching upcoming sessions:', error);
      throw error.response?.data || error;
    }
  }

  async updateSession(id: string, sessionData: any) {
    try {
      const response = await axios.put(`${API_URL}/sessions/${id}`, sessionData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating session:', error);
      throw error.response?.data || error;
    }
  }

  async updateSessionStatus(id: string, status: string) {
    try {
      const response = await axios.patch(`${API_URL}/sessions/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error updating session status:', error);
      throw error.response?.data || error;
    }
  }

  // Social Posts
  async createPost(postData: any) {
    try {
      const response = await axios.post(`${API_URL}/social/posts`, postData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      throw error.response?.data || error;
    }
  }

  async getAllPosts(limit: number = 50) {
    try {
      const response = await axios.get(`${API_URL}/social/posts`, { params: { limit } });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      throw error.response?.data || error;
    }
  }

  async getPostsByUserId(userId: string) {
    try {
      const response = await axios.get(`${API_URL}/social/posts/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
      throw error.response?.data || error;
    }
  }

  async getPostById(id: string) {
    try {
      const response = await axios.get(`${API_URL}/social/posts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching post:', error);
      throw error.response?.data || error;
    }
  }

  async updatePost(id: string, postData: any) {
    try {
      const response = await axios.put(`${API_URL}/social/posts/${id}`, postData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating post:', error);
      throw error.response?.data || error;
    }
  }

  async likePost(postId: string, userId: string) {
    try {
      const response = await axios.post(`${API_URL}/social/posts/${postId}/like`, { userId });
      return response.data;
    } catch (error: any) {
      console.error('Error liking post:', error);
      throw error.response?.data || error;
    }
  }

  async unlikePost(postId: string, userId: string) {
    try {
      const response = await axios({
        method: 'delete',
        url: `${API_URL}/social/posts/${postId}/like`,
        data: { userId }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error unliking post:', error);
      throw error.response?.data || error;
    }
  }

  async addComment(postId: string, comment: any) {
    try {
      const response = await axios.post(`${API_URL}/social/posts/${postId}/comments`, comment);
      return response.data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw error.response?.data || error;
    }
  }

  async deletePost(id: string) {
    try {
      const response = await axios.delete(`${API_URL}/social/posts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      throw error.response?.data || error;
    }
  }
}

export default new MongoService();
