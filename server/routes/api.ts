/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Database } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { User, Hackathon, Team, TeamMember, Mentor, Submission, Message, Notification, MentorRequest } from '../../src/types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_management_system_development_secret_key_123';

// Set up file uploads
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Auth Routes
router.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, role, skills, experience, linkedin, availability } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required' });
      return;
    }

    const users = Database.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const userId = 'u-' + (users.length + 1) + '-' + Math.round(Math.random() * 1000);
    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser: User = {
      id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role,
      createdAt: new Date().toISOString()
    };

    Database.setUsers([...users, newUser]);

    // If roles is mentor, insert mentor profile
    if (role === 'mentor') {
      const mentors = Database.getMentors();
      const mentorId = 'm-' + (mentors.length + 1);
      const newMentor: Mentor = {
        id: mentorId,
        userId: userId,
        skills: skills || 'General Mentoring',
        experience: experience || 'Industry Professional',
        linkedin: linkedin || '',
        availability: availability || 'Flexible availability'
      };
      Database.setMentors([...mentors, newMentor]);
    }

    // Trigger Notification
    const notifications = Database.getNotifications();
    const newNotif: Notification = {
      id: 'n-' + Date.now(),
      userId: userId,
      message: `Welcome, ${name}! Your account has been registered successfully as a ${role}.`,
      read: false,
      timestamp: new Date().toISOString()
    };
    Database.setNotifications([...notifications, newNotif]);

    // Omit password from response
    const { password: _, ...userResponse } = newUser;
    const token = jwt.sign(userResponse, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: userResponse });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const users = Database.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { password: _, ...userResponse } = user;
    const token = jwt.sign(userResponse, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: userResponse });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const users = Database.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { password: _, ...userResponse } = user;
  res.json({ user: userResponse });
});

// Notifications
router.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  const notifs = Database.getNotifications().filter(n => n.userId === req.user!.id);
  // Sort reverse chronological
  res.json(notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
});

router.put('/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res) => {
  const notifs = Database.getNotifications();
  const updated = notifs.map(n => n.id === req.params.id && n.userId === req.user!.id ? { ...n, read: true } : n);
  Database.setNotifications(updated);
  res.json({ success: true });
});

// Hackathons Routes
router.get('/hackathons', (req, res) => {
  const { q, theme, sortBy } = req.query;
  let list = Database.getHackathons();

  if (q) {
    const query = (q as string).toLowerCase();
    list = list.filter(h => h.title.toLowerCase().includes(query) || h.description.toLowerCase().includes(query));
  }

  if (theme) {
    list = list.filter(h => h.theme.toLowerCase().includes((theme as string).toLowerCase()));
  }

  // Sort
  if (sortBy === 'prize') {
    list = list.sort((a, b) => b.prizePool.localeCompare(a.prizePool)); // Simplistic
  } else if (sortBy === 'startDate') {
    list = list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } else {
    // Default newest first
    list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(list);
});

router.post('/hackathons', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { title, description, startDate, endDate, prizePool, theme, rules } = req.body;
    if (!title || !startDate || !endDate) {
      res.status(400).json({ error: 'Title, Start Date, and End Date are required' });
      return;
    }

    const list = Database.getHackathons();
    const id = 'h-' + (list.length + 1);
    const newItem: Hackathon = {
      id,
      title,
      description: description || '',
      startDate,
      endDate,
      prizePool: prizePool || 'TBD',
      theme: theme || 'General',
      rules: rules || 'No plagiarism. Submit clean source files.',
      createdAt: new Date().toISOString()
    };

    Database.setHackathons([...list, newItem]);

    // Send notifications to everyone about the new hackathon!
    const notifications = Database.getNotifications();
    const users = Database.getUsers();
    const newNotifications: Notification[] = users.map(u => ({
      id: 'n-new-hack-' + u.id + '-' + Date.now(),
      userId: u.id,
      message: `New Hackathon Announced! "${title}" begins on ${startDate}. Get your teams together!`,
      read: false,
      timestamp: new Date().toISOString()
    }));
    Database.setNotifications([...notifications, ...newNotifications]);

    res.status(201).json(newItem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hackathons/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const list = Database.getHackathons();
  const index = list.findIndex(h => h.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Hackathon not found' });
    return;
  }
  const updated = { ...list[index], ...req.body };
  list[index] = updated;
  Database.setHackathons(list);
  res.json(updated);
});

router.delete('/hackathons/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const list = Database.getHackathons();
  const filtered = list.filter(h => h.id !== req.params.id);
  Database.setHackathons(filtered);
  res.json({ success: true });
});

// Quick Register / One click Join Hackathon
router.post('/hackathons/:id/join', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const hackathonId = req.params.id;
    const userId = req.user!.id;
    const userName = req.user!.name;

    const hackathons = Database.getHackathons();
    const hackathon = hackathons.find(h => h.id === hackathonId);
    if (!hackathon) {
      res.status(404).json({ error: 'Hackathon not found' });
      return;
    }

    // Check if user is already in a team for this hackathon
    const teams = Database.getTeams();
    const teamMembers = Database.getTeamMembers();

    const userTeams = teamMembers.filter(tm => tm.userId === userId);
    const alreadyRegistered = teams.some(t => t.hackathonId === hackathonId && userTeams.some(ut => ut.teamId === t.id));

    if (alreadyRegistered) {
      res.status(400).json({ error: 'You are already registered for this hackathon in a team!' });
      return;
    }

    // Automatically create a single-member team for them to let them participate immediately
    const teamId = 't-' + (teams.length + 1) + '-' + Date.now().toString().slice(-4);
    const newTeam: Team = {
      id: teamId,
      teamName: `Team ${userName}`,
      description: `Individual team for ${userName} participating in ${hackathon.title}.`,
      maxMembers: 4,
      leaderId: userId,
      hackathonId
    };

    const newMember: TeamMember = {
      id: 'tm-' + (teamMembers.length + 1) + '-' + Date.now().toString().slice(-4),
      teamId,
      userId
    };

    Database.setTeams([...teams, newTeam]);
    Database.setTeamMembers([...teamMembers, newMember]);

    // Send confirmation notification
    const notifications = Database.getNotifications();
    const confirmation: Notification = {
      id: 'n-conf-' + Date.now(),
      userId,
      message: `You registered successfully for "${hackathon.title}" under "${newTeam.teamName}"!`,
      read: false,
      timestamp: new Date().toISOString()
    };
    Database.setNotifications([...notifications, confirmation]);

    res.json({ success: true, team: newTeam });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teams Routes
router.get('/teams', (req, res) => {
  const { hackathonId } = req.query;
  let list = Database.getTeams();
  if (hackathonId) {
    list = list.filter(t => t.hackathonId === hackathonId);
  }
  res.json(list);
});

router.get('/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const teams = Database.getTeams();
  const team = teams.find(t => t.id === teamId);

  if (!team) {
    res.status(404).json({ error: 'Team not found' });
    return;
  }

  // Find members and load details
  const teamMembers = Database.getTeamMembers().filter(tm => tm.teamId === teamId);
  const users = Database.getUsers();
  const membersWithInfo = teamMembers.map(tm => {
    const u = users.find(user => user.id === tm.userId);
    return {
      userId: tm.userId,
      name: u ? u.name : 'Unknown',
      email: u ? u.email : '',
      role: u ? u.role : 'participant'
    };
  });

  const leader = users.find(u => u.id === team.leaderId);
  const hackathons = Database.getHackathons();
  const hackathon = hackathons.find(h => h.id === team.hackathonId);

  res.json({
    ...team,
    members: membersWithInfo,
    leaderName: leader ? leader.name : 'Unknown',
    leaderEmail: leader ? leader.email : '',
    hackathonTitle: hackathon ? hackathon.title : 'General'
  });
});

router.post('/teams', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { teamName, description, maxMembers, hackathonId } = req.body;
    const userId = req.user!.id;

    if (!teamName || !hackathonId) {
      res.status(400).json({ error: 'Team Name and Hackathon selection are required' });
      return;
    }

    const hackathons = Database.getHackathons();
    const hackathon = hackathons.find(h => h.id === hackathonId);
    if (!hackathon) {
      res.status(404).json({ error: 'Selected Hackathon does not exist' });
      return;
    }

    // Check if user is already leading a team or in a team in this hackathon
    const teams = Database.getTeams();
    const teamMembers = Database.getTeamMembers();

    const userTeams = teamMembers.filter(tm => tm.userId === userId);
    const existingParticipation = teams.some(t => t.hackathonId === hackathonId && userTeams.some(ut => ut.teamId === t.id));

    if (existingParticipation) {
      res.status(400).json({ error: 'You are already in a team for this hackathon!' });
      return;
    }

    const teamId = 't-' + (teams.length + 1) + '-' + Date.now().toString().slice(-4);
    const newTeam: Team = {
      id: teamId,
      teamName,
      description: description || '',
      maxMembers: Number(maxMembers) || 4,
      leaderId: userId,
      hackathonId
    };

    const newMember: TeamMember = {
      id: 'tm-' + (teamMembers.length + 1) + '-' + Date.now().toString().slice(-4),
      teamId,
      userId
    };

    Database.setTeams([...teams, newTeam]);
    Database.setTeamMembers([...teamMembers, newMember]);

    res.status(201).json(newTeam);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Invite member to Team (Add in mock/real flow)
router.post('/teams/:id/invite', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const teamId = req.params.id;
    const { email } = req.body;
    const currentUserId = req.user!.id;

    if (!email) {
      res.status(400).json({ error: 'Invite email is required' });
      return;
    }

    const teams = Database.getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team.leaderId !== currentUserId) {
      res.status(403).json({ error: 'Only the team leader can invite members' });
      return;
    }

    const users = Database.getUsers();
    const userToInvite = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userToInvite) {
      res.status(404).json({ error: 'No user found with this email' });
      return;
    }

    const teamMembers = Database.getTeamMembers();
    const existingMembers = teamMembers.filter(tm => tm.teamId === teamId);

    if (existingMembers.length >= team.maxMembers) {
      res.status(400).json({ error: `Team has reached its maximum size limit of ${team.maxMembers} members` });
      return;
    }

    if (teamMembers.some(tm => tm.teamId === teamId && tm.userId === userToInvite.id)) {
      res.status(400).json({ error: 'User is already a member of this team' });
      return;
    }

    // Check if user is already participating in this specific hackathon
    const inThisHackathon = teamMembers.some(tm => {
      const parentTeam = teams.find(t => t.id === tm.teamId);
      return tm.userId === userToInvite.id && parentTeam?.hackathonId === team.hackathonId;
    });

    if (inThisHackathon) {
      res.status(400).json({ error: 'User is already registered for this hackathon in another team' });
      return;
    }

    const newMember: TeamMember = {
      id: 'tm-' + (teamMembers.length + 1) + '-' + Date.now().toString().slice(-4),
      teamId,
      userId: userToInvite.id
    };

    Database.setTeamMembers([...teamMembers, newMember]);

    // Send Notification to Invited User
    const notifications = Database.getNotifications();
    const updateNotifs: Notification[] = [
      ...notifications,
      {
        id: 'n-inv-' + Date.now(),
        userId: userToInvite.id,
        message: `You have been added to the team "${team.teamName}" for the Hackathon by ${req.user!.name}!`,
        read: false,
        timestamp: new Date().toISOString()
      },
      {
        id: 'n-inv-lead-' + Date.now() + 1,
        userId: currentUserId,
        message: `${userToInvite.name} has been added successfully to your team!`,
        read: false,
        timestamp: new Date().toISOString()
      }
    ];
    Database.setNotifications(updateNotifs);

    res.json({ success: true, memberUser: { id: userToInvite.id, name: userToInvite.name, email: userToInvite.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remove Team Member
router.delete('/teams/:id/members/:userId', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const teamId = req.params.id;
    const memberUserId = req.params.userId;
    const currentUserId = req.user!.id;

    const teams = Database.getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Only leader or the user removing themselves can run this
    if (team.leaderId !== currentUserId && memberUserId !== currentUserId) {
      res.status(403).json({ error: 'Unauthorized to remove this member' });
      return;
    }

    // If removing the leader and others exist, leader cannot leave without transfer
    if (memberUserId === team.leaderId) {
      res.status(400).json({ error: 'Team leaders cannot leave without deleting the team or transferring ownership' });
      return;
    }

    const teamMembers = Database.getTeamMembers();
    const filtered = teamMembers.filter(tm => !(tm.teamId === teamId && tm.userId === memberUserId));
    Database.setTeamMembers(filtered);

    // Notify removed user
    const notifications = Database.getNotifications();
    const leftNotif: Notification = {
      id: 'n-member-left-' + Date.now(),
      userId: memberUserId,
      message: `You are no longer a member of team "${team.teamName}".`,
      read: false,
      timestamp: new Date().toISOString()
    };
    Database.setNotifications([...notifications, leftNotif]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Direct Messages & Team Chats
router.get('/teams/:id/messages', authenticateToken, (req: AuthenticatedRequest, res) => {
  const teamId = req.params.id;
  const messages = Database.getMessages().filter(m => m.teamId === teamId);
  res.json(messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
});

router.post('/teams/:id/messages', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const teamId = req.params.id;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const messages = Database.getMessages();
    const newMessage: Message = {
      id: 'msg-' + Date.now(),
      senderId: req.user!.id,
      senderName: req.user!.name,
      teamId,
      message,
      timestamp: new Date().toISOString()
    };

    Database.setMessages([...messages, newMessage]);
    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor Routes
router.get('/mentors', (req, res) => {
  const mentors = Database.getMentors();
  const users = Database.getUsers();

  const joined = mentors.map(m => {
    const u = users.find(user => user.id === m.userId);
    return {
      ...m,
      name: u ? u.name : 'Unknown Mentor',
      email: u ? u.email : ''
    };
  });

  res.json(joined);
});

router.get('/mentor-requests', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const requests = Database.getMentorRequests();
  const teams = Database.getTeams();
  const mentors = Database.getMentors();
  const users = Database.getUsers();

  let filtered = requests;

  if (role === 'mentor') {
    const myMentorProfile = mentors.find(m => m.userId === userId);
    if (!myMentorProfile) {
      res.json([]);
      return;
    }
    filtered = requests.filter(r => r.mentorId === myMentorProfile.id);
  } else {
    // Participant: find requests made by teams the user is in
    const myTeamMembers = Database.getTeamMembers().filter(tm => tm.userId === userId);
    const myTeamIds = myTeamMembers.map(tm => tm.teamId);
    filtered = requests.filter(r => myTeamIds.includes(r.teamId));
  }

  // Inject detail info
  const enriched = filtered.map(r => {
    const team = teams.find(t => t.id === r.teamId);
    const mentor = mentors.find(m => m.id === r.mentorId);
    const mentorUser = mentor ? users.find(u => u.id === mentor.userId) : null;
    return {
      ...r,
      teamName: team ? team.teamName : 'Unknown Team',
      mentorName: mentorUser ? mentorUser.name : 'Unknown Mentor',
      skills: mentor ? mentor.skills : ''
    };
  });

  res.json(enriched);
});

router.post('/mentor-requests', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { teamId, mentorId, message } = req.body;
    if (!teamId || !mentorId) {
      res.status(400).json({ error: 'Team selection and Mentor selection are required' });
      return;
    }

    const requests = Database.getMentorRequests();
    const duplicate = requests.find(r => r.teamId === teamId && r.mentorId === mentorId && r.status === 'pending');
    if (duplicate) {
      res.status(400).json({ error: 'A pending request is already active for this Mentor!' });
      return;
    }

    const id = 'mr-' + Date.now();
    const newRequest: MentorRequest = {
      id,
      teamId,
      mentorId,
      status: 'pending',
      message: message || 'We are requesting assistance on architecture and UI code!',
      createdAt: new Date().toISOString()
    };

    Database.setMentorRequests([...requests, newRequest]);

    // Send mentor notification
    const mentor = Database.getMentors().find(m => m.id === mentorId);
    const team = Database.getTeams().find(t => t.id === teamId);
    if (mentor) {
      const notifications = Database.getNotifications();
      const notification: Notification = {
        id: 'n-mentor-req-' + Date.now(),
        userId: mentor.userId,
        message: `Your guidance was requested by Team "${team ? team.teamName : 'Hackers'}"!`,
        read: false,
        timestamp: new Date().toISOString()
      };
      Database.setNotifications([...notifications, notification]);
    }

    res.status(201).json(newRequest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/mentor-requests/:id', authenticateToken, requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected'
    const requests = Database.getMentorRequests();
    const reqIndex = requests.findIndex(r => r.id === req.params.id);

    if (reqIndex === -1) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const activeRequest = requests[reqIndex];
    activeRequest.status = status;
    Database.setMentorRequests(requests);

    // Notify team leader
    const team = Database.getTeams().find(t => t.id === activeRequest.teamId);
    if (team) {
      const notifications = Database.getNotifications();
      const resNotif: Notification = {
        id: 'n-mentor-status-' + Date.now(),
        userId: team.leaderId,
        message: `Your mentor request has been ${status} by mentor ${req.user!.name}!`,
        read: false,
        timestamp: new Date().toISOString()
      };
      Database.setNotifications([...notifications, resNotif]);
    }

    res.json(activeRequest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Project Submissions and File Uploads
router.get('/submissions', (req, res) => {
  const { hackathonId } = req.query;
  let list = Database.getSubmissions();

  if (hackathonId) {
    list = list.filter(s => s.hackathonId === hackathonId);
  }

  const teams = Database.getTeams();
  const hackathons = Database.getHackathons();
  const enriched = list.map(s => {
    const team = teams.find(t => t.id === s.teamId);
    const hackathon = hackathons.find(h => h.id === s.hackathonId);
    return {
      ...s,
      teamName: team ? team.teamName : 'Unknown Team',
      hackathonTitle: hackathon ? hackathon.title : 'General Hackathon'
    };
  });

  res.json(enriched);
});

// Support full-stack multipart uploads using multer
router.post('/submissions', authenticateToken, upload.fields([
  { name: 'pptFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'screenshotFile', maxCount: 1 },
  { name: 'zipFile', maxCount: 1 }
]), (req: AuthenticatedRequest, res) => {
  try {
    const { projectTitle, description, githubLink, demoLink, hackathonId, teamId, pptUrl, pdfUrl, screenshotUrl, zipUrl } = req.body;

    if (!projectTitle || !hackathonId || !teamId) {
      res.status(400).json({ error: 'Project Title, Hackathon ID, and Team ID are required' });
      return;
    }

    // Double check that team belongs to hackathon and user is member of team
    const team = Database.getTeams().find(t => t.id === teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Build URL strings from uploads or fallback to text fields
    const pptPath = files?.['pptFile'] ? `/uploads/${files['pptFile'][0].filename}` : (pptUrl || '');
    const pdfPath = files?.['pdfFile'] ? `/uploads/${files['pdfFile'][0].filename}` : (pdfUrl || '');
    const screenshotPath = files?.['screenshotFile'] ? `/uploads/${files['screenshotFile'][0].filename}` : (screenshotUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800');
    const zipPath = files?.['zipFile'] ? `/uploads/${files['zipFile'][0].filename}` : (zipUrl || '');

    const submissions = Database.getSubmissions();
    const existingIndex = submissions.findIndex(s => s.teamId === teamId && s.hackathonId === hackathonId);

    const submissionId = existingIndex !== -1 ? submissions[existingIndex].id : 's-' + (submissions.length + 1) + '-' + Date.now().toString().slice(-4);

    const newSubmission: Submission = {
      id: submissionId,
      userId: req.user!.id,
      hackathonId,
      teamId,
      projectTitle,
      description: description || '',
      githubLink: githubLink || '',
      demoLink: demoLink || '',
      pptUrl: pptPath,
      pdfUrl: pdfPath,
      screenshotUrl: screenshotPath,
      zipUrl: zipPath,
      scores: existingIndex !== -1 ? submissions[existingIndex].scores : [],
      totalScore: existingIndex !== -1 ? submissions[existingIndex].totalScore : 0,
      averageScore: existingIndex !== -1 ? submissions[existingIndex].averageScore : 0,
      createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      submissions[existingIndex] = newSubmission;
    } else {
      submissions.push(newSubmission);
    }

    Database.setSubmissions(submissions);

    // Notify team members
    const members = Database.getTeamMembers().filter(tm => tm.teamId === teamId);
    const notifications = Database.getNotifications();
    const alerts = members.map(m => ({
      id: 'n-sub-' + m.userId + '-' + Date.now(),
      userId: m.userId,
      message: `Your team "${team.teamName}" successfully submitted "${projectTitle}"!`,
      read: false,
      timestamp: new Date().toISOString()
    }));
    Database.setNotifications([...notifications, ...alerts]);

    res.status(201).json(newSubmission);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Scoring System (Admin / Mentor)
router.post('/submissions/:id/score', authenticateToken, requireRole(['mentor', 'admin']), (req: AuthenticatedRequest, res) => {
  try {
    const submissionId = req.params.id;
    const { innovation, technical, uiux, impact, presentation } = req.body;

    if (innovation === undefined || technical === undefined || uiux === undefined || impact === undefined || presentation === undefined) {
      res.status(400).json({ error: 'All grading criteria marks (Innovation, Technical Complexity, UI/UX, Impact, Presentation) are required' });
      return;
    }

    const submissions = Database.getSubmissions();
    const index = submissions.findIndex(s => s.id === submissionId);
    if (index === -1) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const submission = submissions[index];
    const graderId = req.user!.id;

    // Replace or add scores for this grader
    const currentScores = submission.scores.filter(sc => sc.graderId !== graderId);
    const parsedScores = [
      { criteria: 'innovation' as const, score: Number(innovation), graderId },
      { criteria: 'technical' as const, score: Number(technical), graderId },
      { criteria: 'uiux' as const, score: Number(uiux), graderId },
      { criteria: 'impact' as const, score: Number(impact), graderId },
      { criteria: 'presentation' as const, score: Number(presentation), graderId }
    ];

    submission.scores = [...currentScores, ...parsedScores];

    // Compute metrics
    // totalScore is the sum of scores for a custom reviewer (max 100) or total grand points
    const graderIds = Array.from(new Set(submission.scores.map(s => s.graderId)));
    let sumTotalScores = 0;

    graderIds.forEach(gid => {
      const gidScores = submission.scores.filter(sc => sc.graderId === gid);
      const gidSum = gidScores.reduce((acc, sc) => acc + sc.score, 0);
      sumTotalScores += gidSum;
    });

    const numGraders = graderIds.length || 1;
    submission.averageScore = Math.round((sumTotalScores / numGraders) * 10) / 10;
    submission.totalScore = Math.round(sumTotalScores / numGraders); // Mean total score

    submissions[index] = submission;
    Database.setSubmissions(submissions);

    // Notify submitting team
    const team = Database.getTeams().find(t => t.id === submission.teamId);
    if (team) {
      const notifications = Database.getNotifications();
      const alert: Notification = {
        id: 'n-score-alert-' + Date.now(),
        userId: team.leaderId,
        message: `Your project "${submission.projectTitle}" has a new review average score of ${submission.averageScore}!`,
        read: false,
        timestamp: new Date().toISOString()
      };
      Database.setNotifications([...notifications, alert]);
    }

    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard Route
router.get('/leaderboard', (req, res) => {
  const { hackathonId, q } = req.query;
  const submissions = Database.getSubmissions();
  const teams = Database.getTeams();
  const hackathons = Database.getHackathons();
  const users = Database.getUsers();

  let list = submissions.map(s => {
    const team = teams.find(t => t.id === s.teamId);
    const hackathon = hackathons.find(h => h.id === s.hackathonId);
    const creator = users.find(u => u.id === s.userId);

    return {
      id: s.id,
      projectTitle: s.projectTitle,
      teamName: team ? team.teamName : 'Unknown Team',
      creatorName: creator ? creator.name : 'Unknown Dev',
      hackathonId: s.hackathonId,
      hackathonTitle: hackathon ? hackathon.title : 'General Hackathon',
      averageScore: s.averageScore,
      totalScore: s.totalScore
    };
  });

  if (hackathonId) {
    list = list.filter(l => l.hackathonId === hackathonId);
  }

  if (q) {
    const query = (q as string).toLowerCase();
    list = list.filter(l => l.projectTitle.toLowerCase().includes(query) || l.teamName.toLowerCase().includes(query));
  }

  // Sort descending by averageScore
  list = list.sort((a, b) => b.averageScore - a.averageScore);

  // Map to include ranks on-the-fly
  const ranked = list.map((item, index) => ({
    rank: index + 1,
    ...item
  }));

  res.json(ranked);
});

// Global Search Route
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    res.json({ users: [], teams: [], hackathons: [], mentors: [] });
    return;
  }

  const query = (q as string).toLowerCase();
  const users = Database.getUsers().filter(u => u.name.toLowerCase().includes(query) && u.role !== 'admin');
  const teams = Database.getTeams().filter(t => t.teamName.toLowerCase().includes(query));
  const hackathons = Database.getHackathons().filter(h => h.title.toLowerCase().includes(query) || h.description.toLowerCase().includes(query));

  const mentorsList = Database.getMentors();
  const matchingMentors = mentorsList.filter(m => {
    const u = Database.getUsers().find(user => user.id === m.userId);
    return (u && u.name.toLowerCase().includes(query)) || m.skills.toLowerCase().includes(query);
  }).map(m => {
    const u = Database.getUsers().find(user => user.id === m.userId);
    return {
      ...m,
      name: u ? u.name : 'Unknown Mentor',
      email: u ? u.email : ''
    };
  });

  res.json({
    users: users.map(({ password, ...u }) => u),
    teams,
    hackathons,
    mentors: matchingMentors
  });
});

// Admin Panel specific endpoints
router.get('/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  const users = Database.getUsers().map(({ password, ...u }) => u);
  res.json(users);
});

router.post('/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const users = Database.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser: User = {
      id: 'u-' + Date.now(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };

    Database.setUsers([...users, newUser]);
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/users/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const users = Database.getUsers();
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = users[index];
    user.name = req.body.name || user.name;
    user.email = (req.body.email || user.email).toLowerCase();
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = bcrypt.hashSync(req.body.password, 10);
    }

    users[index] = user;
    Database.setUsers(users);

    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/users/:id', authenticateToken, requireRole(['admin']), (req, res) => {
  const userId = req.params.id;
  const users = Database.getUsers();
  Database.setUsers(users.filter(u => u.id !== userId));

  // Clean mentor profiles if any
  const mentors = Database.getMentors();
  Database.setMentors(mentors.filter(m => m.userId !== userId));

  // Clean team memberships if any
  const memberships = Database.getTeamMembers().filter(m => m.userId !== userId);
  Database.setTeamMembers(memberships);

  res.json({ success: true });
});

router.get('/admin/analytics', authenticateToken, requireRole(['admin']), (req, res) => {
  const users = Database.getUsers();
  const hackathons = Database.getHackathons();
  const submissions = Database.getSubmissions();

  const totalUsers = users.length;
  const totalHackathons = hackathons.length;
  const totalSubmissions = submissions.length;

  const avgScore = submissions.length > 0 
    ? Math.round((submissions.reduce((acc, s) => acc + s.averageScore, 0) / submissions.length) * 10) / 10 
    : 0;

  // Chart data
  const roleDistribution = {
    participants: users.filter(u => u.role === 'participant').length,
    mentors: users.filter(u => u.role === 'mentor').length,
    admins: users.filter(u => u.role === 'admin').length
  };

  const projectScores = submissions.map(s => ({
    name: s.projectTitle.slice(0, 15) + '...',
    score: s.averageScore
  }));

  res.json({
    totalUsers,
    totalHackathons,
    totalSubmissions,
    averageScore: avgScore,
    charts: {
      roleDistribution,
      projectScores
    }
  });
});

export default router;
