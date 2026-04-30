export interface User {
  id: string;
  email: string;
  timezone: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
}

export interface UpdateTimezonePayload {
  timezone: string;
}

export interface UpdateReminderSettingsPayload {
  reminderEnabled: boolean;
  reminderTime: string | null;
}
