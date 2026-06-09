/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'participant' | 'mentor';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Opt out in API responses
  role: UserRole;
  createdAt: string;
}

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  theme: string;
  rules: string;
  createdAt: string;
}

export interface Team {
  id: string;
  teamName: string;
  description: string;
  maxMembers: number;
  leaderId: string;
  hackathonId: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
}

export interface Mentor {
  id: string;
  userId: string;
  skills: string;
  experience: string;
  linkedin: string;
  availability: string;
}

export interface ScoreDetail {
  criteria: 'innovation' | 'technical' | 'uiux' | 'impact' | 'presentation';
  score: number; // Max score details out of respective allocations
  graderId: string; // admin or mentor userId
}

export interface Submission {
  id: string;
  userId: string; // submitter id
  hackathonId: string;
  teamId: string;
  projectTitle: string;
  description: string;
  githubLink: string;
  demoLink: string;
  pptUrl?: string;
  pdfUrl?: string;
  screenshotUrl?: string;
  zipUrl?: string;
  scores: ScoreDetail[];
  totalScore: number; // Calculated automatically
  averageScore: number; // Calculated automatically
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // Direct message to peer / mentor
  teamId?: string; // Message to team chat
  message: string;
  senderName: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
  type?: string;
}

export interface MentorRequest {
  id: string;
  teamId: string;
  mentorId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: string;
}

export interface DashboardStats {
  totalParticipants: number;
  totalHackathons: number;
  totalProjects: number;
  averageScoreAll: number;
}
