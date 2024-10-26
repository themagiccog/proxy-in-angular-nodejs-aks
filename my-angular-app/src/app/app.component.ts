import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HelloService } from './services/hello.service';
import { Subscription } from 'rxjs'; // Import the Subscription class

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  helloMessage: string = '';
  private helloMessageSubscription!: Subscription; // Track the subscription

  constructor(private helloService: HelloService) {}

  ngOnInit(): void {
    // Manually subscribing to the observable
    this.helloMessageSubscription = this.helloService.getHelloMessage().subscribe({
      next: (message: string) => {
        this.helloMessage = message;
      },
      error: (error: any) => {
        console.error('Error fetching message:', error);
      },
      complete: () => {
        console.log('Subscription completed');
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.helloMessageSubscription) {
      this.helloMessageSubscription.unsubscribe();
    }
  }
}
