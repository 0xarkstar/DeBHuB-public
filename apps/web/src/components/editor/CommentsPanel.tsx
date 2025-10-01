'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MessageSquare, Send, Check, Trash2, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_DOCUMENT_COMMENTS } from '@/lib/graphql/queries';
import { CREATE_COMMENT, RESOLVE_COMMENT, DELETE_COMMENT } from '@/lib/graphql/mutations';
import { cn } from '@/lib/utils';

interface CommentsPanelProps {
  documentId: string;
}

export function CommentsPanel({ documentId }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('');

  const { data, loading, refetch } = useQuery(GET_DOCUMENT_COMMENTS, {
    variables: { documentId },
  });

  const [createComment, { loading: creating }] = useMutation(CREATE_COMMENT);
  const [resolveComment, { loading: resolving }] = useMutation(RESOLVE_COMMENT);
  const [deleteComment] = useMutation(DELETE_COMMENT);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment({
        variables: {
          input: {
            documentId,
            content: newComment.trim(),
          },
        },
      });
      setNewComment('');
      refetch();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await resolveComment({
        variables: { id: commentId },
      });
      refetch();
    } catch (error) {
      console.error('Failed to resolve comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment({
        variables: { id: commentId },
      });
      refetch();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const comments = data?.document?.comments || [];
  const unresolvedComments = comments.filter((c: any) => !c.resolved);
  const resolvedComments = comments.filter((c: any) => c.resolved);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, resolved = false }: { comment: any; resolved?: boolean }) => (
    <div
      className={cn(
        'p-4 rounded-lg border',
        resolved ? 'bg-gray-50 border-gray-200' : 'bg-background'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-full">
            <User className="h-3 w-3 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {comment.author.address.slice(0, 6)}...{comment.author.address.slice(-4)}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!resolved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResolve(comment.id)}
              disabled={resolving}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(comment.id)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>

      <p className="text-sm">{comment.content}</p>

      {resolved && comment.resolvedBy && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          <span>
            Resolved by {comment.resolvedBy.address.slice(0, 6)}...
            {comment.resolvedBy.address.slice(-4)}
          </span>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-6 space-y-2">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="p-2 bg-muted/50 rounded text-sm">
              <p className="font-medium text-xs mb-1">
                {reply.author.address.slice(0, 6)}...{reply.author.address.slice(-4)}
              </p>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </div>
          {unresolvedComments.length > 0 && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
              {unresolvedComments.length} unresolved
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* New Comment Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="mb-2"
            rows={3}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || creating}
          >
            <Send className="h-4 w-4 mr-2" />
            {creating ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        {/* Comments List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1 overflow-auto">
            {unresolvedComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Unresolved
                </h3>
                {unresolvedComments.map((comment: any) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </div>
            )}

            {resolvedComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                  Resolved
                </h3>
                {resolvedComments.map((comment: any) => (
                  <CommentItem key={comment.id} comment={comment} resolved />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
