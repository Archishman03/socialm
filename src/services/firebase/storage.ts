import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

// Upload avatar image
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatars/${userId}-${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Upload post image
export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `posts/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading post image:', error);
    throw error;
  }
};

// Upload story photo
export const uploadStoryPhoto = async (file: File, userId: string): Promise<string> => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `stories/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading story photo:', error);
    throw error;
  }
};

// Delete file from storage
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (files: File[], userId: string, folder: string): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${folder}/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    });
    
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

// Story-specific functions
export const addPhotosToStory = async (userId: string, photoUrls: string[], metadata: any[]): Promise<void> => {
  // This would be implemented with Firestore operations
  // For now, it's a placeholder that matches the interface
  console.log('Adding photos to story:', { userId, photoUrls, metadata });
};

export const deleteStoryPhotos = async (storyId: string, photoIndices: number[]): Promise<void> => {
  // This would be implemented with Firestore operations
  // For now, it's a placeholder that matches the interface
  console.log('Deleting story photos:', { storyId, photoIndices });
};