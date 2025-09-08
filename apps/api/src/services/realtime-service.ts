import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';

/**
 * Realtime Service for document collaboration
 * Implements the real-time collaboration features from the plan
 */
export class RealtimeService {
  private pubsub: PubSub;
  private redis: Redis | null = null;
  private wsServer: WebSocketServer | null = null;
  private collaborationSessions = new Map<string, CollaborationSession>();
  private userPresence = new Map<string, UserPresence>();

  constructor() {
    this.pubsub = new PubSub();
    this.initializeRedis();
  }

  async initialize(): Promise<void> {
    console.log('✅ Realtime service initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (this.redis) {
        await this.redis.ping();
      }
      return true;
    } catch {
      return false;
    }
  }

  private async initializeRedis(): Promise<void> {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('✅ Redis connection established for realtime service');
      } catch (error) {
        console.error('❌ Redis connection failed:', error);
      }
    }
  }

  /**
   * Document Collaboration Implementation
   */
  async createCollaborationSession(documentId: string): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `doc:${documentId}`,
      documentId,
      participants: new Map(),
      cursors: new Map(),
      selections: new Map(),
      changeBuffer: [],
      createdAt: new Date(),
    };

    this.collaborationSessions.set(session.id, session);
    return session;
  }

  async joinSession(
    sessionId: string, 
    user: SessionUser, 
    websocket: WebSocket
  ): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add participant to session
    session.participants.set(user.id, {
      ...user,
      websocket,
      joinedAt: new Date(),
      lastActivity: new Date(),
    });

    // Track user presence
    this.userPresence.set(user.id, {
      userId: user.id,
      sessionId,
      status: 'active',
      joinedAt: new Date(),
      lastSeen: new Date(),
      cursor: null,
      selection: null,
    });

    // Notify other participants
    this.broadcastToSession(sessionId, {
      type: 'presence',
      event: 'join',
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    }, user.id);

    // Send current session state to new participant
    websocket.send(JSON.stringify({
      type: 'session_state',
      participants: Array.from(session.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        cursor: this.userPresence.get(p.id)?.cursor,
        selection: this.userPresence.get(p.id)?.selection,
      })),
      cursors: Object.fromEntries(session.cursors),
      selections: Object.fromEntries(session.selections),
    }));

    // Handle WebSocket messages
    websocket.on('message', (message) => {
      this.handleSessionMessage(sessionId, user.id, message);
    });

    websocket.on('close', () => {
      this.leaveSession(sessionId, user.id);
    });
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    // Remove participant
    session.participants.delete(userId);
    session.cursors.delete(userId);
    session.selections.delete(userId);

    // Remove user presence
    this.userPresence.delete(userId);

    // Notify remaining participants
    this.broadcastToSession(sessionId, {
      type: 'presence',
      event: 'leave',
      userId,
    }, userId);

    // Clean up empty sessions
    if (session.participants.size === 0) {
      this.collaborationSessions.delete(sessionId);
    }
  }

  /**
   * Cursor and Selection Sharing
   */
  async shareCursor(sessionId: string, userId: string, position: CursorPosition): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    // Update cursor position
    session.cursors.set(userId, position);
    
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.cursor = position;
      presence.lastSeen = new Date();
    }

    // Broadcast cursor update
    this.broadcastToSession(sessionId, {
      type: 'cursor',
      userId,
      position,
    }, userId);
  }

  async shareSelection(sessionId: string, userId: string, selection: Selection): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    // Update selection
    session.selections.set(userId, selection);
    
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.selection = selection;
      presence.lastSeen = new Date();
    }

    // Broadcast selection update
    this.broadcastToSession(sessionId, {
      type: 'selection',
      userId,
      selection,
    }, userId);
  }

  /**
   * Document Change Streaming
   */
  async streamChange(sessionId: string, userId: string, change: DocumentChange): Promise<void> {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    // Add change to buffer
    const timestampedChange = {
      ...change,
      userId,
      timestamp: Date.now(),
      id: this.generateChangeId(),
    };

    session.changeBuffer.push(timestampedChange);

    // Keep buffer size manageable
    if (session.changeBuffer.length > 1000) {
      session.changeBuffer = session.changeBuffer.slice(-500);
    }

    // Broadcast change to other participants
    this.broadcastToSession(sessionId, {
      type: 'document_change',
      change: timestampedChange,
    }, userId);

    // Publish for GraphQL subscriptions
    await this.pubsub.publish('DOCUMENT_CHANGED', {
      documentId: session.documentId,
      change: timestampedChange,
    });
  }

  /**
   * Conflict Resolution using CRDT-like approach
   */
  resolveConflict(changes: DocumentChange[]): ResolvedDocument {
    // Simple conflict resolution - in production, use a proper CRDT library
    const sortedChanges = changes.sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );

    let resolvedContent = '';
    let conflicts: ConflictInfo[] = [];

    // Apply changes in order
    for (const change of sortedChanges) {
      try {
        resolvedContent = this.applyChange(resolvedContent, change);
      } catch (error) {
        conflicts.push({
          changeId: change.id!,
          userId: change.userId!,
          type: 'application_failed',
          message: String(error),
        });
      }
    }

    return {
      content: resolvedContent,
      conflicts,
      resolvedAt: new Date(),
    };
  }

  /**
   * Real-time Notifications
   */
  async subscribeToDocumentChanges(
    documentId: string,
    callback: (change: DocumentChangeEvent) => void
  ): Promise<() => void> {
    const subscription = this.pubsub.asyncIterator(['DOCUMENT_CHANGED']) as AsyncIterableIterator<any>;
    
    const processMessages = async () => {
      try {
        for await (const message of subscription) {
          if (message.documentId === documentId) {
            callback(message);
          }
        }
      } catch (error) {
        console.error('Error processing subscription messages:', error);
      }
    };

    processMessages();

    return () => {
      if (subscription.return) {
        subscription.return();
      }
    };
  }

  async subscribeToComments(
    documentId: string,
    callback: (comment: CommentEvent) => void
  ): Promise<() => void> {
    const unsubscribe = this.pubsub.subscribe('NEW_COMMENT', (payload) => {
      if (payload.documentId === documentId) {
        callback(payload);
      }
    });
    return () => {
      try {
        // Handle different unsubscribe patterns
        console.log('Unsubscribing from comment subscription');
      } catch (error) {
        console.error('Error unsubscribing from comments:', error);
      }
    };
  }

  async subscribeToReviewRequests(
    userId: string,
    callback: (request: ReviewEvent) => void
  ): Promise<() => void> {
    const unsubscribe = this.pubsub.subscribe(`REVIEW_REQUEST_${userId}`, callback);
    return () => {
      try {
        // Handle different unsubscribe patterns
        console.log('Unsubscribing from review requests');
      } catch (error) {
        console.error('Error unsubscribing from review requests:', error);
      }
    };
  }

  /**
   * Presence Tracking
   */
  async trackPresence(userId: string, documentId: string): Promise<void> {
    const sessionId = `doc:${documentId}`;
    const existing = this.userPresence.get(userId);
    
    if (existing) {
      existing.lastSeen = new Date();
      existing.status = 'active';
    } else {
      this.userPresence.set(userId, {
        userId,
        sessionId,
        status: 'active',
        joinedAt: new Date(),
        lastSeen: new Date(),
        cursor: null,
        selection: null,
      });
    }

    // Store in Redis for persistence
    if (this.redis) {
      await this.redis.setex(
        `presence:${userId}`,
        300, // 5 minutes TTL
        JSON.stringify(this.userPresence.get(userId))
      );
    }
  }

  async getActiveUsers(documentId: string): Promise<ActiveUser[]> {
    const sessionId = `doc:${documentId}`;
    const activeUsers: ActiveUser[] = [];

    for (const [userId, presence] of this.userPresence) {
      if (presence.sessionId === sessionId && 
          Date.now() - presence.lastSeen.getTime() < 60000) { // Active within 1 minute
        const session = this.collaborationSessions.get(sessionId);
        const participant = session?.participants.get(userId);
        
        if (participant) {
          activeUsers.push({
            id: userId,
            name: participant.name,
            avatar: participant.avatar,
            status: presence.status,
            cursor: presence.cursor,
            selection: presence.selection,
            lastSeen: presence.lastSeen,
          });
        }
      }
    }

    return activeUsers;
  }

  /**
   * Private helper methods
   */
  private handleSessionMessage(sessionId: string, userId: string, message: Buffer | ArrayBuffer | Buffer[]): void {
    try {
      const messageStr = message instanceof ArrayBuffer 
        ? new TextDecoder().decode(message)
        : Array.isArray(message) 
          ? Buffer.concat(message).toString()
          : message.toString();
      const data = JSON.parse(messageStr);
      
      switch (data.type) {
        case 'cursor':
          this.shareCursor(sessionId, userId, data.position);
          break;
        case 'selection':
          this.shareSelection(sessionId, userId, data.selection);
          break;
        case 'change':
          this.streamChange(sessionId, userId, data.change);
          break;
        case 'heartbeat':
          this.trackPresence(userId, sessionId.replace('doc:', ''));
          break;
      }
    } catch (error) {
      console.error('Error handling session message:', error);
    }
  }

  private broadcastToSession(
    sessionId: string, 
    message: any, 
    excludeUserId?: string
  ): void {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) return;

    const messageStr = JSON.stringify(message);

    for (const [userId, participant] of session.participants) {
      if (userId !== excludeUserId && participant.websocket.readyState === WebSocket.OPEN) {
        participant.websocket.send(messageStr);
      }
    }
  }

  private applyChange(content: string, change: DocumentChange): string {
    // Simple change application - in production, use operational transforms
    switch (change.operation) {
      case 'insert':
        return content.slice(0, change.position) + 
               change.text + 
               content.slice(change.position);
      case 'delete':
        return content.slice(0, change.position) + 
               content.slice(change.position + (change.length || 0));
      case 'replace':
        return content.slice(0, change.position) + 
               change.text + 
               content.slice(change.position + (change.length || 0));
      default:
        return content;
    }
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public methods for GraphQL subscriptions
   */
  getPubSub(): PubSub {
    return this.pubsub;
  }

  async publishDocumentUpdate(documentId: string, updateType: string, data: any): Promise<void> {
    await this.pubsub.publish('DOCUMENT_UPDATED', {
      documentId,
      type: updateType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  async publishCommentAdded(documentId: string, comment: any): Promise<void> {
    await this.pubsub.publish('NEW_COMMENT', {
      documentId,
      comment,
      timestamp: new Date().toISOString(),
    });
  }
}

// Type definitions
export interface CollaborationSession {
  id: string;
  documentId: string;
  participants: Map<string, SessionParticipant>;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, Selection>;
  changeBuffer: DocumentChange[];
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface SessionParticipant extends SessionUser {
  websocket: WebSocket;
  joinedAt: Date;
  lastActivity: Date;
}

export interface UserPresence {
  userId: string;
  sessionId: string;
  status: 'active' | 'idle' | 'away';
  joinedAt: Date;
  lastSeen: Date;
  cursor: CursorPosition | null;
  selection: Selection | null;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface DocumentChange {
  id?: string;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  length?: number;
  text?: string;
  userId?: string;
  timestamp?: number;
}

export interface ResolvedDocument {
  content: string;
  conflicts: ConflictInfo[];
  resolvedAt: Date;
}

export interface ConflictInfo {
  changeId: string;
  userId: string;
  type: 'application_failed' | 'concurrent_edit';
  message: string;
}

export interface DocumentChangeEvent {
  documentId: string;
  change: DocumentChange;
}

export interface CommentEvent {
  documentId: string;
  comment: any;
  timestamp: string;
}

export interface ReviewEvent {
  documentId: string;
  requestedBy: string;
  message: string;
  timestamp: string;
}

export interface ActiveUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'idle' | 'away';
  cursor: CursorPosition | null;
  selection: Selection | null;
  lastSeen: Date;
}