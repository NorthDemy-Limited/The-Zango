"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, Send, CheckCircle2 } from "lucide-react";
import { Comment } from "@/types";

interface ArticleCommentsProps {
  articleSlug: string;
}

export default function ArticleComments({ articleSlug }: ArticleCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedToast, setSubmittedToast] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(articleSlug)}`);
      const data = await res.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.warn("Could not fetch comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          authorName: authorName.trim(),
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        setSubmittedToast(true);
        setTimeout(() => setSubmittedToast(false), 4000);
      }
    } catch (err) {
      console.error("Comment submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );
  };

  return (
    <section className="mt-14 pt-10 border-t border-[#E5E6E8]">
      
      {/* Comments Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-5 bg-[#C61D1F] rounded-xs inline-block" />
          <h3 className="text-xl font-extrabold text-[#000000] uppercase tracking-wide flex items-center space-x-2">
            <span>Reader Perspectives</span>
            <span className="text-sm font-bold text-[#C61D1F] bg-[#FDF2F2] px-2.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          </h3>
        </div>
      </div>

      {/* Post a Comment Form */}
      <div className="bg-[#FAFAFA] border border-[#E5E6E8] rounded-2xl p-6 sm:p-8 mb-10 shadow-2xs">
        <h4 className="text-sm font-bold text-[#000000] uppercase tracking-wider mb-4">
          Join the Discussion
        </h4>

        {submittedToast && (
          <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>Thank you for contributing! Your perspective is now live.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#535252] uppercase mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Usman Bello"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full sm:w-80 px-3.5 py-2.5 text-xs rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-[#111111] focus:outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#535252] uppercase mb-1">
              Your Commentary / Perspective *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Share constructive insights or local context relating to this story..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-[#DFDFDF] focus:border-[#C61D1F] text-[#111111] focus:outline-hidden bg-white resize-y leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#C61D1F] hover:bg-[#A51719] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? "Posting..." : "Post Perspective"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E6E8] shadow-2xs hover:border-[#DFDFDF] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs">
                    {comment.authorName.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-[#000000]">
                    {comment.authorName}
                  </span>
                </div>
                <span className="text-[11px] text-[#9C9C9C]">
                  {comment.createdAt}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#535252] leading-relaxed mb-3 pl-10.5">
                {comment.content}
              </p>

              <div className="pl-10.5 flex items-center space-x-4">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#707070] hover:text-[#C61D1F] transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{comment.likes || 0} Helpful</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#FAFAFA] rounded-2xl border border-[#E5E6E8]">
          <MessageSquare className="w-8 h-8 text-[#9C9C9C] mx-auto mb-2" />
          <p className="text-xs text-[#707070]">
            Be the first to share your thoughts on this story.
          </p>
        </div>
      )}

    </section>
  );
}
