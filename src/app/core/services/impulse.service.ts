import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ImpulseQueryPayload, ImpulseTodayResponse } from '../models/impulse.models';

@Injectable({ providedIn: 'root' })
export class ImpulseService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTodayImpulse(localDate: string, currentTime: string): Observable<ImpulseTodayResponse> {
    const params = new HttpParams().set('localDate', localDate).set('currentTime', currentTime);
    return this.http.get<ImpulseTodayResponse>(`${this.apiUrl}${API_ENDPOINTS.impulse.today}`, { params });
  }

  completeAction(actionId: string, payload: ImpulseQueryPayload): Observable<ImpulseTodayResponse> {
    return this.http.patch<ImpulseTodayResponse>(
      `${this.apiUrl}${API_ENDPOINTS.impulse.complete(actionId)}`,
      payload
    );
  }
}
