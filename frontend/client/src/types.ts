export interface Club {
  id: number;
  name: string;
  description: string;
  coordinatorId: number | null;
  coordinatorName: string;
  memberCount: number;
  joined: boolean;
  pendingRequest?: boolean;
  canManage: boolean;
}

export interface ClubMember {
  userId: number;
  name: string;
  department: string;
  semester: string;
  aadhaarMasked: string;
  joinedAt: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  capacity: number;
  clubId: number | null;
  clubName: string;
  createdByName: string;
  registrationCount: number;
  spotsLeft: number;
  registered: boolean;
  isPast: boolean;
  canManage: boolean;
}

export interface Registration {
  userId: number;
  name: string;
  department: string;
  semester: string;
  registeredAt: string;
}

export interface Booking {
  id: number;
  start: string;
  end: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  mine: boolean;
  bookedBy: string;
}

export interface Seat {
  id: number;
  code: string;
  floor: string;
  status?: string;
  bookings: Booking[];
}

export interface MyBooking {
  id: number;
  date: string;
  start: string;
  end: string;
  seatCode: string;
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface ReservationRequest extends MyBooking {
  userId: number;
  studentName: string;
  department: string;
  semester: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  skillsNeeded?: string;
  department: string;
  status: 'proposed' | 'approved' | 'rejected';
  remark: string;
  leadName: string;
  supervisorName: string;
  memberCount: number;
  myRole: string | null;
  pendingRequest: boolean;
  canManage: boolean;
}

export interface TeamMember {
  userId: number;
  name: string;
  department: string;
  role: string;
}

export interface Task {
  id: number;
  title: string;
  assigneeId: number | null;
  assigneeName: string;
  dueDate: string;
  progress: number;
  status: string;
}

export interface JoinRequest {
  id: number;
  userId: number;
  name: string;
  department: string;
  applicantSkills?: string;
}

export interface ProjectDetail {
  project: Project;
  members: TeamMember[];
  tasks: Task[];
  joinRequests: JoinRequest[];
  canManage: boolean;
  isMember: boolean;
}

export interface Stats {
  students: number;
  faculty: number;
  clubs: number;
  upcomingEvents: number;
  seats: number;
  bookingsToday: number;
  projects: number;
  approvedProjects: number;
}
