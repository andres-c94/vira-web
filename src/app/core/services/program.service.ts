import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Program, ProgramInterestResponse, ProgramMission } from '../models/program.models';

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getPrograms(): Observable<Program[]> {
    return this.http.get<Program[]>(`${this.apiUrl}${API_ENDPOINTS.programs.list}`);
  }

  getProgramMissions(programId: string): Observable<ProgramMission[]> {
    return this.http.get<ProgramMission[]>(`${this.apiUrl}${API_ENDPOINTS.programs.missions(programId)}`);
  }

  registerInterest(programId: string): Observable<ProgramInterestResponse> {
    return this.http.post<ProgramInterestResponse>(`${this.apiUrl}${API_ENDPOINTS.programs.interest(programId)}`, {});
  }
}
