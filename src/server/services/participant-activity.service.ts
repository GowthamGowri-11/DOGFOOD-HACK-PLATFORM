import prisma from '@/lib/prisma';

export type ActivityType = 
  | 'HACKATHON'
  | 'TEAM'
  | 'PROJECT'
  | 'SUBMISSION'
  | 'RESULT'
  | 'CERTIFICATE'
  | 'ATTENDANCE'
  | 'COMMUNITY';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  status?: string;
  hackathonTitle?: string;
  href?: string;
}

export interface ActivityFilters {
  type?: string;
  dateRange?: string;
  page?: number;
  limit?: number;
}

export class ParticipantActivityService {
  /**
   * Fetches unified, strictly isolated canonical activity timeline for a participant.
   */
  public static async getTimeline(
    userId: string,
    filters: ActivityFilters = {}
  ): Promise<{ items: ActivityItem[]; total: number; page: number; totalPages: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));

    const activities: ActivityItem[] = [];

    try {
      // 1. Hackathon Registrations
      const registrations = await prisma.registration.findMany({
        where: { userId },
        include: {
          hackathon: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { registeredAt: 'desc' },
        take: 30,
      });

      for (const reg of registrations) {
        activities.push({
          id: `reg-${reg.id}`,
          type: 'HACKATHON',
          title: `Registered for Hackathon`,
          description: `You registered for ${reg.hackathon.title}.`,
          entityType: 'REGISTRATION',
          entityId: reg.id,
          timestamp: reg.registeredAt.toISOString(),
          status: reg.status,
          hackathonTitle: reg.hackathon.title,
          href: `/hackathons/${reg.hackathon.slug}`,
        });
      }

      // 2. Teams & Memberships
      const teamMemberships = await prisma.teamMember.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              hackathon: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: 30,
      });

      for (const tm of teamMemberships) {
        activities.push({
          id: `team-${tm.teamId}-${tm.userId}`,
          type: 'TEAM',
          title: tm.isLeader ? `Created Team "${tm.team.name}"` : `Joined Team "${tm.team.name}"`,
          description: tm.isLeader
            ? `You founded team "${tm.team.name}" for ${tm.team.hackathon.title}.`
            : `You joined team "${tm.team.name}" for ${tm.team.hackathon.title}.`,
          entityType: 'TEAM',
          entityId: tm.teamId,
          timestamp: tm.joinedAt.toISOString(),
          hackathonTitle: tm.team.hackathon.title,
          href: `/participant/teams`,
        });
      }

      // 3. Projects
      const projects = await prisma.project.findMany({
        where: {
          team: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          hackathon: {
            select: { id: true, title: true, slug: true },
          },
          track: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      for (const p of projects) {
        activities.push({
          id: `proj-${p.id}`,
          type: 'PROJECT',
          title: `Created Project "${p.title}"`,
          description: `Team project created in track "${p.track?.title || 'General'}" for ${p.hackathon.title}.`,
          entityType: 'PROJECT',
          entityId: p.id,
          timestamp: p.createdAt.toISOString(),
          hackathonTitle: p.hackathon.title,
          href: `/projects/${p.id}`,
        });
      }

      // 4. Submissions
      const submissions = await prisma.submission.findMany({
        where: {
          project: {
            team: {
              members: {
                some: { userId },
              },
            },
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              hackathon: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 30,
      });

      for (const sub of submissions) {
        const isLocked = sub.status === 'LOCKED';
        activities.push({
          id: `sub-${sub.id}`,
          type: 'SUBMISSION',
          title: isLocked ? `Submission Snapshot Locked` : `Project Submitted`,
          description: isLocked
            ? `Immutable SHA-256 snapshot locked for "${sub.project.title}".`
            : `Your project "${sub.project.title}" was submitted successfully.`,
          entityType: 'SUBMISSION',
          entityId: sub.id,
          timestamp: (sub.submittedAt || sub.createdAt).toISOString(),
          status: sub.status,
          hackathonTitle: sub.project.hackathon.title,
          href: `/projects/${sub.project.id}`,
        });
      }

      // 5. Published Results (Participant Privacy Protected - only published canonical outcomes)
      const results = await prisma.result.findMany({
        where: {
          isPublished: true,
          project: {
            team: {
              members: {
                some: { userId },
              },
            },
          },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              hackathon: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });

      for (const res of results) {
        activities.push({
          id: `res-${res.id}`,
          type: 'RESULT',
          title: `Final Results Published: Rank #${res.rank}`,
          description: `Your project "${res.project.title}" placed Rank #${res.rank}${
            res.awardCategory ? ` (${res.awardCategory})` : ''
          } in ${res.project.hackathon.title}!`,
          entityType: 'RESULT',
          entityId: res.id,
          timestamp: (res.publishedAt || res.createdAt).toISOString(),
          status: 'PUBLISHED',
          hackathonTitle: res.project.hackathon.title,
          href: `/leaderboard`,
        });
      }

      // 6. Issued Certificates
      const certificates = await prisma.certificate.findMany({
        where: {
          userId,
          status: 'ISSUED',
        },
        include: {
          hackathon: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { issuedAt: 'desc' },
        take: 20,
      });

      for (const cert of certificates) {
        activities.push({
          id: `cert-${cert.id}`,
          type: 'CERTIFICATE',
          title: `Certificate Issued: ${cert.title || cert.type}`,
          description: `Your verified certificate for ${cert.hackathon.title} is now available.`,
          entityType: 'CERTIFICATE',
          entityId: cert.id,
          timestamp: cert.issuedAt.toISOString(),
          status: cert.status,
          hackathonTitle: cert.hackathon.title,
          href: `/participant/certificates`,
        });
      }

      // 7. Verified Attendance
      const attendance = await prisma.attendanceRecord.findMany({
        where: { userId },
        include: {
          session: {
            select: {
              title: true,
              hackathon: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
        orderBy: { checkedInAt: 'desc' },
        take: 20,
      });

      for (const att of attendance) {
        activities.push({
          id: `att-${att.id}`,
          type: 'ATTENDANCE',
          title: `Checked In: ${att.session?.title || 'Attendance Session'}`,
          description: `Verified check-in recorded for ${att.session?.hackathon?.title || 'Event'}.`,
          entityType: 'ATTENDANCE',
          entityId: att.id,
          timestamp: att.checkedInAt.toISOString(),
          hackathonTitle: att.session?.hackathon?.title,
          href: `/participant/attendance`,
        });
      }

      // 8. Community Votes
      const votes = await prisma.vote.findMany({
        where: { userId },
        include: {
          project: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      });

      for (const vote of votes) {
        activities.push({
          id: `vote-${vote.id}`,
          type: 'COMMUNITY',
          title: `Cast Popularity Vote`,
          description: `You voted for project "${vote.project.title}".`,
          entityType: 'VOTE',
          entityId: vote.id,
          timestamp: vote.createdAt.toISOString(),
          href: `/projects/${vote.project.id}`,
        });
      }
    } catch (error) {
      console.error('[ParticipantActivityService.getTimeline] DB Error:', error);
    }

    // Sort combined chronological activity stream (Newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply Type Filter
    let filtered = activities;
    if (filters.type && filters.type !== 'ALL') {
      filtered = filtered.filter((item) => item.type === filters.type);
    }

    // Apply Date Range Filter if requested
    if (filters.dateRange && filters.dateRange !== 'ALL') {
      const now = new Date().getTime();
      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        if (filters.dateRange === 'TODAY') {
          return now - itemTime <= 24 * 60 * 60 * 1000;
        }
        if (filters.dateRange === 'THIS_WEEK') {
          return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
        }
        if (filters.dateRange === 'THIS_MONTH') {
          return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      total,
      page,
      totalPages,
    };
  }
}
