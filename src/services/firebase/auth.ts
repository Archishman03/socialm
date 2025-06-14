import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  theme_preference?: string;
  color_theme?: string;
  created_at: Date;
  updated_at: Date;
}

export const authService = {
  // Register new user
  async register(email: string, password: string, name: string, username: string) {
    try {
      // Validate inputs
      if (!email || !password || !name || !username) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      // Check if username is already taken
      const usernameExists = await this.checkUsernameExists(username);
      if (usernameExists) {
        throw new Error('Username is already taken');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: name.trim()
      });

      // Create user profile document
      const userProfile: UserProfile = {
        id: user.uid,
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        theme_preference: 'light',
        color_theme: 'green',
        created_at: new Date(),
        updated_at: new Date()
      };

      await setDoc(doc(db, 'profiles', user.uid), userProfile);

      return { user, profile: userProfile };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters long');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.');
      }
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      return userCredential;
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      return true;
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error('Failed to send password reset email. Please contact support for assistance.');
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date()
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const docRef = doc(db, 'profiles', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  },

  // Check if username exists
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      // This would require a cloud function or different approach in Firebase
      // For now, we'll implement a simple check
      return false; // Implement proper username checking
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  },

  // Auth state observer
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};