import * as XLSX from 'xlsx';

export interface ParsedParticipant {
  teamName: string;
  participantName: string;
  email: string;
  department: string;
  collaborationDept: string;
  college: string;
  date: string;
  role?: string;
}

export interface ParseResult {
  success: boolean;
  error?: string;
  participants: ParsedParticipant[];
  teamCount: number;
  participantCount: number;
  fileName?: string;
  rawHeaders: string[];
}

/**
 * Normalizes string keys for fuzzy column matching.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Attempts to detect header mapping from raw keys
 */
function findKey(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const normC = normalizeKey(c);
    const found = keys.find((k) => normalizeKey(k) === normC || normalizeKey(k).includes(normC));
    if (found) return found;
  }
  return undefined;
}

/**
 * Parses any uploaded data sheet format:
 * - XLSX / XLS (Excel)
 * - CSV
 * - TSV
 * - JSON
 * - Plain text table / TSV paste
 */
export async function parseDataSheet(
  fileOrContent: File | string,
  fileName = 'datasheet.csv'
): Promise<ParseResult> {
  try {
    let rows: Record<string, any>[] = [];
    let detectedFileName = fileName;

    if (typeof fileOrContent === 'string') {
      // Check if JSON
      const trimmed = fileOrContent.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        rows = JSON.parse(trimmed);
      } else {
        // Parse CSV or TSV text using XLSX reader
        const workbook = XLSX.read(fileOrContent, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
      }
    } else {
      detectedFileName = fileOrContent.name;
      const arrayBuffer = await fileOrContent.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
    }

    if (!rows || rows.length === 0) {
      return {
        success: false,
        error: 'The uploaded file appears to be empty or contains no readable rows.',
        participants: [],
        teamCount: 0,
        participantCount: 0,
        rawHeaders: [],
      };
    }

    const sampleRow = rows[0];
    const rawHeaders = Object.keys(sampleRow);

    // Identify column mappings
    const teamKey = findKey(sampleRow, ['team name', 'team', 'teamname', 'group', 'project']);
    const nameKey = findKey(sampleRow, [
      'participant name',
      'member name',
      'student name',
      'full name',
      'name',
      'student',
      'participant',
      'members',
    ]);
    const emailKey = findKey(sampleRow, ['email', 'mail', 'student email', 'member email', 'email address']);
    const deptKey = findKey(sampleRow, ['department', 'dept', 'branch', 'stream', 'course']);
    const collabDeptKey = findKey(sampleRow, [
      'collaboration dept',
      'collab dept',
      'partner dept',
      'co-department',
      'secondary dept',
    ]);
    const collegeKey = findKey(sampleRow, [
      'college',
      'institution',
      'university',
      'institute',
      'school',
      'organization',
    ]);
    const dateKey = findKey(sampleRow, ['date', 'issue date', 'event date', 'completion date']);
    const roleKey = findKey(sampleRow, ['role', 'designation', 'member role']);

    const participants: ParsedParticipant[] = [];
    const teamSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawTeam = (teamKey ? String(row[teamKey] || '') : `Team-${Math.floor(i / 4) + 1}`).trim();
      const rawNames = (nameKey ? String(row[nameKey] || '') : '').trim();

      if (!rawNames && !rawTeam) continue;

      const dept = (deptKey ? String(row[deptKey] || '') : 'Computer Science & Engineering').trim();
      const collabDept = (collabDeptKey ? String(row[collabDeptKey] || '') : 'AI & Data Science').trim();
      const college = (collegeKey ? String(row[collegeKey] || '') : 'Apex Institute of Technology').trim();
      const date = (dateKey ? String(row[dateKey] || '') : new Date().toISOString().split('T')[0]).trim();
      const role = roleKey ? String(row[roleKey] || 'Member').trim() : 'Member';

      // Check if multiple members are comma-separated in the same row
      const memberNames = rawNames.includes(',')
        ? rawNames.split(',').map((n) => n.trim()).filter(Boolean)
        : [rawNames || `Participant ${i + 1}`];

      for (let mIdx = 0; mIdx < memberNames.length; mIdx++) {
        const pName = memberNames[mIdx];
        const teamName = rawTeam || `Team ${pName.split(' ')[0]}`;
        teamSet.add(teamName);

        // Derive or pick email
        let email = '';
        if (memberNames.length === 1 && emailKey && row[emailKey]) {
          email = String(row[emailKey]).trim();
        } else {
          const sanitized = pName.toLowerCase().replace(/[^a-z0-9]/g, '.');
          email = `${sanitized}@hackathon.participant`;
        }

        participants.push({
          teamName,
          participantName: pName,
          email,
          department: dept || 'Computer Science & Engineering',
          collaborationDept: collabDept || 'AI & Data Science',
          college: college || 'Apex Institute of Technology',
          date,
          role,
        });
      }
    }

    return {
      success: true,
      participants,
      teamCount: teamSet.size,
      participantCount: participants.length,
      fileName: detectedFileName,
      rawHeaders,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to parse data sheet file.',
      participants: [],
      teamCount: 0,
      participantCount: 0,
      rawHeaders: [],
    };
  }
}

/**
 * Returns a rich benchmark mock data sheet suitable for testing and demonstration.
 */
export function getSampleDataSheet(): ParsedParticipant[] {
  return [
    {
      teamName: 'Team Phoenix',
      participantName: 'Alex Rivera',
      email: 'alex.rivera@apex.edu',
      department: 'Computer Science & Engineering',
      collaborationDept: 'AI & Data Science',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Team Lead',
    },
    {
      teamName: 'Team Phoenix',
      participantName: 'Sophia Chen',
      email: 'sophia.chen@apex.edu',
      department: 'Computer Science & Engineering',
      collaborationDept: 'AI & Data Science',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Core Member',
    },
    {
      teamName: 'Team Phoenix',
      participantName: 'Rahul Sharma',
      email: 'rahul.sharma@apex.edu',
      department: 'Information Technology',
      collaborationDept: 'Cybersecurity',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Core Member',
    },
    {
      teamName: 'Team NeuralGuard',
      participantName: 'Marcus Vance',
      email: 'marcus.v@apex.edu',
      department: 'Artificial Intelligence & Robotics',
      collaborationDept: 'Data Intelligence',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Team Lead',
    },
    {
      teamName: 'Team NeuralGuard',
      participantName: 'Elena Rostova',
      email: 'elena.rostova@apex.edu',
      department: 'Computer Science & Engineering',
      collaborationDept: 'Cloud Architecture',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Core Member',
    },
    {
      teamName: 'Team CyberShield',
      participantName: 'Devon Miles',
      email: 'devon.miles@apex.edu',
      department: 'Cyber Security & Forensics',
      collaborationDept: 'Information Systems',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Team Lead',
    },
    {
      teamName: 'Team CyberShield',
      participantName: 'Ananya Iyer',
      email: 'ananya.iyer@apex.edu',
      department: 'Cyber Security & Forensics',
      collaborationDept: 'Information Systems',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Core Member',
    },
    {
      teamName: 'Team BlockMatrix',
      participantName: 'Kenji Sato',
      email: 'kenji.sato@apex.edu',
      department: 'Blockchain & Distributed Computing',
      collaborationDept: 'FinTech Architecture',
      college: 'Apex Institute of Technology',
      date: '2026-09-29',
      role: 'Team Lead',
    },
  ];
}
