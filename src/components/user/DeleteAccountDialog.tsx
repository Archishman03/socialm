import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { auth, db } from '@/config/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountDeleted: () => void;
}

export function DeleteAccountDialog({ open, onOpenChange, onAccountDeleted }: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE') return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user found');
      }

      const batch = writeBatch(db);

      // Delete user's posts
      const postsQuery = query(collection(db, 'posts'), where('user_id', '==', user.uid));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's comments
      const commentsQuery = query(collection(db, 'comments'), where('user_id', '==', user.uid));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's likes
      const likesQuery = query(collection(db, 'likes'), where('user_id', '==', user.uid));
      const likesSnapshot = await getDocs(likesQuery);
      likesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's friend connections
      const friendsQuery1 = query(collection(db, 'friends'), where('sender_id', '==', user.uid));
      const friendsSnapshot1 = await getDocs(friendsQuery1);
      friendsSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const friendsQuery2 = query(collection(db, 'friends'), where('receiver_id', '==', user.uid));
      const friendsSnapshot2 = await getDocs(friendsQuery2);
      friendsSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's messages
      const messagesQuery1 = query(collection(db, 'messages'), where('sender_id', '==', user.uid));
      const messagesSnapshot1 = await getDocs(messagesQuery1);
      messagesSnapshot1.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const messagesQuery2 = query(collection(db, 'messages'), where('receiver_id', '==', user.uid));
      const messagesSnapshot2 = await getDocs(messagesQuery2);
      messagesSnapshot2.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's notifications
      const notificationsQuery = query(collection(db, 'notifications'), where('user_id', '==', user.uid));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      notificationsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's stories
      const storiesQuery = query(collection(db, 'stories'), where('user_id', '==', user.uid));
      const storiesSnapshot = await getDocs(storiesQuery);
      storiesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's profile
      const userRef = doc(db, 'users', user.uid);
      batch.delete(userRef);

      // Commit all deletions
      await batch.commit();

      // Finally, delete the user's auth account
      await deleteUser(user);

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      onAccountDeleted();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
      });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            <p className="text-sm font-medium">Warning: This action cannot be undone</p>
            <ul className="mt-2 text-sm space-y-1">
              <li>• All your posts will be deleted</li>
              <li>• All your messages will be deleted</li>
              <li>• All your friend connections will be removed</li>
              <li>• Your profile will be permanently deleted</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Type DELETE to confirm</Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={confirmation !== 'DELETE' || loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}