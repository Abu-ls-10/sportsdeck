"use client";

import { useEffect, useState } from "react";
import ReplyBox from "@/components/threads/ReplyBox";
import PostComposer from "@/components/threads/PostComposer";
import PollCard from "@/components/threads/PollCard";

export default function ThreadPage({ params }: { params: { id: string } }) {
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThread = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/threads/${params.id}/full`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        if (isMounted) {
          setThread(data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Failed to load thread");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadThread();

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!thread) return <div className="p-6">Not found</div>;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-2xl bg-bg-surface p-5">
          <h1 className="text-xl font-semibold text-white">
            {thread.title}
          </h1>
        </div>

        {/* POST COMPOSER */}
        <PostComposer
          threadId={thread.id}
          onPostCreated={(newPost) =>
            setThread((prev: any) => ({
              ...prev,
              posts: [newPost, ...prev.posts],
            }))
          }
        />

        {/* POLL */}
        {thread.poll && <PollCard poll={thread.poll} />}

        {/* POSTS */}
        {thread.posts.map((post: any) => (
          <div key={post.id} className="rounded-2xl bg-bg-card p-4">
            <p>{post.content}</p>

            {/* REPLY BOX */}
            <ReplyBox
              postId={post.id}
              onReplyCreated={(newReply: any) => {
                setThread((prev: any) => ({
                  ...prev,
                  posts: prev.posts.map((p: any) =>
                    p.id === post.id
                      ? {
                          ...p,
                          replies: [...p.replies, newReply],
                        }
                      : p
                  ),
                }));
              }}
            />

            {/* REPLIES */}
            {post.replies.map((r: any) => (
              <div key={r.id} className="ml-4 mt-2 text-sm text-text-secondary">
                {r.content}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}