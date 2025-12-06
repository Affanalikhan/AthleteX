import { User } from '../models';
import mongoService from './mongoService';

class AuthService {
  private readonly CURRENT_USER_KEY = 'athletex_current_user';
  private readonly USERS_DB_KEY = 'athletex_users_db';

  // Sign up - creates new user account
  async signUp(email: string, password: string, displayName: string): Promise<User> {
    const uid = this.generateId();
    const user: User = {
      id: uid,
      uid,
      email: email || 'user@example.com',
      displayName: displayName || 'User',
      role: 'athlete'
    };
    
    try {
      // Store user in MongoDB
      const mongoUser = await mongoService.createUser({
        ...user,
        password, // In production, hash this password
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create athlete profile in MongoDB
      await mongoService.createAthlete({
        userId: uid,
        email: email,
        profile: {
          name: displayName,
          email: email,
          sport: '',
          age: 0,
          height: 0,
          weight: 0,
          goals: [],
          bio: ''
        },
        performance: {
          overallScore: 0,
          speed: 0,
          endurance: 0,
          strength: 0,
          agility: 0,
          flexibility: 0
        },
        assessments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Also store locally for offline access
      this.storeUserInDB(user, password);
      this.setCurrentUser(user);
      
      return user;
    } catch (error) {
      console.error('Error creating user in MongoDB, falling back to local storage:', error);
      // Fallback to local storage
      this.storeUserInDB(user, password);
      this.setCurrentUser(user);
      return user;
    }
  }

  // Sign in - authenticates existing user
  async signIn(email: string, password: string): Promise<User> {
    try {
      // Try to get user from MongoDB
      const mongoUserResponse: any = await mongoService.getUserByEmail(email);
      
      if (mongoUserResponse.success && mongoUserResponse.data) {
        const mongoUser: any = mongoUserResponse.data;
        
        // Verify password (in production, use proper password hashing)
        if (mongoUser.password === password) {
          const user: User = {
            id: mongoUser._id || mongoUser.id,
            uid: mongoUser.uid || mongoUser._id,
            email: mongoUser.email,
            displayName: mongoUser.displayName,
            role: mongoUser.role || 'athlete'
          };
          
          this.setCurrentUser(user);
          return user;
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      console.log('MongoDB login failed, trying local storage:', error);
    }
    
    // Fallback to local storage
    const existingUser = this.findUserByCredentials(email, password);
    
    if (existingUser) {
      this.setCurrentUser(existingUser);
      return existingUser;
    }
    
    throw new Error('Invalid email or password');
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  setupRecaptcha(): void {
    // no-op
  }

  async sendOTP(phoneNumber: string): Promise<void> {
    // no-op - just pretend it worked
  }

  async verifyOTP(otp: string, displayName: string): Promise<User> {
    // Accept any OTP
    const uid = this.generateId();
    const user: User = {
      id: uid,
      uid,
      email: '',
      displayName: displayName || 'Phone User',
      role: 'athlete'
    };
    
    this.setCurrentUser(user);
    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.getCurrent();
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const user = this.getCurrent();
    callback(user);
    return () => {};
  }

  // Helper methods
  private setCurrentUser(user: User): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
  }

  private getCurrent(): User | null {
    try {
      const stored = localStorage.getItem(this.CURRENT_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private storeUserInDB(user: User, password: string): void {
    const users = this.getUsersDB();
    const userRecord = {
      ...user,
      password: password, // In real app, this would be hashed
      createdAt: new Date().toISOString()
    };
    
    // Remove existing user with same email if any
    const filteredUsers = users.filter(u => u.email !== user.email);
    filteredUsers.push(userRecord);
    
    localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(filteredUsers));
  }

  private findUserByCredentials(email: string, password: string): User | null {
    const users = this.getUsersDB();
    const userRecord = users.find(u => 
      (u.email === email || u.displayName === email) && u.password === password
    );
    
    if (userRecord) {
      // Return user without password
      const { password: _, ...user } = userRecord;
      return user as User;
    }
    
    return null;
  }

  private getUsersDB(): any[] {
    try {
      const stored = localStorage.getItem(this.USERS_DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private generateId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }
}

const authService = new AuthService();
export default authService;
