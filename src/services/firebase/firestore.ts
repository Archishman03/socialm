import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Post {
  id?: string;
  user_id: string;
  content: string;
  image_url?: string;
  video_url?: string;
  visibility: 'public' | 'friends';
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id?: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface Like {
  id?: string;
  post_id: string;
  user_id: string;
  created_at: Date;
}

export interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  read: boolean;
  created_at: Date;
}

export interface Friend {
  id?: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id?: string;
  user_id: string;
  type: string;
  content: string;
  reference_id?: string;
  read: boolean;
  deleted_at?: Date;
  created_at: Date;
}

export interface Story {
  id?: string;
  user_id: string;
  image_url?: string;
  photo_urls?: string[];
  photo_metadata?: any[];
  views_count: number;
  created_at: Date;
  expires_at: Date;
}

export const firestoreService = {
  // Posts
  async createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...post,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async getPosts(userId?: string) {
    try {
      let q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
      
      if (userId) {
        q = query(collection(db, 'posts'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Post[];
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  },

  async updatePost(postId: string, updates: Partial<Post>) {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(postId: string) {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Comments
  async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'comments'), {
        ...comment,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  async getComments(postId: string) {
    try {
      const q = query(
        collection(db, 'comments'), 
        where('post_id', '==', postId),
        orderBy('created_at', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Comment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  // Likes
  async createLike(like: Omit<Like, 'id' | 'created_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'likes'), {
        ...like,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating like:', error);
      throw error;
    }
  },

  async deleteLike(postId: string, userId: string) {
    try {
      const q = query(
        collection(db, 'likes'),
        where('post_id', '==', postId),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    } catch (error) {
      console.error('Error deleting like:', error);
      throw error;
    }
  },

  async getLikes(postId: string) {
    try {
      const q = query(collection(db, 'likes'), where('post_id', '==', postId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      })) as Like[];
    } catch (error) {
      console.error('Error getting likes:', error);
      throw error;
    }
  },

  // Messages
  async createMessage(message: Omit<Message, 'id' | 'created_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  },

  async getMessages(userId1: string, userId2: string) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('sender_id', 'in', [userId1, userId2]),
        where('receiver_id', 'in', [userId1, userId2]),
        orderBy('created_at', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      })) as Message[];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async markMessageAsRead(messageId: string) {
    try {
      const docRef = doc(db, 'messages', messageId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  // Friends
  async createFriendRequest(friendRequest: Omit<Friend, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'friends'), {
        ...friendRequest,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating friend request:', error);
      throw error;
    }
  },

  async updateFriendRequest(friendId: string, status: 'accepted' | 'rejected') {
    try {
      const docRef = doc(db, 'friends', friendId);
      await updateDoc(docRef, {
        status,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating friend request:', error);
      throw error;
    }
  },

  async getFriends(userId: string) {
    try {
      const q1 = query(
        collection(db, 'friends'),
        where('sender_id', '==', userId),
        where('status', '==', 'accepted')
      );
      const q2 = query(
        collection(db, 'friends'),
        where('receiver_id', '==', userId),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const friends = [
        ...snapshot1.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        })),
        ...snapshot2.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() || new Date(),
          updated_at: doc.data().updated_at?.toDate() || new Date()
        }))
      ] as Friend[];

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  },

  // Notifications
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        created_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getNotifications(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        deleted_at: doc.data().deleted_at?.toDate()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { deleted_at: serverTimestamp() });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Stories
  async createStory(story: Omit<Story, 'id' | 'created_at' | 'expires_at'>) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire after 24 hours

      const docRef = await addDoc(collection(db, 'stories'), {
        ...story,
        created_at: serverTimestamp(),
        expires_at: Timestamp.fromDate(expiresAt)
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  async getStories() {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'stories'),
        where('expires_at', '>', Timestamp.fromDate(now)),
        orderBy('expires_at'),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        expires_at: doc.data().expires_at?.toDate() || new Date()
      })) as Story[];
    } catch (error) {
      console.error('Error getting stories:', error);
      throw error;
    }
  },

  // Real-time listeners
  onPostsSnapshot(callback: (posts: Post[]) => void) {
    const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        updated_at: doc.data().updated_at?.toDate() || new Date()
      })) as Post[];
      callback(posts);
    });
  },

  onMessagesSnapshot(userId1: string, userId2: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('sender_id', 'in', [userId1, userId2]),
      where('receiver_id', 'in', [userId1, userId2]),
      orderBy('created_at', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      })) as Message[];
      callback(messages);
    });
  },

  onNotificationsSnapshot(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('deleted_at', '==', null),
      orderBy('created_at', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date(),
        deleted_at: doc.data().deleted_at?.toDate()
      })) as Notification[];
      callback(notifications);
    });
  }
};