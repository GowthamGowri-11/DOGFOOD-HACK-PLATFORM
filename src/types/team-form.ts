export type FormFieldType =
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'TEXTAREA'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'URL';

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface TeamMemberFormField {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FormFieldValidation;
  order: number;
}

export interface TeamMemberFormConfig {
  hackathonId: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  fields: TeamMemberFormField[];
  updatedAt: string;
}

export const DEFAULT_FORM_FIELDS: TeamMemberFormField[] = [
  {
    id: 'field_fullname',
    type: 'TEXT',
    label: 'Full Name',
    placeholder: 'e.g. Rahul Kumar',
    description: 'Legal full name of the team member',
    required: true,
    order: 1,
  },
  {
    id: 'field_email',
    type: 'EMAIL',
    label: 'Email Address',
    placeholder: 'e.g. rahul@example.com',
    description: 'Official academic or contact email',
    required: true,
    order: 2,
  },
  {
    id: 'field_phone',
    type: 'PHONE',
    label: 'Phone Number',
    placeholder: 'e.g. +1 555-0199',
    description: 'Mobile number for emergency announcements',
    required: false,
    order: 3,
  },
  {
    id: 'field_department',
    type: 'SELECT',
    label: 'Department',
    placeholder: 'Select department',
    description: 'Academic engineering department',
    required: true,
    options: [
      'AI&DS - Artificial Intelligence & Data Science',
      'AIML - Artificial Intelligence & Machine Learning',
      'CSE - Computer Science & Engineering',
      'IT - Information Technology',
      'ECE - Electronics & Communication Engineering',
      'EEE - Electrical & Electronics Engineering',
      'MECH - Mechanical Engineering',
      'CIVIL - Civil Engineering',
      'General / Other',
    ],
    order: 4,
  },
  {
    id: 'field_year',
    type: 'SELECT',
    label: 'Year of Study',
    placeholder: 'Select year',
    description: 'Current academic batch year',
    required: true,
    options: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'],
    order: 5,
  },
  {
    id: 'field_github',
    type: 'URL',
    label: 'GitHub Profile',
    placeholder: 'https://github.com/username',
    description: 'Portfolio or GitHub profile link',
    required: false,
    order: 6,
  },
  {
    id: 'field_skills',
    type: 'TEXT',
    label: 'Skills & Specialization',
    placeholder: 'e.g. Next.js, Python, Agentic AI, UI Design',
    description: 'Primary contribution to the team',
    required: false,
    order: 7,
  },
];
