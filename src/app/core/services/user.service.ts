import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { UpdateReminderSettingsPayload, UpdateTimezonePayload, User } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  updateTimezone(payload: UpdateTimezonePayload): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${API_ENDPOINTS.users.timezone}`, payload);
  }

  updateReminderSettings(payload: UpdateReminderSettingsPayload): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}${API_ENDPOINTS.users.reminders}`, payload);
  }
}
