'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageSquare,
  ExternalLink,
  Github,
  Video,
  FileText,
  Trophy,
  Award,
  ShieldCheck,
  Send,
  Trash2,
  Edit2,
  AlertCircle,
  EyeOff,
  Eye,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Users,
  Code2,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';

interface ProjectDetail {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  description: string;
  repoUrl: string;
  demoUrl?: string | null;
  videoUrl?: string | null;
  documentationUrl?: string | null;
  techStack: string[];
  hackathon: {
    id: string;
    title: string;
    slug: string;
    status: string;
    isVotingEnabled: boolean;
  };
  track: { id: string; title: string; colorHex?: string };
  problemStatement: { id: string; code: string; title: string };
  team: {
    id: string;
    name: string;
    members: { user: { id: string; fullName: string; avatarUrl?: string | null } }[];
  };
  communityVotesCount: number;
  commentsCount: number;
  hasVoted: boolean;
  officialResult?: {
    rank: number;
    finalScore: number;
    awardCategory?: string | null;
    isWinner: boolean;
  } | null;
}

interface CommentItem {
  id: string;
  content: string;
  isFlagged: boolean;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export default function PublicProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const projectId = params.id;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadProjectAndComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projRes = await fetch(`/api/v1/projects/${projectId}`);
      const projJson = await projRes.json();
      if (!projRes.ok) {
        throw new Error(projJson.error?.message || 'Project not found');
      }
      setProject(projJson.data?.project || null);

      // Fetch comments
      const commRes = await fetch(`/api/v1/projects/${projectId}/comments`);
      const commJson = await commRes.json();
      if (commRes.ok) {
        setComments(commJson.data?.comments || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndComments();
  }, [projectId]);

  const handleVoteToggle = async () => {
    if (!project) return;
    try {
      setVoting(true);
      const method = project.hasVoted ? 'DELETE' : 'POST';
      const res = await fetch(`/api/v1/projects/${projectId}/vote`, { method });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error?.message || 'Voting action failed. Please sign in.');
        return;
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              hasVoted: json.data.hasVoted,
              communityVotesCount: json.data.totalVotes,
            }
          : null
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      setPostingComment(true);
      const res = await fetch(`/api/v1/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput }),
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error?.message || 'Failed to post comment. Please sign in.');
        return;
      }

      setComments((prev) => [json.data.comment, ...prev]);
      setCommentInput('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPostingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error?.message || 'Failed to update comment.');
        return;
      }

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: json.data.comment.content } : c))
      );
      setEditingCommentId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/v1/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        const json = await res.json();
        alert(json.error?.message || 'Failed to delete comment.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleModerateComment = async (commentId: string, action: 'HIDE' | 'RESTORE') => {
    try {
      const res = await fetch(`/api/v1/comments/${commentId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isFlagged: action === 'HIDE' } : c))
        );
      } else {
        alert(json.error?.message || 'Moderation action failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <AppShell userRole="PARTICIPANT">
        <div className="py-24 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
          <p className="text-xs text-[#64748B] font-medium">Loading project profile & portfolio...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell userRole="PARTICIPANT">
        <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white border border-[#E2E8F0] rounded-[18px] p-8 shadow-card">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto" />
          <h2 className="text-xl font-bold text-[#111827]">Project Not Available</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {error || 'This project submission is private or has been unlisted.'}
          </p>
          <div className="pt-2">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] text-white rounded-[11px] text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Project Showcase
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userRole="PARTICIPANT">
      <div className="space-y-6">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2 text-xs">
            <Link
              href="/projects"
              className="inline-flex items-center font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Project Showcase
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <Link
              href={`/hackathons/${project.hackathon.slug}`}
              className="text-[#64748B] hover:text-[#2563EB] font-medium truncate max-w-[200px]"
            >
              {project.hackathon.title}
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-semibold text-[#111827] truncate max-w-[180px]">
              {project.title}
            </span>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#475569] hover:text-[#111827] shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
              {copiedLink ? 'Link Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Project Hero Header Card (Unstop Developer Portfolio) */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left Info Column */}
            <div className="flex items-start space-x-4 max-w-3xl">
              {/* Project Monogram Container (84x84) */}
              <div className="w-[84px] h-[84px] rounded-[16px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] font-black text-3xl shadow-xs flex-shrink-0">
                {project.title.charAt(0)}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue" size="sm">
                    {project.track?.title || 'Open Track'}
                  </Badge>

                  {project.problemStatement?.code && (
                    <Badge variant="neutral" size="sm">
                      Problem {project.problemStatement.code}
                    </Badge>
                  )}

                  {project.officialResult && (
                    <Badge variant="amber" size="sm">
                      <Trophy className="w-3 h-3 mr-1" />
                      Rank #{project.officialResult.rank} ({project.officialResult.finalScore.toFixed(1)} pts)
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight leading-tight">
                  {project.title}
                </h1>

                {project.tagline && (
                  <p className="text-sm font-medium text-[#475569] leading-relaxed">
                    {project.tagline}
                  </p>
                )}

                <div className="flex items-center text-xs text-[#64748B] pt-0.5 space-x-3">
                  <span>
                    Team: <strong className="text-[#111827]">{project.team.name}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Event: <strong className="text-[#111827]">{project.hackathon.title}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Column (Vote Button) */}
            <div className="flex flex-col items-start lg:items-end gap-2 flex-shrink-0">
              <button
                onClick={handleVoteToggle}
                disabled={voting}
                className={`px-5 py-2.5 rounded-[12px] font-bold text-xs shadow-xs transition-all flex items-center space-x-2.5 ${
                  project.hasVoted
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]'
                    : 'bg-[#111827] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    project.hasVoted ? 'fill-[#DC2626] text-[#DC2626]' : 'text-white'
                  }`}
                />
                <span>{project.hasVoted ? 'Voted' : 'Support with Vote'}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                  {project.communityVotesCount}
                </span>
              </button>
              <span className="text-[10px] text-[#94A3B8]">
                Community recognition • Independent from official jury scores
              </span>
            </div>
          </div>

          {/* Winner Award Banner if present */}
          {project.officialResult?.awardCategory && (
            <div className="bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-[#ECFDF5] border border-[#A7F3D0] rounded-[14px] p-4 flex items-center justify-between text-[#065F46] shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-[#047857]">
                    Official Hackathon Award
                  </div>
                  <div className="text-base font-extrabold text-[#065F46]">
                    {project.officialResult.awardCategory}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-sm text-[#065F46]">
                Score: {project.officialResult.finalScore.toFixed(1)} / 100
              </div>
            </div>
          )}

          {/* Action Links Bar */}
          <div className="flex flex-wrap gap-2.5 pt-4 border-t border-[#F1F5F9]">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[11px] text-xs font-semibold shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Live Working Demo
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#111827] border border-[#E2E8F0] rounded-[11px] text-xs font-semibold transition-colors"
              >
                <Github className="w-4 h-4 mr-2 text-[#334155]" /> Source Code Repository
              </a>
            )}
            {project.videoUrl && (
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-[11px] text-xs font-semibold transition-colors"
              >
                <Video className="w-4 h-4 mr-2 text-[#2563EB]" /> Video Walkthrough
              </a>
            )}
            {project.documentationUrl && (
              <a
                href={project.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] rounded-[11px] text-xs font-semibold transition-colors"
              >
                <FileText className="w-4 h-4 mr-2 text-[#64748B]" /> Technical Documentation
              </a>
            )}
          </div>
        </div>

        {/* Main Content Layout (2 Cols: Left Details + Right Metadata) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Architecture Description & Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Project Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 sm:p-8 shadow-card space-y-4">
              <div className="flex items-center space-x-2 border-b border-[#F1F5F9] pb-3">
                <Code2 className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-base font-bold text-[#111827]">
                  About the Solution & Technical Architecture
                </h2>
              </div>
              <div className="text-sm text-[#475569] leading-relaxed whitespace-pre-line font-normal">
                {project.description}
              </div>
            </div>

            {/* Problem Statement Details */}
            {project.problemStatement && (
              <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Target Challenge
                  </span>
                  <Badge variant="blue" size="sm">
                    {project.problemStatement.code}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-[#111827]">
                  {project.problemStatement.title}
                </h3>
              </div>
            )}

            {/* Community Comments Section */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 sm:p-8 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-[#2563EB]" />
                  <h2 className="text-base font-bold text-[#111827]">
                    Community Discussion ({comments.length})
                  </h2>
                </div>
                <span className="text-xs text-[#64748B]">Feedback & Questions</span>
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Share feedback, ask technical questions, or give kudos to the team..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] text-xs sm:text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postingComment || !commentInput.trim()}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[11px] text-xs font-semibold shadow-xs transition-colors flex items-center disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {postingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </form>

              {/* Comments Thread */}
              <div className="space-y-3 pt-2">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#94A3B8]">
                    No comments yet. Be the first to share your thoughts on this submission!
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-[14px] border transition-colors ${
                        c.isFlagged
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center border border-[#BFDBFE]">
                            {c.user.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-[#111827]">
                              {c.user.fullName}
                            </span>
                            <span className="text-[10px] text-[#94A3B8] ml-2">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {c.isFlagged && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                              Flagged
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditContent(c.content);
                            }}
                            className="text-[#94A3B8] hover:text-[#111827] transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleModerateComment(c.id, c.isFlagged ? 'RESTORE' : 'HIDE')}
                            className="text-[#94A3B8] hover:text-[#D97706] transition-colors"
                            title="Moderate"
                          >
                            {c.isFlagged ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={2}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-[10px] text-xs text-[#111827]"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 text-xs text-[#64748B] font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditComment(c.id)}
                              className="px-3 py-1 bg-[#2563EB] text-white rounded-[8px] text-xs font-semibold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#334155] mt-2 leading-relaxed whitespace-pre-line">
                          {c.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: Tech Stack, Team, and Event Metadata */}
          <div className="space-y-6">
            {/* Tech Stack Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Technologies & Tools
              </h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(project.techStack || []).map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-[8px] text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Team Members
                </h3>
                <span className="text-xs font-semibold text-[#2563EB]">
                  {project.team.members.length} member(s)
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {project.team.members.map((m, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-xs p-2 rounded-[10px] hover:bg-[#F8FAFC]">
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {m.user.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-[#111827] truncate">{m.user.fullName}</div>
                      <div className="text-[10px] text-[#64748B]">Contributor</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Summary Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Hackathon Arena
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Event Name</span>
                  <Link
                    href={`/hackathons/${project.hackathon.slug}`}
                    className="font-semibold text-[#111827] hover:text-[#2563EB] transition-colors"
                  >
                    {project.hackathon.title}
                  </Link>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Assigned Track</span>
                  <span className="font-medium text-[#334155]">{project.track?.title}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Event Status</span>
                  <Badge variant="blue" size="sm">
                    {project.hackathon.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Verified Submission Card */}
            <div className="bg-gradient-to-br from-[#111827] to-[#1E293B] text-white rounded-[18px] p-5 space-y-2 shadow-card">
              <div className="flex items-center space-x-1.5 text-[11px] text-[#38BDF8] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
                <span>Verified Platform Entry</span>
              </div>
              <h4 className="text-xs font-bold">Tamper-Proof Codebase Integrity</h4>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Repository snapshots and demo artifacts are timestamped and cryptographically logged for jury review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
