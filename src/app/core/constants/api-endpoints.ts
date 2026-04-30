export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me'
  },
  users: {
    timezone: '/users/me/timezone',
    reminders: '/users/me/reminders'
  },
  programs: {
    list: '/programs',
    missions: (programId: string) => `/programs/${programId}/missions`,
    interest: (programId: string) => `/programs/${programId}/interest`
  },
  userPrograms: {
    start: '/user-programs/start',
    active: '/user-programs/active'
  },
  dashboard: {
    today: '/dashboard/today'
  },
  missions: {
    complete: '/missions/today/complete',
    fail: '/missions/today/fail',
    mood: '/missions/today/mood'
  },
  progress: {
    summary: '/progress/summary'
  },
  impulse: {
    today: '/impulse/today',
    complete: (actionId: string) => `/impulse/actions/${actionId}/complete`
  },
  suggestions: {
    create: '/suggestions'
  },
  leaderboard: {
    me: '/leaderboard/me',
    global: '/leaderboard/global'
  }
} as const;
