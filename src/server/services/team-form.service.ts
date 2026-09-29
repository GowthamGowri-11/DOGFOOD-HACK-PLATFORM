import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { AuditService } from '@/server/services/audit.service';
import { TeamRepository } from '@/server/repositories/team.repository';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export * from '@/types/team-form';
import {
  FormFieldType,
  FormFieldValidation,
  TeamMemberFormField,
  TeamMemberFormConfig,
  DEFAULT_FORM_FIELDS,
} from '@/types/team-form';

export class TeamFormService {
  /**
   * Generates a default initial form config for a hackathon
   */
  public static getDefaultForm(hackathonId: string, hackathonTitle?: string): TeamMemberFormConfig {
    return {
      hackathonId,
      title: hackathonTitle ? `${hackathonTitle} — Team Member Registration` : 'Team Member Registration Form',
      description: 'Please provide required teammate credentials and academic details to join the squad.',
      status: 'PUBLISHED',
      version: 1,
      fields: [...DEFAULT_FORM_FIELDS],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Retrieves the form configuration for a hackathon.
   */
  public static async getForm(hackathonId: string): Promise<TeamMemberFormConfig> {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true, title: true, rulesAndGuidelines: true },
    });

    if (!hackathon) {
      throw { message: 'Hackathon not found', code: 'NOT_FOUND', status: 404 };
    }

    if (hackathon.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(hackathon.rulesAndGuidelines);
        if (parsed.teamMemberForm && typeof parsed.teamMemberForm === 'object') {
          return {
            ...parsed.teamMemberForm,
            hackathonId: hackathon.id,
          };
        }
      } catch {
        // Fallback
      }
    }

    return this.getDefaultForm(hackathon.id, hackathon.title);
  }

  /**
   * Saves or updates the form configuration (Organizer action).
   */
  public static async saveForm(
    hackathonId: string,
    userId: string,
    userRole: string,
    formData: Partial<TeamMemberFormConfig>
  ): Promise<TeamMemberFormConfig> {
    if (userRole === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(userId, hackathonId);
      if (!canAccess) {
        throw { message: 'You are not authorized to manage this hackathon form.', code: 'FORBIDDEN', status: 403 };
      }
    } else if (userRole !== 'ADMIN') {
      throw { message: 'Unauthorized', code: 'FORBIDDEN', status: 403 };
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw { message: 'Hackathon not found', code: 'NOT_FOUND', status: 404 };
    }

    let currentConfig: any = {};
    if (hackathon.rulesAndGuidelines) {
      try {
        currentConfig = JSON.parse(hackathon.rulesAndGuidelines);
      } catch {
        currentConfig = {};
      }
    }

    const existingForm = currentConfig.teamMemberForm || this.getDefaultForm(hackathonId, hackathon.title);

    const updatedForm: TeamMemberFormConfig = {
      hackathonId,
      title: (formData.title || existingForm.title || 'Team Member Registration').trim(),
      description: (formData.description || existingForm.description || '').trim(),
      status: formData.status || existingForm.status || 'DRAFT',
      version: existingForm.version || 1,
      fields: Array.isArray(formData.fields) ? formData.fields : existingForm.fields,
      updatedAt: new Date().toISOString(),
    };

    currentConfig.teamMemberForm = updatedForm;

    await prisma.hackathon.update({
      where: { id: hackathonId },
      data: {
        rulesAndGuidelines: JSON.stringify(currentConfig),
      },
    });

    await AuditService.log({
      userId,
      hackathonId,
      action: 'TEAM_FORM_UPDATED',
      entityType: 'TeamMemberForm',
      entityId: hackathonId,
      afterState: { status: updatedForm.status, fieldCount: updatedForm.fields.length },
    });

    return updatedForm;
  }

  /**
   * Publishes the form configuration and increments version.
   */
  public static async publishForm(
    hackathonId: string,
    userId: string,
    userRole: string
  ): Promise<TeamMemberFormConfig> {
    if (userRole === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(userId, hackathonId);
      if (!canAccess) {
        throw { message: 'You are not authorized to publish this hackathon form.', code: 'FORBIDDEN', status: 403 };
      }
    } else if (userRole !== 'ADMIN') {
      throw { message: 'Unauthorized', code: 'FORBIDDEN', status: 403 };
    }

    const form = await this.getForm(hackathonId);
    const updatedForm: TeamMemberFormConfig = {
      ...form,
      status: 'PUBLISHED',
      version: (form.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.saveForm(hackathonId, userId, userRole, updatedForm);

    await eventBus.publish({
      type: 'TEAM_FORM_PUBLISHED',
      hackathonId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        hackathonId,
        version: saved.version,
        title: saved.title,
        status: saved.status,
        fieldCount: saved.fields.length,
      },
    });

    return saved;
  }

  /**
   * Submits a Team Member Form response and immediately creates the TeamMember entity.
   */
  public static async submitMemberForm(data: {
    hackathonId: string;
    teamId: string;
    actorUserId: string;
    formResponse: Record<string, any>;
  }) {
    const { hackathonId, teamId, actorUserId, formResponse } = data;

    // 1. Validate team and hackathon
    const team = await TeamRepository.findById(teamId);
    if (!team || team.hackathonId !== hackathonId) {
      throw { message: 'Team not found in this hackathon', code: 'NOT_FOUND', status: 404 };
    }

    // 2. Actor must be a member or leader of the team
    const isLeader = team.leaderId === actorUserId;
    const isMember = team.members.some((m) => m.userId === actorUserId);
    if (!isLeader && !isMember) {
      throw { message: 'Only team members or the team leader can add teammates', code: 'FORBIDDEN', status: 403 };
    }

    // 3. Check team capacity
    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) {
      throw { message: 'Hackathon not found', code: 'NOT_FOUND', status: 404 };
    }

    const currentMemberCount = team.members.length;
    if (currentMemberCount >= hackathon.maxTeamSize) {
      throw {
        message: `This team has reached maximum allowed capacity (${hackathon.maxTeamSize} members).`,
        code: 'TEAM_FULL',
        status: 400,
      };
    }

    // 4. Fetch the published form definition
    const formConfig = await this.getForm(hackathonId);

    // 5. Server-side validation of all required fields
    for (const field of formConfig.fields) {
      if (field.required) {
        const val = formResponse[field.id] || formResponse[field.label] || formResponse[field.id.replace('field_', '')];
        if (val === undefined || val === null || String(val).trim() === '') {
          throw {
            message: `Required field "${field.label}" is missing or empty.`,
            code: 'VALIDATION_ERROR',
            status: 422,
          };
        }
      }
    }

    // 6. Extract Email and Full Name
    const emailVal = (
      formResponse['field_email'] ||
      formResponse['email'] ||
      formResponse['Email Address'] ||
      formResponse['Email'] ||
      ''
    ).toString().trim().toLowerCase();

    const nameVal = (
      formResponse['field_fullname'] ||
      formResponse['fullName'] ||
      formResponse['name'] ||
      formResponse['Full Name'] ||
      'Team Member'
    ).toString().trim();

    if (!emailVal || !emailVal.includes('@')) {
      throw { message: 'A valid teammate email address is required', code: 'INVALID_EMAIL', status: 422 };
    }

    // 7. Prevent duplicate member in the same team
    const alreadyInThisTeam = team.members.some(
      (m) => m.user.email.toLowerCase() === emailVal || m.userId === emailVal
    );
    if (alreadyInThisTeam) {
      throw {
        message: `User with email "${emailVal}" is already a member of this team.`,
        code: 'ALREADY_IN_THIS_TEAM',
        status: 409,
      };
    }

    // 8. Find or create the teammate User
    let teammateUser = await prisma.user.findUnique({
      where: { email: emailVal },
    });

    if (!teammateUser) {
      const defaultPasswordHash = await bcrypt.hash(`ATLYXMember@${Date.now()}`, 10);
      teammateUser = await prisma.user.create({
        data: {
          email: emailVal,
          fullName: nameVal,
          passwordHash: defaultPasswordHash,
          role: 'PARTICIPANT',
        },
      });
    }

    // 9. ONE-TEAM-PER-HACKATHON check: Teammate must not already be in another team for this hackathon
    const existingOtherTeam = await TeamRepository.findByHackathonAndUser(hackathonId, teammateUser.id);
    if (existingOtherTeam) {
      throw {
        message: `"${nameVal}" (${emailVal}) is already part of team "${existingOtherTeam.name}" in this hackathon. A participant can only join one team per event.`,
        code: 'ALREADY_IN_TEAM',
        status: 409,
      };
    }

    // 10. Ensure registration exists for teammate and save form custom answers
    const existingRegistration = await RegistrationRepository.findByUserAndHackathon(teammateUser.id, hackathonId);
    if (!existingRegistration) {
      await RegistrationRepository.create({
        hackathonId,
        userId: teammateUser.id,
        status: 'APPROVED',
        customAnswers: formResponse,
      });
    } else {
      await prisma.registration.update({
        where: { id: existingRegistration.id },
        data: {
          customAnswers: formResponse,
        },
      });
    }

    // 11. Add teammate immediately to TeamMember table
    const teamMember = await TeamRepository.addMember(teamId, teammateUser.id, false);

    // 12. Audit log
    await AuditService.log({
      userId: actorUserId,
      hackathonId,
      action: 'TEAM_MEMBER_ADDED_VIA_FORM',
      entityType: 'Team',
      entityId: teamId,
      afterState: { teamId, memberUserId: teammateUser.id, memberEmail: emailVal },
    });

    // Announce member addition via WebSocket
    await eventBus.publish({
      type: 'TEAM_MEMBER_ADDED',
      hackathonId,
      teamId,
      userId: teammateUser.id,
      actorId: actorUserId,
      rooms: [
        RealtimeRoomBuilder.team(teamId),
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        teamId,
        userId: teammateUser.id,
        member: teamMember,
        user: { id: teammateUser.id, email: teammateUser.email, fullName: teammateUser.fullName },
      },
    });

    const updatedTeam = await TeamRepository.findById(teamId);

    return {
      success: true,
      member: teamMember,
      user: teammateUser,
      team: updatedTeam,
      formResponse,
    };
  }
}
