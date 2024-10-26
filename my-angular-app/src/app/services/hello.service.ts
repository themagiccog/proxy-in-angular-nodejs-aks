import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelloService {

  //private apiUrl = 'http://localhost:3000/hello'; // URL Path when deploying local
  private apiUrl = '/api/hello'; // URL Path when using nginx proxy (container)

  constructor(private http: HttpClient) { }

  getHelloMessage(): Observable<string> {
    console.log('URL: ' + this.apiUrl);
    return this.http.get(this.apiUrl, { responseType: 'text' });
  }
}
