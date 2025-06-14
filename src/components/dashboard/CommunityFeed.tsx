import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Send, MoreVertical, Edit, Trash2, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { auth, db } from '@/config/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ImageViewer } from '@/components/ui/image-viewer';
import { UserProfileDialog } from '@/components/user/UserProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from 'react-router-dom';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: any;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar: string | null;
  likes: { id: string; user_id: string }[];
  comments: {
    id: string;
    content: string;
    created_at: any;
    user_id: string;
    user_name: string;
    user_avatar: string | null;
  }[];
  _count?: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: any;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
}

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [submittingComments, setSubmittingComments] = useState<{ [key: string]: boolean }>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [likingPosts, setLikingPosts] = useState<{ [key: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [showCommentBox, setShowCommentBox] = useState<{ [key: string]: boolean }>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { toast } = useToast();

  const isHomePage = location.pathname === '/dashboard';

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleCommentBox = (postId: string) => {
    setShowCommentBox(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    
    // Auto-expand comments when showing comment box
    if (!showCommentBox[postId]) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: true
      }));
    }
  };

  const handleUserClick = async (userId: string, username: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUser({
          id: userId,
          name: userData.name,
          username: userData.username,
          avatar: userData.avatar,
          created_at: userData.created_at
        });
        setShowUserDialog(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load user profile'
      });
    }
  };

  // Fetch posts from Firebase
  const fetchPosts = useCallback(async () => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('created_at', 'desc')
      );

      const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
        const postsData: Post[] = [];

        for (const docSnap of snapshot.docs) {
          const postData = docSnap.data();
          
          // Get user data
          const userRef = doc(db, 'users', postData.user_id);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? userDoc.data() : {};

          // For now, set empty likes and comments since we don't have those collections set up yet
          const likes: any[] = [];
          const comments: any[] = [];

          postsData.push({
            id: docSnap.id,
            content: postData.content,
            image_url: postData.image_url || null,
            created_at: postData.created_at,
            user_id: postData.user_id,
            user_name: userData.name || 'Unknown',
            user_username: userData.username || 'unknown',
            user_avatar: userData.avatar || null,
            likes,
            comments,
            _count: {
              likes: likes.length,
              comments: comments.length
            }
          });
        }

        setPosts(postsData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load posts'
      });
      setLoading(false);
    }
  }, [toast]);

  const getCurrentUser = useCallback(async () => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleLike = async (postId: string) => {
    if (!currentUser || likingPosts[postId]) return;

    try {
      setLikingPosts(prev => ({ ...prev, [postId]: true }));

      // For now, just show a toast since we don't have likes collection set up yet
      toast({
        title: 'Like feature coming soon!',
        description: 'This feature will be available in the next update.',
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update like'
      });
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content || !currentUser || submittingComments[postId]) return;

    try {
      setSubmittingComments(prev => ({ ...prev, [postId]: true }));

      // For now, just show a toast since we don't have comments collection set up yet
      toast({
        title: 'Comment feature coming soon!',
        description: 'This feature will be available in the next update.',
      });

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add comment'
      });
    } finally {
      setSubmittingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: editContent.trim(),
        updated_at: new Date()
      });

      setEditingPost(null);
      setEditContent('');

      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update post'
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setDeletePostId(null);

      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete post'
      });
    }
  };

  const scrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScroll = useCallback(() => {
    if (feedRef.current) {
      const { scrollTop } = feedRef.current;
      setShowScrollTop(scrollTop > 300);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
    const unsubscribe = fetchPosts();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [getCurrentUser, fetchPosts]);

  useEffect(() => {
    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener('scroll', handleScroll);
      return () => feedElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded mb-2" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-muted rounded mb-2" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div ref={feedRef} className="space-y-4 relative scroll-container">
      {/* Scroll to Top Button - Only show on home page */}
      {isHomePage && showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full bg-social-green hover:bg-social-light-green text-white shadow-lg hover:scale-110 transition-all duration-200 pixel-border pixel-shadow"
          style={{ 
            fontSize: '8px',
            fontFamily: 'Press Start 2P, cursive'
          }}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-pixelated text-sm font-medium mb-2">No posts yet</h3>
            <p className="font-pixelated text-xs text-muted-foreground">
              Be the first to share something with the community!
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => {
          const isLiked = post.likes.some(like => like.user_id === currentUser?.uid);
          const isOwner = post.user_id === currentUser?.uid;
          const hasComments = post.comments && post.comments.length > 0;
          const commentsExpanded = expandedComments[post.id];
          const commentBoxVisible = showCommentBox[post.id];

          return (
            <Card key={post.id} className="card-gradient animate-fade-in shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      className="h-10 w-10 border-2 border-social-green/20 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleUserClick(post.user_id, post.user_username)}
                    >
                      {post.user_avatar ? (
                        <AvatarImage src={post.user_avatar} alt={post.user_name} />
                      ) : (
                        <AvatarFallback className="bg-social-dark-green text-white font-pixelated text-xs">
                          {post.user_name?.substring(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p 
                        className="font-pixelated text-xs font-medium cursor-pointer hover:text-social-green transition-colors"
                        onClick={() => handleUserClick(post.user_id, post.user_username)}
                      >
                        {post.user_name}
                      </p>
                      <p 
                        className="font-pixelated text-xs text-muted-foreground cursor-pointer hover:text-social-green transition-colors"
                        onClick={() => handleUserClick(post.user_id, post.user_username)}
                      >
                        @{post.user_username} • {formatDistanceToNow(post.created_at?.toDate?.() || new Date(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingPost(post.id);
                            setEditContent(post.content);
                          }}
                          className="font-pixelated text-xs"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletePostId(post.id)}
                          className="font-pixelated text-xs text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="font-pixelated text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditPost(post.id)}
                        size="sm"
                        className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingPost(null);
                          setEditContent('');
                        }}
                        size="sm"
                        variant="outline"
                        className="font-pixelated text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-pixelated text-xs mb-4 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                    
                    {post.image_url && (
                      <div className="mb-4">
                        <img
                          src={post.image_url}
                          alt="Post image"
                          className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(post.image_url)}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        disabled={likingPosts[post.id]}
                        className={`font-pixelated text-xs hover:bg-social-magenta/10 transition-all duration-200 hover-scale ${
                          isLiked ? 'text-social-magenta' : 'text-muted-foreground'
                        }`}
                      >
                        <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                        {post._count?.likes || 0}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCommentBox(post.id)}
                        className="font-pixelated text-xs text-muted-foreground hover:bg-social-blue/10 transition-all duration-200 hover-scale"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post._count?.comments || 0}
                      </Button>

                      {hasComments && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="font-pixelated text-xs text-muted-foreground hover:bg-social-purple/10 transition-all duration-200 hover-scale"
                        >
                          {commentsExpanded ? 
                            <ChevronUp className="h-4 w-4 mr-1" /> : 
                            <ChevronDown className="h-4 w-4 mr-1" />
                          }
                          {commentsExpanded ? 'Hide' : 'Show'} Comments
                        </Button>
                      )}
                    </div>
                    
                    {/* Add Comment - Hidden by default, show when comment button is clicked */}
                    {commentBoxVisible && (
                      <div className="mt-4 flex gap-2 animate-fade-in">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleComment(post.id);
                            }
                          }}
                          className="flex-1 min-h-[60px] max-h-[120px] font-pixelated text-xs resize-none"
                          disabled={submittingComments[post.id]}
                        />
                        <Button
                          onClick={() => handleComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim() || submittingComments[post.id]}
                          size="sm"
                          className="bg-social-green hover:bg-social-light-green text-white font-pixelated text-xs self-end hover:scale-105 transition-transform"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          src={selectedImage}
          alt="Post image"
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* User Profile Dialog */}
      <UserProfileDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        user={selectedUser}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-pixelated">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="font-pixelated text-xs">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-pixelated text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostId && handleDeletePost(deletePostId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-pixelated text-xs"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}