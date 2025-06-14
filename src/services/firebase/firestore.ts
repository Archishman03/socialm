import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// User Profile Operations
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Posts Operations
export const createPost = async (postData: any) => {
  try {
    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPosts = async (userId?: string) => {
  try {
    let q;
    if (userId) {
      q = query(
        collection(db, 'posts'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
    } else {
      q = query(
        collection(db, 'posts'),
        orderBy('created_at', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

export const updatePost = async (postId: string, updates: any) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Comments Operations
export const createComment = async (commentData: any) => {
  try {
    const commentsRef = collection(db, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

export const getComments = async (postId: string) => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('post_id', '==', postId),
      orderBy('created_at', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

// Likes Operations
export const createLike = async (likeData: any) => {
  try {
    const likesRef = collection(db, 'likes');
    const docRef = await addDoc(likesRef, {
      ...likeData,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating like:', error);
    throw error;
  }
};

export const deleteLike = async (likeId: string) => {
  try {
    const likeRef = doc(db, 'likes', likeId);
    await deleteDoc(likeRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting like:', error);
    throw error;
  }
};

export const getLikes = async (postId: string) => {
  try {
    const q = query(
      collection(db, 'likes'),
      where('post_id', '==', postId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting likes:', error);
    throw error;
  }
};

// Friends Operations
export const sendFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    const friendsRef = collection(db, 'friends');
    const docRef = await addDoc(friendsRef, {
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
      created_at: serverTimestamp()
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (friendshipId: string) => {
  try {
    const friendRef = doc(db, 'friends', friendshipId);
    await updateDoc(friendRef, {
      status: 'accepted',
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

export const rejectFriendRequest = async (friendshipId: string) => {
  try {
    const friendRef = doc(db, 'friends', friendshipId);
    await deleteDoc(friendRef);
    return { success: true };
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'friends'),
      where('status', '==', 'accepted')
    );
    
    const querySnapshot = await getDocs(q);
    const friends = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(friend => 
        friend.sender_id === userId || friend.receiver_id === userId
      );
    
    return friends;
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
};

// Messages Operations
export const sendMessage = async (messageData: any) => {
  try {
    const messagesRef = collection(db, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      created_at: serverTimestamp(),
      read: false
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (userId1: string, userId2: string) => {
  try {
    const q = query(
      collection(db, 'messages'),
      orderBy('created_at', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(message => 
        (message.sender_id === userId1 && message.receiver_id === userId2) ||
        (message.sender_id === userId2 && message.receiver_id === userId1)
      );
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Notifications Operations
export const createNotification = async (notificationData: any) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      created_at: serverTimestamp(),
      read: false
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getNotifications = async (userId: string) => {
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
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Stories Operations
export const createStory = async (storyData: any) => {
  try {
    const storiesRef = collection(db, 'stories');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
    
    const docRef = await addDoc(storiesRef, {
      ...storyData,
      created_at: serverTimestamp(),
      expires_at: Timestamp.fromDate(expiresAt),
      views_count: 0
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
};

export const getStories = async () => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'stories'),
      where('expires_at', '>', Timestamp.fromDate(now)),
      orderBy('expires_at', 'desc'),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting stories:', error);
    throw error;
  }
};

export const incrementStoryViews = async (storyId: string) => {
  try {
    const storyRef = doc(db, 'stories', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (storyDoc.exists()) {
      const currentViews = storyDoc.data().views_count || 0;
      await updateDoc(storyRef, {
        views_count: currentViews + 1
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error incrementing story views:', error);
    throw error;
  }
};

// Real-time subscriptions
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void, constraints?: any[]) => {
  try {
    let q = collection(db, collectionName);
    
    if (constraints && constraints.length > 0) {
      q = query(q, ...constraints);
    }
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error(`Error subscribing to ${collectionName}:`, error);
    throw error;
  }
};

// Batch operations
export const batchWrite = async (operations: Array<{ type: 'create' | 'update' | 'delete', collection: string, id?: string, data?: any }>) => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(operation => {
      switch (operation.type) {
        case 'create':
          const createRef = doc(collection(db, operation.collection));
          batch.set(createRef, {
            ...operation.data,
            created_at: serverTimestamp()
          });
          break;
        case 'update':
          const updateRef = doc(db, operation.collection, operation.id!);
          batch.update(updateRef, {
            ...operation.data,
            updated_at: serverTimestamp()
          });
          break;
        case 'delete':
          const deleteRef = doc(db, operation.collection, operation.id!);
          batch.delete(deleteRef);
          break;
      }
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
};