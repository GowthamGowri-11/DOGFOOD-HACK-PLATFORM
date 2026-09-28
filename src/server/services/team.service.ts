import crypto from 'crypto';
import { TeamRepository } from '@/server/repositories/team.repository';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { TeamInviteRepository } from '@/server/repositories/team-invite.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { AuditService } from '@/server/services/audit.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export interface TeamReadinessStatus {
  isReady: boolean;
  memberCount: number;
  minTeamSize: number;
  maxTeamSize: number;
  missingMembers: number;
  canAcceptMore: boolean;
  statusLabel: string;
}

export class TeamService {
  /**
   * Generates a collision-resistant human-readable team invite code (e.g. TEAM-7X9K)
   */
  public static generateInviteCode(teamName: string): string {
    const prefix = teamName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4) || 'TEAM';
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${rand}`;
  }

  /**
   * Evaluates team size compliance against hackathon bounds.
   */
  public static calculateReadiness(
    memberCount: number,
    minTeamSize: number,
    maxTeamSize: number
  ): TeamReadinessStatus {
    const isReady = memberCount >= minTeamSize && memberCount <= maxTeamSize;
    const missingMembers = Math.max(0, minTeamSize - memberCount);
    const canAcceptMore = memberCount < maxTeamSize;

    let statusLabel = 'READY';
    if (memberCount < minTeamSize) {
      statusLabel = `INCOMPLETE (Needs ${missingMembers} more)`;
    } else if (memberCount > maxTeamSize) {
      statusLabel = 'OVERSIZED';
    }

    return {
      isReady,
      memberCount,
      minTeamSize,
      maxTeamSize,
      missingMembers,
      canAcceptMore,
      statusLabel,
    };
  }

  /**
   * Creates a new team with the current user as Leader.
   */
  public static async createTeam(data: {
    hackathonId: string;
    userId: string;
    name: string;
  }) {
    const hackathon = await HackathonRepository.findById(data.hackathonId);
    if (!hackathon) {
      throw { message: 'Hackathon not found.', code: 'NOT_FOUND', status: 404 };
    }

    // 1. Participant must be registered for this hackathon
    const registration = await RegistrationRepository.findByUserAndHackathon(data.userId, data.hackathonId);
    if (!registration) {
      throw {
        message: 'Registration required. Please register for this hackathon first.',
        code: 'REGISTRATION_REQUIRED',
        status: 403,
      };
    }

    // 2. ONE-TEAM-PER-HACKATHON RULE
    const existingTeam = await TeamRepository.findByHackathonAndUser(data.hackathonId, data.userId);
    if (existingTeam) {
      throw {
        message: `You are already a member of team "${existingTeam.name}" in this hackathon. You cannot join or create multiple teams.`,
        code: 'ALREADY_IN_TEAM',
        status: 409,
      };
    }

    // 3. Name uniqueness within hackathon
    const nameTaken = await TeamRepository.checkNameExists(data.hackathonId, data.name);
    if (nameTaken) {
      throw {
        message: `A team named "${data.name.trim()}" already exists in this hackathon. Please choose another name.`,
        code: 'TEAM_NAME_TAKEN',
        status: 409,
      };
    }

    let inviteCode = this.generateInviteCode(data.name);
    let codeExists = await TeamRepository.findByInviteCode(inviteCode);
    let attempts = 0;
    while (codeExists && attempts < 5) {
      inviteCode = this.generateInviteCode(data.name);
      codeExists = await TeamRepository.findByInviteCode(inviteCode);
      attempts++;
    }

    const team = await TeamRepository.create({
      hackathonId: data.hackathonId,
      name: data.name,
      inviteCode,
      leaderId: data.userId,
    });

    if (!team) {
      throw { message: 'Failed to create team.', code: 'INTERNAL_ERROR', status: 500 };
    }

    await AuditService.log({
      userId: data.userId,
      hackathonId: data.hackathonId,
      action: 'TEAM_CREATED',
      entityType: 'Team',
      entityId: team.id,
      afterState: { id: team.id, name: team.name, leaderId: data.userId },
    });

    // Announce the change via WebSocket (post-DB-commit)
    await eventBus.publish({
      type: 'TEAM_CREATED',
      hackathonId: data.hackathonId,
      teamId: team.id,
      userId: data.userId,
      actorId: data.userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(data.hackathonId),
        RealtimeRoomBuilder.organizer(data.hackathonId),
        RealtimeRoomBuilder.user(data.userId),
      ],
      payload: {
        id: team.id,
        name: team.name,
        leaderId: data.userId,
        memberCount: 1,
        maxTeamSize: hackathon.maxTeamSize,
      },
    });

    return team;
  }

  /**
   * Joins a team using an invite code.
   */
  public static async joinTeamByCode(userId: string, inviteCode: string) {
    const team = await TeamRepository.findByInviteCode(inviteCode.trim().toUpperCase());
    if (!team) {
      throw { message: 'Invalid team invite code.', code: 'INVALID_INVITE_CODE', status: 404 };
    }

    // 1. Participant must be registered for this hackathon
    const registration = await RegistrationRepository.findByUserAndHackathon(userId, team.hackathonId);
    if (!registration) {
      throw {
        message: 'Registration required. Please register for this hackathon first.',
        code: 'REGISTRATION_REQUIRED',
        status: 403,
      };
    }

    // 2. ONE-TEAM-PER-HACKATHON RULE
    const existingTeam = await TeamRepository.findByHackathonAndUser(team.hackathonId, userId);
    if (existingTeam) {
      throw {
        message: `You are already a member of team "${existingTeam.name}" in this hackathon.`,
        code: 'ALREADY_IN_TEAM',
        status: 409,
      };
    }

    // 3. Team size validation
    const currentMemberCount = await TeamRepository.countMembers(team.id);
    if (currentMemberCount >= team.hackathon.maxTeamSize) {
      throw {
        message: `This team has reached the maximum allowed team size (${team.hackathon.maxTeamSize} members).`,
        code: 'TEAM_FULL',
        status: 400,
      };
    }

    const member = await TeamRepository.addMember(team.id, userId, false);

    await AuditService.log({
      userId,
      hackathonId: team.hackathonId,
      action: 'TEAM_MEMBER_JOINED',
      entityType: 'Team',
      entityId: team.id,
      afterState: { teamId: team.id, userId },
    });

    // Announce the member addition via WebSocket
    await eventBus.publish({
      type: 'TEAM_MEMBER_ADDED',
      hackathonId: team.hackathonId,
      teamId: team.id,
      userId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.team(team.id),
        RealtimeRoomBuilder.hackathon(team.hackathonId),
        RealtimeRoomBuilder.organizer(team.hackathonId),
      ],
      payload: {
        teamId: team.id,
        userId,
        member,
      },
    });

    return { team, member };
  }

  /**
   * Generates a secure shareable team invite token.
   */
  public static async createInvite(data: {
    teamId: string;
    invitedById: string;
    invitedEmail: string;
  }) {
    const team = await TeamRepository.findById(data.teamId);
    if (!team) {
      throw { message: 'Team not found.', code: 'NOT_FOUND', status: 404 };
    }

    const currentCount = team.members.length;
    if (currentCount >= team.hackathon.maxTeamSize) {
      throw {
        message: `Cannot invite more members. Team has reached maximum size (${team.hackathon.maxTeamSize}).`,
        code: 'TEAM_FULL',
        status: 400,
      };
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await TeamInviteRepository.create({
      teamId: data.teamId,
      invitedEmail: data.invitedEmail,
      invitedById: data.invitedById,
      token,
      expiresAt,
    });

    await AuditService.log({
      userId: data.invitedById,
      hackathonId: team.hackathon.id,
      action: 'TEAM_INVITE_SENT',
      entityType: 'TeamInvite',
      entityId: invite.id,
      afterState: { teamId: data.teamId, email: data.invitedEmail },
    });

    return invite;
  }

  /**
   * Accepts an invitation using a secure token.
   */
  public static async acceptInviteToken(userId: string, token: string) {
    const invite = await TeamInviteRepository.findByToken(token);
    if (!invite) {
      throw { message: 'Invitation link not found or invalid.', code: 'INVALID_TOKEN', status: 404 };
    }

    if (invite.status !== 'PENDING') {
      throw {
        message: `This invitation has already been ${invite.status.toLowerCase()}.`,
        code: 'INVITE_NOT_PENDING',
        status: 400,
      };
    }

    if (new Date() > new Date(invite.expiresAt)) {
      await TeamInviteRepository.updateStatus(invite.id, 'EXPIRED');
      throw { message: 'This invitation link has expired.', code: 'INVITE_EXPIRED', status: 400 };
    }

    const hackathonId = invite.team.hackathon.id;

    // 1. Registration check
    const registration = await RegistrationRepository.findByUserAndHackathon(userId, hackathonId);
    if (!registration) {
      throw {
        message: 'Registration required. Please register for this hackathon first.',
        code: 'REGISTRATION_REQUIRED',
        status: 403,
      };
    }

    // 2. ONE-TEAM-PER-HACKATHON RULE
    const existingTeam = await TeamRepository.findByHackathonAndUser(hackathonId, userId);
    if (existingTeam) {
      throw {
        message: `You are already in team "${existingTeam.name}" in this hackathon.`,
        code: 'ALREADY_IN_TEAM',
        status: 409,
      };
    }

    // 3. Team capacity check
    const currentMemberCount = await TeamRepository.countMembers(invite.teamId);
    if (currentMemberCount >= invite.team.hackathon.maxTeamSize) {
      throw {
        message: `This team has reached maximum team capacity (${invite.team.hackathon.maxTeamSize} members).`,
        code: 'TEAM_FULL',
        status: 400,
      };
    }

    const member = await TeamRepository.addMember(invite.teamId, userId, false);
    await TeamInviteRepository.updateStatus(invite.id, 'ACCEPTED');

    await AuditService.log({
      userId,
      hackathonId,
      action: 'TEAM_INVITE_ACCEPTED',
      entityType: 'Team',
      entityId: invite.teamId,
      afterState: { teamId: invite.teamId, userId },
    });

    // Announce the member addition via WebSocket
    await eventBus.publish({
      type: 'TEAM_MEMBER_ADDED',
      hackathonId,
      teamId: invite.teamId,
      userId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.team(invite.teamId),
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        teamId: invite.teamId,
        userId,
        member,
      },
    });

    return invite.team;
  }

  /**
   * Removes a member or leaves a team.
   */
  public static async removeMember(data: {
    teamId: string;
    targetUserId: string;
    actorUserId: string;
    actorRole: string;
  }) {
    const team = await TeamRepository.findById(data.teamId);
    if (!team) {
      throw { message: 'Team not found.', code: 'NOT_FOUND', status: 404 };
    }

    const isSelf = data.targetUserId === data.actorUserId;
    const isLeader = team.leaderId === data.actorUserId;
    const isAdmin = data.actorRole === 'ADMIN';

    if (!isSelf && !isLeader && !isAdmin) {
      throw {
        message: 'You are not authorized to remove members from this team.',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    const remainingMembers = team.members.filter((m) => m.userId !== data.targetUserId);

    if (remainingMembers.length === 0) {
      // Disband team if no members left
      await TeamRepository.delete(team.id);
      await AuditService.log({
        userId: data.actorUserId,
        hackathonId: team.hackathon.id,
        action: 'TEAM_DELETED',
        entityType: 'Team',
        entityId: team.id,
      });

      await eventBus.publish({
        type: 'TEAM_MEMBER_REMOVED',
        hackathonId: team.hackathon.id,
        teamId: team.id,
        userId: data.targetUserId,
        actorId: data.actorUserId,
        rooms: [
          RealtimeRoomBuilder.team(team.id),
          RealtimeRoomBuilder.hackathon(team.hackathon.id),
          RealtimeRoomBuilder.organizer(team.hackathon.id),
        ],
        payload: {
          teamId: team.id,
          targetUserId: data.targetUserId,
          disbanded: true,
        },
      });

      return { disbanded: true };
    }

    // If leader left, promote the next member
    if (team.leaderId === data.targetUserId) {
      const newLeader = remainingMembers[0];
      await TeamRepository.update(team.id, { leaderId: newLeader.userId });
      await TeamRepository.removeMember(team.id, data.targetUserId);
      await TeamRepository.addMember(team.id, newLeader.userId, true); // ensure isLeader is true
    } else {
      await TeamRepository.removeMember(team.id, data.targetUserId);
    }

    await AuditService.log({
      userId: data.actorUserId,
      hackathonId: team.hackathon.id,
      action: 'TEAM_MEMBER_REMOVED',
      entityType: 'Team',
      entityId: team.id,
      beforeState: { removedUserId: data.targetUserId },
    });

    await eventBus.publish({
      type: 'TEAM_MEMBER_REMOVED',
      hackathonId: team.hackathon.id,
      teamId: team.id,
      userId: data.targetUserId,
      actorId: data.actorUserId,
      rooms: [
        RealtimeRoomBuilder.team(team.id),
        RealtimeRoomBuilder.hackathon(team.hackathon.id),
        RealtimeRoomBuilder.organizer(team.hackathon.id),
      ],
      payload: {
        teamId: team.id,
        targetUserId: data.targetUserId,
        disbanded: false,
      },
    });

    return { disbanded: false };
  }
}
