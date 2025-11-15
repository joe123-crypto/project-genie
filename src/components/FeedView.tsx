
import React, { useState, useEffect, useCallback } from 'react';
import { Share, User } from '../types';
import { fetchPublicFeed, toggleLike } from '../services/feedService';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { Spinner } from './Spinner';
import PostView from './PostView';

interface FeedViewProps {
  user: User | null;
  onCreateYourOwn: (filterId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ user, onCreateYourOwn }) => {
  const [posts, setPosts] = useState<Share[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Share | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const publicPosts = await fetchPublicFeed();
      setPosts(publicPosts);
    } catch (err: any) {
      setError(`Failed to load feed: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLikeToggle = async (e: React.MouseEvent, postToToggle: Share) => {
    e.stopPropagation();
    if (!user) {
      alert('Please sign in to like posts.');
      return;
    }

    try {
      const updatedPost = await toggleLike(postToToggle.id);
      setPosts(posts.map(p => p.id === postToToggle.id ? { ...p, likes: updatedPost.likes, likeCount: updatedPost.likeCount } : p));
    } catch (err) {
      console.error("Failed to toggle like:", err);
      alert("There was an issue liking the post. Please try again.");
    }
  };
  
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
    setSelectedPost(null);
  };

  const handlePostClick = (post: Share) => {
    setSelectedPost(post);
  };

  const handleClosePostView = () => {
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10">{error}</p>;
  }

  return (
    <>
        {selectedPost && (
            <PostView
            selectedImage={selectedPost}
            onClose={handleClosePostView}
            isOwner={user?.uid === selectedPost.author?.uid}
            onDelete={handleDeletePost}
            onCreateYourOwn={onCreateYourOwn}
            />
        )}
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
        {posts.length === 0 ? (
            <p className="text-content-200 dark:text-dark-content-200 text-center">No posts to show yet.</p>
        ) : (
            posts.map((post) => (
            <div key={post.id} onClick={() => handlePostClick(post)} className="bg-base-100 dark:bg-dark-base-100 shadow-lg rounded-lg overflow-hidden cursor-pointer">
                <div className="p-4 flex items-center gap-3">
                <img 
                    src={post.author?.photoURL || '/default-avatar.256x256.png'} 
                    alt={post.author?.displayName || 'Unknown user'}
                    className="w-10 h-10 rounded-full"
                />
                <span className="font-semibold text-content-100 dark:text-dark-content-100">{post.author?.displayName || 'Anonymous'}</span>
                </div>
                <img src={post.imageUrl} alt="Shared content" className="w-full" />
                <div className="p-4">
                <div className="flex items-center gap-4">
                    <button onClick={(e) => handleLikeToggle(e, post)} className="flex items-center gap-1.5 group">
                    {user && post.likes?.includes(user.uid) ? (
                        <HeartIconSolid className="w-6 h-6 text-red-500 transition-transform group-hover:scale-110" />
                    ) : (
                        <HeartIconOutline className="w-6 h-6 text-content-200 dark:text-dark-content-200 group-hover:text-red-500 transition-colors" />
                    )}
                    </button>
                    <span className="text-content-200 dark:text-dark-content-200 font-medium">{post.likeCount ?? 0}</span>
                </div>
                <p className="text-content-200 dark:text-dark-content-200 mt-2">
                    <span className="font-semibold text-content-100 dark:text-dark-content-100">{post.author?.displayName || 'Anonymous'}</span>
                    <span className="ml-2">{post.filterName}</span>
                </p>
                </div>
            </div>
            ))
        )}
        </div>
    </>
  );
};

export default FeedView;
