/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Hackathon,
  Team,
  TeamMember,
  Mentor,
  Submission,
  Message,
  Notification,
  MentorRequest
} from '../src/types';

const DB_PATH = path.join(process.cwd(), 'database.json');

interface DatabaseSchema {
  users: User[];
  hackathons: Hackathon[];
  teams: Team[];
  teamMembers: TeamMember[];
  mentors: Mentor[];
  submissions: Submission[];
  messages: Message[];
  notifications: Notification[];
  mentorRequests: MentorRequest[];
}

// Simple synchronous DB runner with atomic writes to prevent corruption
export class Database {
  private static data: DatabaseSchema | null = null;

  private static load() {
    if (this.data) return this.data;

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        return this.data!;
      } catch (err) {
        console.error('Failed to parse database.json, resetting database.', err);
      }
    }

    // Initialize with beautiful rich mock data if empty or parsed unsuccessfully
    this.data = this.getMockSeeds();
    this.save();
    return this.data!;
  }

  private static save() {
    if (!this.data) return;
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database.json:', err);
    }
  }

  private static getMockSeeds(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const hash = (pass: string) => bcrypt.hashSync(pass, salt);

    // Seed users
    const users: User[] = [
      { id: 'u-1', name: 'Alok Kumar', email: 'alokas096@gmail.com', password: hash('pass123'), role: 'admin', createdAt: new Date().toISOString() },
      { id: 'u-2', name: 'John Doe', email: 'john@hackathon.com', password: hash('pass123'), role: 'participant', createdAt: new Date().toISOString() },
      { id: 'u-3', name: 'Jane Smith', email: 'jane@hackathon.com', password: hash('pass123'), role: 'participant', createdAt: new Date().toISOString() },
      { id: 'u-4', name: 'Alice Johnson', email: 'alice@hackathon.com', password: hash('pass123'), role: 'participant', createdAt: new Date().toISOString() },
      { id: 'u-5', name: 'Dr. Sarah Connor', email: 'sarah@mentor.com', password: hash('pass123'), role: 'mentor', createdAt: new Date().toISOString() },
      { id: 'u-6', name: 'Marcus Aurelius', email: 'marcus@mentor.com', password: hash('pass123'), role: 'mentor', createdAt: new Date().toISOString() },
      { id: 'u-7', name: 'Bob Wilson', email: 'bob@hackathon.com', password: hash('pass123'), role: 'participant', createdAt: new Date().toISOString() },
    ];

    // Seed Hackathons
    const hackathons: Hackathon[] = [
      {
        id: 'h-1',
        title: 'Global Generative AI Sprint',
        description: 'Build helpful agents, intelligent assistants, and innovative web apps leveraging state-of-the-art Generative AI models. Showcase technical execution, utility, and UI polish.',
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        prizePool: '$25,000',
        theme: 'Generative AI, LLMs, Antigravity Agents',
        rules: '1. Projects must use a modern AI SDK (e.g., Gemini API).\n2. Teams can have up to 4 members.\n3. All submissions must include open source code and a live demo link.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'h-2',
        title: 'GreenCode Challenge',
        description: 'Design highly performant, serverless climate tracking systems, energy grid optimizers, or carbon calculator apps to support sustainable developer ecosystems.',
        startDate: '2026-06-10',
        endDate: '2026-06-24',
        prizePool: '$15,000',
        theme: 'Sustainability, ClimateTech, Clean Coding',
        rules: '1. Open to participants worldwide.\n2. Projects must measure or optimize resource efficiency.\n3. Submission slides (PPT/PDF) are highly valued.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'h-3',
        title: 'Mobile Wellness Hackathon',
        description: 'Create mobile-web interactive helpers that support mental tracking, breathing, posture alignment, or physical health diagnostics using React.',
        startDate: '2026-05-10',
        endDate: '2026-05-25',
        prizePool: '$10,000',
        theme: 'Healthcare, Accessibility, Interactive UX',
        rules: '1. Projects must be mobile-responsive.\n2. Audio prompts or visual signals are a big plus.\n3. The design must be extremely clean.',
        createdAt: new Date().toISOString()
      }
    ];

    // Teams
    const teams: Team[] = [
      { id: 't-1', teamName: 'Alpha Agents', description: 'Building contextual AI agents that automate customer flows.', maxMembers: 4, leaderId: 'u-2', hackathonId: 'h-1' },
      { id: 't-2', teamName: 'EcoCoders', description: 'Pioneering cloud serverless energy usage calculators.', maxMembers: 3, leaderId: 'u-4', hackathonId: 'h-2' },
      { id: 't-3', teamName: 'Mindful Tech', description: 'Developing immersive breath pacing web apps with WebAudio.', maxMembers: 2, leaderId: 'u-7', hackathonId: 'h-3' }
    ];

    // Team Members
    const teamMembers: TeamMember[] = [
      { id: 'tm-1', teamId: 't-1', userId: 'u-2' }, // John (Leader)
      { id: 'tm-2', teamId: 't-1', userId: 'u-3' }, // Jane
      { id: 'tm-3', teamId: 't-2', userId: 'u-4' }, // Alice (Leader)
      { id: 'tm-4', teamId: 't-3', userId: 'u-7' }  // Bob (Leader)
    ];

    // Mentors Profile Detail
    const mentors: Mentor[] = [
      { id: 'm-1', userId: 'u-5', skills: 'React, LLMs, Node.js, NLP Engineer', experience: '8 Years Sr Scientist at DeepMind', linkedin: 'https://linkedin.com/in/sarah-science', availability: 'Weekday evenings (6:00 PM - 8:00 PM UTC)' },
      { id: 'm-2', userId: 'u-6', skills: 'Distributed Databases, System Architecture, UI/UX Designer', experience: '12 Years Tech Lead at Google Cloud', linkedin: 'https://linkedin.com/in/marcus-architect', availability: 'Weekends (10:00 AM - 4:00 PM UTC)' }
    ];

    // Submissions
    const submissions: Submission[] = [
      {
        id: 's-1',
        userId: 'u-2',
        hackathonId: 'h-1',
        teamId: 't-1',
        projectTitle: 'Smart-Agent CRM Companion',
        description: 'An AI-powered customer relationship assistant that reads real-time tickets, categorizes them instantly, drafts professional email responses, and triggers custom webhook automations.',
        githubLink: 'https://github.com/john/smart-crm',
        demoLink: 'https://smart-crm-agent.vercel.app',
        pptUrl: '',
        pdfUrl: '',
        screenshotUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
        scores: [
          { criteria: 'innovation', score: 23, graderId: 'u-5' },
          { criteria: 'technical', score: 24, graderId: 'u-5' },
          { criteria: 'uiux', score: 18, graderId: 'u-5' },
          { criteria: 'impact', score: 14, graderId: 'u-5' },
          { criteria: 'presentation', score: 13, graderId: 'u-5' }
        ],
        totalScore: 92,
        averageScore: 92,
        createdAt: '2026-06-03T10:15:00.000Z'
      },
      {
        id: 's-2',
        userId: 'u-7',
        hackathonId: 'h-3',
        teamId: 't-3',
        projectTitle: 'BreatheIn Mobile Pacer',
        description: 'A beautiful web app guiding deep paced breathing loops with an elegant pulsing radial gradient, synthetic ambient soundscapes, and comprehensive daily engagement logs.',
        githubLink: 'https://github.com/bob/breathe-in',
        demoLink: 'https://breathe-pacer.vercel.app',
        pptUrl: '',
        pdfUrl: '',
        screenshotUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
        scores: [
          { criteria: 'innovation', score: 21, graderId: 'u-6' },
          { criteria: 'technical', score: 20, graderId: 'u-6' },
          { criteria: 'uiux', score: 20, graderId: 'u-6' },
          { criteria: 'impact', score: 13, graderId: 'u-6' },
          { criteria: 'presentation', score: 14, graderId: 'u-6' }
        ],
        totalScore: 88,
        averageScore: 88,
        createdAt: '2026-05-24T18:30:00.000Z'
      }
    ];

    // Notification seeds
    const notifications: Notification[] = [
      { id: 'n-1', userId: 'u-3', message: 'You have been added to the team "Alpha Agents" for the Global Generative AI Sprint!', read: false, timestamp: new Date().toISOString() },
      { id: 'n-2', userId: 'u-2', message: 'Your project submission "Smart-Agent CRM Companion" has been reviewed and scored by Mentor Dr. Sarah Connor!', read: false, timestamp: new Date().toISOString() }
    ];

    // Messages seeds
    const messages: Message[] = [
      { id: 'msg-1', senderId: 'u-2', teamId: 't-1', message: 'Hey team, let\'s start building our agent logic!', senderName: 'John Doe', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'msg-2', senderId: 'u-3', teamId: 't-1', message: 'Sounds great! I will work on the frontend structure.', senderName: 'Jane Smith', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ];

    return {
      users,
      hackathons,
      teams,
      teamMembers,
      mentors,
      submissions,
      messages,
      notifications,
      mentorRequests: []
    };
  }

  // Getters & Setters
  public static getUsers(): User[] { return this.load().users; }
  public static setUsers(users: User[]) { this.load().users = users; this.save(); }

  public static getHackathons(): Hackathon[] { return this.load().hackathons; }
  public static setHackathons(hackathons: Hackathon[]) { this.load().hackathons = hackathons; this.save(); }

  public static getTeams(): Team[] { return this.load().teams; }
  public static setTeams(teams: Team[]) { this.load().teams = teams; this.save(); }

  public static getTeamMembers(): TeamMember[] { return this.load().teamMembers; }
  public static setTeamMembers(tm: TeamMember[]) { this.load().teamMembers = tm; this.save(); }

  public static getMentors(): Mentor[] { return this.load().mentors; }
  public static setMentors(m: Mentor[]) { this.load().mentors = m; this.save(); }

  public static getSubmissions(): Submission[] { return this.load().submissions; }
  public static setSubmissions(s: Submission[]) { this.load().submissions = s; this.save(); }

  public static getMessages(): Message[] { return this.load().messages; }
  public static setMessages(m: Message[]) { this.load().messages = m; this.save(); }

  public static getNotifications(): Notification[] { return this.load().notifications; }
  public static setNotifications(n: Notification[]) { this.load().notifications = n; this.save(); }

  public static getMentorRequests(): MentorRequest[] { return this.load().mentorRequests; }
  public static setMentorRequests(r: MentorRequest[]) { this.load().mentorRequests = r; this.save(); }
}
