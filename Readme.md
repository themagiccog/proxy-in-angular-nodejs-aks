# NG + 

## Set up Node js

Here is a basic Node.js API using Express that returns "hello" when the `/hello` endpoint is called:

1. First, create a new directory for your project and initialize it with `npm`:

```bash
mkdir my-node-api
cd my-node-api
npm init -y
```

2. Install Express and CORS:

```bash
npm install express cors
```

3. Create a file named `app.js` and add the following code:

```javascript
const express = require('express');
const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
  res.send('api-home');
});

app.get('/hello', (req, res) => {
  res.send('hello-world-there');
});

app.listen(port, () => {
  console.log(`API is running on http://localhost:${port}`);
});


```

4. To run the API, use the following command:

```bash
node app.js
```

5. Now, when you open your browser and navigate to `http://localhost:3000/hello`, it should return the response `hello`.


## Set up the Angular Project
Here’s a step-by-step guide to creating a simple Angular 17 app that consumes the `/hello` endpoint from your Node.js API and displays the response on the homepage.

### 1. Set up the Angular Project

1. Install the Angular CLI globally if you haven't already:

```bash
npm install -g @angular/cli
```

2. Create a new Angular project:

```bash
ng new my-angular-app
cd my-angular-app
```

3. When prompted:
   - Choose routing: Yes
   - Stylesheet format: CSS

### 2. Create a Service to Call the Node.js API

1. Generate a service using Angular CLI to handle the API call:

```bash
ng generate service services/hello
```

2. In the newly created service file `src/app/services/hello.service.ts`, add the following code to fetch data from the `/hello` endpoint:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelloService {

  private apiUrl = 'http://localhost:3000/hello'; // URL of your Node.js API
  //private apiUrl = '/api/hello'; // URL Path when using nginx proxy. // NGINX will forward this to the Node.js API

  constructor(private http: HttpClient) { }

  getHelloMessage(): Observable<string> {
    return this.http.get(this.apiUrl, { responseType: 'text' });
  }
}
```

### 3. Import `HttpClientModule` in `app.config.ts`

Open `src/app/app.config.ts` and import `HttpClientModule` so that the Angular app can make HTTP requests:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http'; //add this provider

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), //add this provider
  ]
};

```

### 4. Fetch and Display the "hello" Message in the Home Component

1. Open `src/app/app.component.ts` and modify it as follows to use the `HelloService` and display the message:

   ```typescript
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


   ```

2. In the template `src/app/app.component.html`, display the `helloMessage` variable:

```html
<div style="text-align:center">
  <h1>Welcome to Angular 17!</h1>
  <h2>{{ helloMessage }}</h2> <!-- This will display the message from the API -->
</div>
```

### 5. Run the Angular App

Make sure both your Node.js API and Angular app are running.

1. Start your Node.js API on port 3000:

```bash
node app.js
```

2. In another terminal, start the Angular development server:

```bash
ng serve
```

3. Open the browser at `http://localhost:4200` to see your Angular app fetching and displaying the message "hello" from the Node.js API.

This setup should work to get the output from the `/hello` endpoint and display it on the Angular homepage.

## Dockerizing
To deploy both your Angular app and Node.js API using Docker Compose, you would need to create Docker containers for each service and define their communication in a `docker-compose.yml` file.

Here’s a step-by-step guide to set up a Docker Compose configuration for the Angular app and Node.js API:

### 1. Dockerize the Node.js API

1. **Create a `Dockerfile` for the Node.js API:**

In the root of your Node.js API project directory, create a file named `Dockerfile` and add the following content:

```Dockerfile
# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the Node.js application
CMD ["node", "app.js"]
```

2. **Build the Node.js Docker Image:**

You can build the Docker image for your Node.js API by running the following command in the Node.js project directory:

```bash
docker build -t my-node-api .
```

### 2. Dockerize the Angular App

0. **Create a `nginx/default.conf` for the Angular app:**
In the root of your Angular app project directory, create a file named `nginx/default.conf` and add the following content:

```conf
# /etc/nginx/conf.d/default.conf

server {
    listen 80;
    server_name localhost;

    # Serve the Angular application
    location / {
        root /usr/share/nginx/html/browser;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Node.js API
    location /api/ {
        # change the proxy_pass depending on the api hostname (e.g. node-api for the docker compose)
        proxy_pass http://node-api-service.proxy-test-ns.svc.cluster.local:3000/;
        # proxy_pass http://node-api:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

1. **Create a `Dockerfile` for the Angular app:**

In the root of your Angular app project directory, create a file named `Dockerfile` and add the following content:

```Dockerfile
# Use an official Node.js runtime as the build environment
FROM node:20 as build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the Angular application code
COPY . .

# Build the Angular application
RUN npm run build --prod

# Use an official NGINX image as the base for serving the Angular app
FROM nginx:alpine

# Use if custom
#COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy the NGINX custom server block configuration file (conf.d/default.conf) to the container
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Remove the default NGINX HTML files 
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular build output to NGINX's default HTML directory
COPY --from=build /usr/src/app/dist/my-angular-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]

```

2. **Build the Angular Docker Image:**

In the Angular project directory, run the following command to build the Docker image:

```bash
docker build -t my-angular-app .
```

### 3. Create a `compose.yml` File

At the root of your project (outside both the Node.js and Angular directories), create a `compose.yml` file to define the services for your Node.js API and Angular app:

```yaml
version: '3'
services:
  node-api:
    build:
      context: ./my-node-api
    container_name: node-api
    ports:
      - '3000:3000'
    networks:
      - my-network
    # # development-purposes
    # volumes:
    #   - ./my-node-api:/usr/src/app

  angular-app:
    build:
      context: ./my-angular-app
    container_name: angular-app
    ports:
      - '80:80'
    networks:
      - my-network
    depends_on:
      - node-api

networks:
  my-network:
    driver: bridge

```

### 4. Modify Angular to Use Node.js API Endpoint

Since the Angular app is running in Docker, it should communicate with the Node.js API through the service name `node-api` defined in the Docker Compose network, not `localhost`.

In `hello.service.ts`, change the API URL to point to the Node.js service within the Docker network:

```typescript
private apiUrl = 'http://node-api:3000/hello'; // Use the service name 'node-api' from Docker Compose
```

### 5. Run Docker Compose

With everything set up, you can now use Docker Compose to spin up both the Angular app and Node.js API containers.

1. Make sure your `compose.yml` file is in the correct directory and run:

```bash
docker compose up --build -d
```
You can log into the container shell , e.g:

```bash
docker exec -it container-name sh
#eg
docker exec -it angular-app sh
```

2. Docker Compose will build both services and run the containers. The Angular app will be accessible on `http://localhost`, and it will communicate with the Node.js API via the internal Docker network.

### 6. Verify the Setup

- Open your browser and go to `http://localhost` to access the Angular app.
- The Angular app should display the "hello" message fetched from the Node.js API.

### 7. Optional: Add Docker Volumes for Development

For development purposes, you can add volumes to the `compose.yml` file to enable hot-reloading for your Node.js API or rebuild the Angular app on changes.

For example, to add a volume for the Node.js API service:

```yaml
volumes:
  - ./my-node-api:/usr/src/app
```

This would sync changes between your local files and the files in the container.

---

This setup should allow you to deploy and run both your Angular app and Node.js API in Docker containers using Docker Compose.



## K8s-rising
Deploying an Angular app and a Node.js API in Kubernetes (K8s) involves several steps. Below is a guide on how to structure your Kubernetes deployment for these two applications.

### Steps Overview:

1. **Containerize the Angular and Node.js apps**: Create Docker images for both applications.
2. **Create Kubernetes resources**:
   - Deployments for both applications.
   - Services for internal communication between them.
   - An Ingress for exposing the Angular app (and possibly the Node.js API) to the outside world.

   Crate k8s in Azure:

```bash
az login
az account set -s "Subscription Name or ID"

# Optional for monitoring
az provider register --namespace Microsoft.Insights
az provider show --namespace Microsoft.Insights --query "registrationState"

# Create Resource Group
az group create -n test-aks-rg -l eastus

# Create ACR
az acr create --resource-group test-aks-rg --name testproxyacr --sku Basic

# Create AKS
az aks create --resource-group test-aks-rg --name test-proxy --node-count 2 --enable-addons monitoring --generate-ssh-keys  --node-vm-size Standard_D2as_v4 [--attach-acr testproxyacr]

# Connect ACR to AKS (if not done above)
az aks update --resource-group test-aks-rg --name test-proxy --attach-acr testproxyacr

# Get AKS FQDN


# Optional: Verify ACR to AKS assignment
az aks check-acr --name test-proxy --resource-group test-aks-rg --acr testproxyacr.azurecr.io
#or
az role assignment list --assignee $(az aks show --resource-group test-aks-rg --name test-proxy --query "identityProfile.kubeletidentity.clientId" -o tsv)

```


3. **Configure NGINX as a reverse proxy**: You may need to configure NGINX to proxy the API requests through the Angular app.

### 1. **Containerize the Angular and Node.js Applications**

#### 1.1 **Prepare Dockerfiles that will be containerized**
You should already have Dockerfiles for both the Angular app and the Node.js API, but let's review them.

##### Dockerfile for Node.js API

```Dockerfile
# Node.js API Dockerfile
# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the Node.js application
CMD ["node", "app.js"]

```

##### Dockerfile for Angular App (with NGINX Proxy for API)

```Dockerfile
# Angular app Dockerfile with NGINX
# Use an official Node.js runtime as the build environment
FROM node:20 as build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the Angular application code
COPY . .

# Build the Angular application
RUN npm run build --prod

# Use an official NGINX image as the base for serving the Angular app
FROM nginx:alpine

# Use if custom
#COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy the NGINX custom server block configuration file (conf.d/default.conf) to the container
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Remove the default NGINX HTML files 
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular build output to NGINX's default HTML directory
COPY --from=build /usr/src/app/dist/my-angular-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]

```

#### 1.2. **Create Docker Images and Push to ACR**
You need to push images to the ACR.

```bash
# Log into ACR
az acr login --name testproxyacr

# Build and push angular app
docker build -t testproxyacr.azurecr.io/my-angular-app:latest ./my-angular-app/
docker push testproxyacr.azurecr.io/my-angular-app:latest

# Build and push node js
docker build -t testproxyacr.azurecr.io/my-node-api:latest ./my-node-api/
docker push testproxyacr.azurecr.io/my-node-api:latest
```

### 2. **Create Kubernetes YAML Definitions**

#### 2.1. Node.js API Deployment and Service

Create a Kubernetes `deployment` and `service` for your Node.js API.

```yaml
# node-api-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-api-deployment
  namespace: proxy-test-ns
  labels:
    app: node-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: node-api
  template:
    metadata:
      labels:
        app: node-api
    spec:
      containers:
      - name: node-api
        image: testproxyacr.azurecr.io/my-node-api:latest # Use your Node.js API Docker image here
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
        ports:
        - containerPort: 3000

---
apiVersion: v1
kind: Service
metadata:
  name: node-api-service
  namespace: proxy-test-ns
spec:
  selector:
    app: node-api
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP

```

#### 2.2. Angular App Deployment and Service

Similarly, create a `deployment` and `service` for the Angular app.

```yaml
# angular-app-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: angular-app-deployment
  namespace: proxy-test-ns
  labels:
    app: angular-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: angular-app
  template:
    metadata:
      labels:
        app: angular-app
    spec:
      containers:
      - name: angular-app
        image: testproxyacr.azurecr.io/my-angular-app:latest # Use your Angular app Docker image here
        ports:
        - containerPort: 80
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"

---
apiVersion: v1
kind: Service
metadata:
  name: angular-app-service
  namespace: proxy-test-ns
spec:
  selector:
    app: angular-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP

```

### 3. **Set Up an Ingress for External Access**

If you're using an NGINX Ingress Controller (or similar), you can set up an Ingress resource to expose the Angular app and route API requests.

#### 3.1. Install NGINX Ingress Controller

If you haven't already installed the NGINX Ingress Controller, you can install it via Helm:

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx -n kube-system  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
# Optional:  to remove
helm uninstall nginx-ingress -n kube-system 
```

#### 3.2. Create an Ingress Resource

Now create an `ingress` resource that exposes your Angular app to the external world and also proxies `/api` requests to the Node.js API.

```yaml
# ingress.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: angular-api-ingress
  namespace: proxy-test-ns
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2  # Capture everything after /api/
spec:
  ingressClassName: nginx
  rules:
  # Go to Azure and get/create FQDN in Public IP and put value here (proxytestangular.eastus.cloudapp.azure.com)
  - host: proxytestangular.eastus.cloudapp.azure.com
    http:
      paths:
      - path: /
        pathType: ImplementationSpecific
        backend:
          service:
            name: angular-app-service
            port:
              number: 80
      - path: /api(/|$)(.*)  # Match /api and everything after it
        pathType: ImplementationSpecific
        backend:
          service:
            name: node-api-service
            port:
              number: 3000

```

- This ingress will route `/api` requests to the `node-api-service` and other requests to the Angular app.
- If you don't have a domain, you can edit your `/etc/hosts` file on your local machine to map a domain (e.g., `angular-app.local`) to your cluster's IP for testing.

### 4. **Deploy to Kubernetes**
0. Create and set namespace:
```bash
kubectl create ns proxy-test-ns
kubectl config set-context --current --namespace proxy-test-ns
```

1. First, apply your Kubernetes manifests:

```bash
kubectl apply -f k8s/node-api-deployment.yaml
kubectl apply -f k8s/angular-app-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

2. Verify that the services and pods are running:

```bash
kubectl config set-context --current --namespace proxy-test-ns
kubectl get pods
kubectl get services
kubectl get ingress
```

### 5. **Verify Your Setup**

- Access your Angular app by visiting `http://proxytestangular.eastus.cloudapp.azure.com` (or your domain/IP).
- The Angular app should display, and when it makes a request to `/api/hello`, it should be routed through the Ingress to the Node.js API service.

### 6. **Optional: Horizontal Pod Autoscaling**

You can set up horizontal pod autoscaling based on metrics like CPU utilization:

```yaml
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: node-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: node-api-deployment
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

Apply this using:

```bash
kubectl apply -f hpa.yaml
```

### Final Thoughts

- **Ingress**: Exposes both the Angular frontend and Node.js API to the outside world while keeping internal services secure.
- **Service**: Kubernetes services handle communication between your pods (e.g., Node.js API and Angular app).
- **Scaling**: You can use `HorizontalPodAutoscaler` for scaling your services dynamically.

This setup will give you a robust way to deploy and manage your Angular app and Node.js API in Kubernetes.

---

### Add Linkerd

To deploy your Angular app and Node.js API in a Kubernetes namespace called `proxy-test-ns` and set up Linkerd for that namespace, follow these steps:

### 1. Make sure `proxy-test-ns` Namespace is created

First, create the `proxy-test-ns` namespace in Kubernetes where both the Angular app and Node.js API will be deployed.

```bash
# check
kubectl get ns
# create if not created
kubectl create namespace proxy-test-ns
```

### 2. Install Linkerd in the Cluster

#### 2.1. Install Linkerd CLI
You can install Linkerd using the official CLI. If you don't have the Linkerd CLI installed yet, do so by running:

Install:
```bash
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
```

Add the linkerd CLI to your path with:
```bash
export PATH=$PATH:/home/gbugu/.linkerd2/bin
```

#### 2.2. Install Linkerd CRD and Control Plane
Install the Linkerd crd in your cluster:

```bash

  linkerd check --pre                     # validate that Linkerd can be installed
  linkerd install --crds | kubectl apply -f - # install the Linkerd CRDs
  linkerd install | kubectl apply -f -    # install the control plane into the 'linkerd' namespace
  linkerd check                           # validate everything worked!
```
You can also obtain observability features by installing the viz extension:
```bash
  linkerd viz install | kubectl apply -f -  # install the viz extension into the 'linkerd-viz' namespace
  linkerd viz check                         # validate the extension works!
  linkerd viz dashboard                     # launch the dashboard
```

### 3. Inject Linkerd into the `proxy-test-ns` Namespace

Once Linkerd is installed, you can "inject" Linkerd into your namespace and workloads. Injecting Linkerd automatically adds sidecar proxies to your deployments, enabling the service mesh functionality.

```bash
kubectl annotate namespace proxy-test-ns linkerd.io/inject=enabled
```

Alternatively, you can inject Linkerd manually for each deployment by adding the following:

```yaml
...
spec:
  template:
    metadata:
      annotations:
        linkerd.io/inject: enabled  # Inject Linkerd
...
```

Optional: Modify crd for v1beta3.
```bash
kubectl get customresourcedefinition.apiextensions.k8s.io/servers.policy.linkerd.io -o yaml > servers-policy-crd.yaml

kubectl apply -f servers-policy-crd.yaml

```

`servers-policy-crd.yaml` is:
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  annotations:
    linkerd.io/created-by: linkerd/cli edge-24.8.2
  name: servers.policy.linkerd.io
spec:
  conversion:
    strategy: None
  group: policy.linkerd.io
  names:
    kind: Server
    listKind: ServerList
    plural: servers
    shortNames:
    - srv
    singular: server
  scope: Namespaced
  versions:
  - name: v1alpha1
    served: true
    storage: false
    deprecated: true
    deprecationWarning: policy.linkerd.io/v1alpha1 Server is deprecated; use policy.linkerd.io/v1beta1 Server
    schema:
      openAPIV3Schema:
        properties:
          spec:
            oneOf:
            - required:
              - podSelector
            - required:
              - externalWorkloadSelector
            properties:
              accessPolicy:
                default: deny
                description: Default access policy to apply when the traffic doesn't
                  match any of the policy rules.
                type: string
              externalWorkloadSelector:
                description: |-
                  Selects ExternalWorkloads in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              podSelector:
                description: |-
                  Selects pods in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              port:
                description: A port name or number. Must exist in a pod spec.
                x-kubernetes-int-or-string: true
              proxyProtocol:
                default: unknown
                description: |-
                  Configures protocol discovery for inbound connections.
                  Supersedes the `config.linkerd.io/opaque-ports` annotation.
                type: string
            required:
            - port
            type: object
        required:
        - spec
        type: object
  - name: v1beta1
    served: true
    storage: false
    deprecated: true
    deprecationWarning: policy.linkerd.io/v1beta1 Server is deprecated; use policy.linkerd.io/v1beta3 Server
    schema:
      openAPIV3Schema:
        properties:
          spec:
            oneOf:
            - required:
              - podSelector
            - required:
              - externalWorkloadSelector
            properties:
              accessPolicy:
                default: deny
                description: Default access policy to apply when the traffic doesn't
                  match any of the policy rules.
                type: string
              externalWorkloadSelector:
                description: |-
                  Selects ExternalWorkloads in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              podSelector:
                description: |-
                  Selects pods in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              port:
                description: A port name or number. Must exist in a pod spec.
                x-kubernetes-int-or-string: true
              proxyProtocol:
                default: unknown
                description: |-
                  Configures protocol discovery for inbound connections.
                  Supersedes the `config.linkerd.io/opaque-ports` annotation.
                type: string
            required:
            - port
            type: object
        required:
        - spec
        type: object
  - name: v1beta2
    served: true
    storage: false
    schema:
      openAPIV3Schema:
        properties:
          spec:
            oneOf:
            - required:
              - podSelector
            - required:
              - externalWorkloadSelector
            properties:
              accessPolicy:
                default: deny
                description: Default access policy to apply when the traffic doesn't
                  match any of the policy rules.
                type: string
              externalWorkloadSelector:
                description: |-
                  Selects ExternalWorkloads in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              podSelector:
                description: |-
                  Selects pods in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              port:
                description: A port name or number. Must exist in a pod spec.
                x-kubernetes-int-or-string: true
              proxyProtocol:
                default: unknown
                description: |-
                  Configures protocol discovery for inbound connections.
                  Supersedes the `config.linkerd.io/opaque-ports` annotation.
                type: string
            required:
            - port
            type: object
        required:
        - spec
        type: object
  - name: v1beta3
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        properties:
          spec:
            oneOf:
            - required:
              - podSelector
            - required:
              - externalWorkloadSelector
            properties:
              accessPolicy:
                default: deny
                description: Default access policy to apply when the traffic doesn't
                  match any of the policy rules.
                type: string
              externalWorkloadSelector:
                description: |-
                  Selects ExternalWorkloads in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              podSelector:
                description: |-
                  Selects pods in the same namespace.
                  The result of matchLabels and matchExpressions are ANDed. Selects all if empty.
                properties:
                  matchExpressions:
                    items:
                      properties:
                        key:
                          type: string
                        operator:
                          enum:
                          - In
                          - NotIn
                          - Exists
                          - DoesNotExist
                          type: string
                        values:
                          items:
                            type: string
                          type: array
                      required:
                      - key
                      - operator
                      type: object
                    type: array
                  matchLabels:
                    type: object
                    x-kubernetes-preserve-unknown-fields: true
                type: object
              port:
                description: A port name or number. Must exist in a pod spec.
                x-kubernetes-int-or-string: true
              proxyProtocol:
                default: unknown
                description: |-
                  Configures protocol discovery for inbound connections.
                  Supersedes the `config.linkerd.io/opaque-ports` annotation.
                type: string
            required:
            - port
            type: object
        required:
        - spec
        type: object
status:
  acceptedNames:
    kind: Server
    listKind: ServerList
    plural: servers
    shortNames:
    - srv
    singular: server
  conditions:
  - lastTransitionTime: "2024-10-24T17:25:58Z"
    message: no conflicts found
    reason: NoConflicts
    status: "True"
    type: NamesAccepted
  - lastTransitionTime: "2024-10-24T17:25:58Z"
    message: the initial names have been accepted
    reason: InitialNamesAccepted
    status: "True"
    type: Established
  storedVersions:
  - v1beta3

```

### 4. Deploy Modified Resources to the `proxy-test-ns` Namespace

Now apply your modified YAML files to deploy the Angular app and Node.js API into the `proxy-test-ns` namespace:

```bash
kubectl apply -f node-api-deployment.yaml
kubectl apply -f angular-app-deployment.yaml
kubectl apply -f ingress.yaml #Optional
```

### 5. Verify Linkerd Setup

Once your applications are running, you can verify that Linkerd is managing your services by running:

```bash
linkerd check --proxy-test-ns
```

You can also visualize the Linkerd dashboard:

```bash
linkerd dashboard
```

This will open up a web-based dashboard where you can monitor your services, see metrics, and understand the health of your service mesh.


To inject **Linkerd** into a specific Kubernetes namespace, follow these steps. Injecting Linkerd into a namespace means that all pods deployed in that namespace will automatically have the Linkerd sidecar proxy injected.

### Option 1: Automatic Injection (Namespace-Wide)

You can annotate a namespace with `linkerd.io/inject=enabled`, which will automatically inject the Linkerd sidecar proxy into all pods created within that namespace.

#### Steps for Automatic Namespace Injection:

1. **Annotate the Namespace**:
   
   Annotate your desired namespace with `linkerd.io/inject=enabled` to enable automatic injection for all pods:

   ```bash
   kubectl annotate namespace <your-namespace> linkerd.io/inject=enabled
   ```

   Replace `<your-namespace>` with the name of your namespace. For example:

   ```bash
   kubectl annotate namespace my-namespace linkerd.io/inject=enabled
   ```

2. **Deploy Pods**:

   Any new pods created in this namespace will automatically have the Linkerd sidecar proxy injected.

3. **Verify Injection**:

   After deploying the pods, you can verify if the Linkerd proxy is injected by checking the pods in the namespace:

   ```bash
   kubectl get pods -n <your-namespace> -o jsonpath="{.items[*].spec.containers[*].name}"
   ```

   This command will list all containers in the pods, and you should see `linkerd-proxy` listed as one of the containers.

### Option 2: Manual Injection (Per Pod or Deployment)

If you don't want to annotate the entire namespace and prefer to inject Linkerd only into specific pods or deployments, you can manually inject Linkerd using the `linkerd inject` command.

#### Steps for Manual Injection:

1. **Get the Deployment YAML**:

   Export the YAML of the deployment or pod that you want to inject with Linkerd:

   ```bash
   kubectl get deployment <deployment-name> -n <your-namespace> -o yaml > deployment.yaml
   ```

2. **Inject Linkerd Proxy**:

   Inject the Linkerd sidecar proxy into the deployment YAML file:

   ```bash
   linkerd inject deployment.yaml | kubectl apply -f -
   ```

   This will add the necessary Linkerd annotations to the deployment and apply it back to the cluster.

3. **Verify Injection**:

   Check that the Linkerd proxy has been injected by listing the containers in the pod:

   ```bash
   kubectl get pods -n <your-namespace> -o jsonpath="{.items[*].spec.containers[*].name}"
   ```

   You should see `linkerd-proxy` listed as one of the containers.

### Option 3: Injecting Linkerd on Pod Creation (kubectl run)

If you're using `kubectl run` to create a pod, you can inject Linkerd by piping the output to the `linkerd inject` command:

```bash
kubectl run <pod-name> --image=<image-name> --dry-run=client -o yaml | linkerd inject - | kubectl apply -f -
```

### Summary of Options

1. **Automatic Injection** (Namespace-Wide):
   - Annotate the namespace with `linkerd.io/inject=enabled`.
   - All new pods in the namespace will be automatically injected with the Linkerd proxy.

2. **Manual Injection** (Per Pod or Deployment):
   - Manually inject specific deployments by exporting their YAML, injecting Linkerd, and applying the updated YAML.

3. **Inject on Creation**:
   - Use `kubectl run` with `linkerd inject` to create a pod with Linkerd injected from the start.

Let me know if you need more help with Linkerd injection!