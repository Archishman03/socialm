import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '@/config/firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, where, getDocs } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StoryViewer } from './StoryViewer';
import { AddStoryDialog } from './AddStoryDialog';
import { ProfilePictureViewer } from './ProfilePictureViewer';

interface Story {
  id: string;
  user_id: string;
  image_url: string | null;
  photo_urls: string[] | null;
  photo_metadata: any[] | null;
  created_at: string;
  expires_at: string;
  views_count: number;
  profiles: {
    name: string;
    username: string;
    avatar: string | null;
  };
}

const StoriesContainer = React.memo(() => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState<{
    show: boolean;
    user: any;
    showConfirm: boolean;
  }>({ show: false, user: null, showConfirm: false });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStories = useCallback(async () => {
    try {
      // For now, just set empty stories since we don't have the stories collection set up yet
      setStories([]);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load stories',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCurrentUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            id: currentUser.uid,
            name: userData.name || currentUser.displayName || 'User',
            username: userData.username || 'user',
            avatar: userData.avatar || currentUser.photoURL || null
          });
        } else {
          setCurrentUser({
            id: currentUser.uid,
            name: currentUser.displayName || 'User',
            username: 'user',
            avatar: currentUser.photoURL || null
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setCurrentUser({
          id: currentUser.uid,
          name: currentUser.displayName || 'User',
          username: 'user',
          avatar: currentUser.photoURL || null
        });
      }
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
    fetchStories();
  }, [getCurrentUser, fetchStories]);

  const handleStoryClick = useCallback(async (story: Story) => {
    setSelectedStory(story);
    
    // Mark story as viewed - implement when stories collection is ready
    console.log('Story viewed:', story.id);
  }, []);

  const userStory = useMemo(() => {
    return stories.find(story => story.user_id === currentUser?.id);
  }, [stories, currentUser?.id]);

  const otherStories = useMemo(() => {
    return stories.filter(story => story.user_id !== currentUser?.id);
  }, [stories, currentUser?.id]);

  const handleAddStory = useCallback(() => {
    setShowAddDialog(true);
  }, []);

  const handleStoryAdded = useCallback(() => {
    fetchStories();
  }, [fetchStories]);

  if (loading) {
    return (
      <div className="flex gap-2 p-3 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="w-8 h-2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 p-3 overflow-x-auto bg-background border-b">
        {/* Add Story Button */}
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          <div className="relative">
            <Avatar className={`w-12 h-12 border-2 cursor-pointer transition-all duration-200 ${
              userStory 
                ? 'border-social-green hover:border-social-light-green hover:scale-105' 
                : 'border-dashed border-social-green hover:border-social-light-green hover:scale-105'
            }`}>
              {currentUser?.avatar ? (
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              ) : (
                <AvatarFallback className="bg-social-dark-green text-white font-pixelated text-xs">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <Button
              size="icon"
              onClick={handleAddStory}
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-social-green hover:bg-social-light-green text-white transition-all duration-200 hover:scale-110"
            >
              <Plus className="h-2 w-2" />
            </Button>
          </div>
          <span className="text-xs font-pixelated text-center">
            {userStory ? 'Your Story' : 'Add Story'}
          </span>
        </div>

        {/* User's own story (if exists) */}
        {userStory && (
          <div
            className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group"
            onClick={() => handleStoryClick(userStory)}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-social-green hover:border-social-light-green transition-all duration-200 group-hover:scale-105">
                {userStory.profiles.avatar ? (
                  <AvatarImage src={userStory.profiles.avatar} alt={userStory.profiles.name} />
                ) : (
                  <AvatarFallback className="bg-social-dark-green text-white font-pixelated text-xs">
                    {userStory.profiles.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-social-green to-social-blue opacity-20" />
            </div>
            <span className="text-xs font-pixelated text-center truncate max-w-[60px]">
              You
            </span>
          </div>
        )}

        {/* Other Stories */}
        {otherStories.map((story) => (
          <div
            key={story.id}
            className="flex flex-col items-center gap-1 min-w-[60px] cursor-pointer group"
            onClick={() => handleStoryClick(story)}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-social-green hover:border-social-light-green transition-all duration-200 group-hover:scale-105">
                {story.profiles.avatar ? (
                  <AvatarImage src={story.profiles.avatar} alt={story.profiles.name} />
                ) : (
                  <AvatarFallback className="bg-social-dark-green text-white font-pixelated text-xs">
                    {story.profiles.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-social-green to-social-blue opacity-20" />
            </div>
            <span className="text-xs font-pixelated text-center truncate max-w-[60px]">
              {story.profiles.name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
          currentUserId={currentUser?.id}
          onStoryUpdated={handleStoryAdded}
        />
      )}

      {/* Add Story Dialog */}
      <AddStoryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onStoryAdded={handleStoryAdded}
        currentUser={currentUser}
        existingStory={userStory}
      />

      {/* Profile Picture Viewer */}
      <ProfilePictureViewer
        show={showProfilePicture.show}
        showConfirm={showProfilePicture.showConfirm}
        user={showProfilePicture.user}
        onConfirm={() => setShowProfilePicture(prev => ({ 
          show: true, 
          user: prev.user, 
          showConfirm: false 
        }))}
        onClose={() => setShowProfilePicture({ show: false, user: null, showConfirm: false })}
      />
    </>
  );
});

StoriesContainer.displayName = 'StoriesContainer';

export { StoriesContainer };