
import React, { useState, useEffect, useCallback } from 'react';
import { Share, User } from '../types';
import { fetchPublicFeed, toggleLike, fetchUser } from '../services/shareService';
import { getValidIdToken } from '../services/authService';
import Spinner from './Spinner';
import { DefaultUserIcon } from './icons';

interface FeedViewProps {
  user: User | null;
  setViewState: (view: any) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ user, setViewState }) => {
    const [posts, setPosts] = useState<Share[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = useCallback(async () => {
        try {
            setLoading(true);
            const publicPosts = await fetchPublicFeed();
            
            const postsWithAuthors = await Promise.all(
                publicPosts.map(async (post) => {
                    if (post.authorId) {
                        try {
                            const authorDetails = await fetchUser(post.authorId);
                            return { ...post, author: authorDetails };
                        } catch (authorError) {
                            console.error(`Failed to fetch author for post ${post.id}`, authorError);
                            return { ...post, author: undefined }; 
                        }
                    }
                    return post;
                })
            );

            setPosts(postsWithAuthors);
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

    const handleLikeToggle = async (postToToggle: Share) => {
        if (!user) {
            alert('Please sign in to like posts.');
            return;
        }

        try {
            const idToken = await getValidIdToken();
            if (!idToken) {
                alert('Your session has expired. Please sign in again.');
                return;
            }

            const updatedPost = await toggleLike(postToToggle.id, idToken);

            setPosts(posts.map(p => p.id === postToToggle.id ? { ...p, likes: updatedPost.likes, likeCount: updatedPost.likeCount } : p));

        } catch (err: any) {
            console.error("Failed to toggle like:", err);
            alert(`Error: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 mt-10">{error}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
            {posts.length > 0 ? (
                <div className="space-y-8">
                    {posts.map(post => (
                        <div key={post.id} className="bg-base-200 dark:bg-dark-base-200 rounded-xl shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                            <div 
                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-base-300 dark:hover:bg-dark-base-300 transition-colors duration-200"
                                onClick={() => post.author && setViewState({ view: 'profile', user: post.author })}
                            >
                                {post.author ? (
                                    post.author.photoURL ? (
                                        <img src={post.author.photoURL} alt={post.author.displayName} className="h-12 w-12 rounded-full object-cover" />
                                    ) : (
                                        <DefaultUserIcon className="h-12 w-12 text-content-200 dark:text-dark-content-200" />
                                    )
                                ) : (
                                    <DefaultUserIcon className="h-12 w-12 text-content-200 dark:text-dark-content-200" />
                                )}
                                <span className="font-bold text-lg text-content-100 dark:text-dark-content-100">
                                    {post.author?.displayName || 'Anonymous'}
                                </span>
                            </div>

                            <div className="relative aspect-square w-full bg-base-300 dark:bg-dark-base-300">
                                <img src={post.imageUrl} alt={post.prompt || 'User-generated content'} className="w-full h-full object-contain" />
                            </div>
                            
                            <div className="p-5">
                                
                                <div className="flex items-center justify-between text-content-300 dark:text-dark-content-300">
                                    <button 
                                        onClick={() => handleLikeToggle(post)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 group ${user && post.likes?.includes(user.uid) 
                                            ? 'bg-brand-primary text-white' 
                                            : 'bg-base-300 dark:bg-dark-base-300 hover:bg-base-100 dark:hover:bg-dark-base-100'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all duration-200 ${user && post.likes?.includes(user.uid) ? 'fill-current' : 'fill-transparent stroke-current'}`} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                        </svg>
                                        <span>{user && post.likes?.includes(user.uid) ? 'Liked' : 'Like'}</span>
                                    </button>
                                    <span className="font-medium text-sm tabular-nums">
                                        {post.likeCount || 0} {post.likeCount === 1 ? 'Like' : 'Likes'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-base-200 dark:bg-dark-base-200 rounded-lg shadow-inner">
                    <h2 className="text-2xl font-semibold mb-2 text-content-100 dark:text-dark-content-100">It&apos;s quiet in here...</h2>
                    <p className="text-content-200 dark:text-dark-content-200">Be the first to share something!</p>
                </div>
            )}
        </div>
    );
}

export default FeedView;
