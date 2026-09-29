import crypto from 'crypto';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { TeamRepository } from '@/server/repositories/team.repository';
import { AuditService } from '@/server/services/audit.service';
import { RegistrationStatus } from '@prisma/client';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export class RegistrationService {
  /**
   * Registers a participant for a hackathon after verifying all business rules.
   */
  public static async registerParticipant(data: {
    hackathonId: string;
    userId: string;
    customAnswers?: any;
  }) {
    const hackathon = await HackathonRepository.findById(data.hackathonId);
    if (!hackathon) {
      throw { message: 'Hackathon not found.', code: 'NOT_FOUND', status: 404 };
    }

    if (hackathon.status === 'DRAFT') {
      throw {
        message: 'This hackathon is currently in draft mode and not accepting registrations.',
        code: 'HACKATHON_DRAFT',
        status: 400,
      };
    }

    const now = Date.now();
    const regStart = new Date(hackathon.regStartTime).getTime();
    const regEnd = new Date(hackathon.regEndTime).getTime();

    if (now < regStart) {
      throw {
        message: 'Registration for this hackathon has not opened yet.',
        code: 'REGISTRATION_NOT_STARTED',
        status: 400,
      };
    }

    if (now > regEnd) {
      throw {
        message: 'Registration for this hackathon is closed.',
        code: 'REGISTRATION_CLOSED',
        status: 400,
      };
    }

    // Check if already registered
    const existing = await RegistrationRepository.findByUserAndHackathon(data.userId, data.hackathonId);
    if (existing) {
      throw {
        message: 'You are already registered for this hackathon.',
        code: 'ALREADY_REGISTERED',
        status: 409,
      };
    }

    const registration = await RegistrationRepository.create({
      hackathonId: data.hackathonId,
      userId: data.userId,
      status: 'APPROVED',
      customAnswers: data.customAnswers,
    });

    await AuditService.log({
      userId: data.userId,
      hackathonId: data.hackathonId,
      action: 'PARTICIPANT_REGISTERED',
      entityType: 'Registration',
      entityId: registration.id,
      afterState: { id: registration.id, status: registration.status },
    });

    // Announce registration change via WebSocket
    await eventBus.publish({
      type: 'REGISTRATION_CREATED',
      hackathonId: data.hackathonId,
      userId: data.userId,
      actorId: data.userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(data.hackathonId),
        RealtimeRoomBuilder.organizer(data.hackathonId),
        RealtimeRoomBuilder.user(data.userId),
      ],
      payload: {
        registrationId: registration.id,
        hackathonId: data.hackathonId,
        userId: data.userId,
        status: registration.status,
      },
    });

    return registration;
  }

  /**
   * Cancels a user's registration for a hackathon.
   */
  public static async cancelRegistration(userId: string, hackathonId: string) {
    const registration = await RegistrationRepository.findByUserAndHackathon(userId, hackathonId);
    if (!registration) {
      throw { message: 'Registration not found.', code: 'NOT_FOUND', status: 404 };
    }

    // If user is currently in a team for this hackathon, they must leave the team first
    const existingTeam = await TeamRepository.findByHackathonAndUser(hackathonId, userId);
    if (existingTeam) {
      throw {
        message: 'You cannot cancel registration while being a member of an active team. Leave or disband the team first.',
        code: 'ACTIVE_TEAM_MEMBER',
        status: 400,
      };
    }

    await RegistrationRepository.delete(registration.id);

    await AuditService.log({
      userId,
      hackathonId,
      action: 'REGISTRATION_CANCELLED',
      entityType: 'Registration',
      entityId: registration.id,
      beforeState: { id: registration.id, status: registration.status },
    });

    await eventBus.publish({
      type: 'REGISTRATION_CANCELLED',
      hackathonId,
      userId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
        RealtimeRoomBuilder.user(userId),
      ],
      payload: {
        hackathonId,
        userId,
      },
    });

    return true;
  }

  /**
   * Updates registration status (Organizer/Admin action).
   */
  public static async updateStatus(
    actorId: string,
    registrationId: string,
    status: RegistrationStatus
  ) {
    const reg = await RegistrationRepository.findById(registrationId);
    if (!reg) {
      throw { message: 'Registration not found.', code: 'NOT_FOUND', status: 404 };
    }

    const updated = await RegistrationRepository.updateStatus(registrationId, status);

    await AuditService.log({
      userId: actorId,
      hackathonId: reg.hackathon.id,
      action: 'REGISTRATION_STATUS_UPDATED',
      entityType: 'Registration',
      entityId: registrationId,
      beforeState: { status: reg.status },
      afterState: { status: updated.status },
    });

    return updated;
  }

  /**
   * Updates registration check-in status (Organizer/Admin check-in desk).
   */
  public static async updateCheckIn(
    actorId: string,
    registrationId: string,
    checkedIn: boolean
  ) {
    const reg = await RegistrationRepository.findById(registrationId);
    if (!reg) {
      throw { message: 'Registration not found.', code: 'NOT_FOUND', status: 404 };
    }

    const updated = await RegistrationRepository.updateCheckIn(registrationId, checkedIn);

    await AuditService.log({
      userId: actorId,
      hackathonId: reg.hackathon.id,
      action: checkedIn ? 'PARTICIPANT_CHECKED_IN' : 'PARTICIPANT_CHECKED_OUT',
      entityType: 'Registration',
      entityId: registrationId,
      beforeState: { checkedIn: reg.checkedIn },
      afterState: { checkedIn: updated.checkedIn },
    });

    await eventBus.publish({
      type: 'ATTENDANCE_UPDATED',
      hackathonId: reg.hackathon.id,
      userId: reg.userId,
      actorId,
      rooms: [
        RealtimeRoomBuilder.hackathon(reg.hackathon.id),
        RealtimeRoomBuilder.organizer(reg.hackathon.id),
        RealtimeRoomBuilder.user(reg.userId),
      ],
      payload: {
        registrationId,
        checkedIn: updated.checkedIn,
      },
    });

    return updated;
  }
}
