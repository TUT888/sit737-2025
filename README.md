# SIT737 - 2025 - Task 6.2C

This task is **extended from** [Task 6.2C](https://github.com/TUT888/sit737-2025/tree/prac6c) to adopt mongodb to our application.

# Overview
## About the project directory tree
- **/**: all new config files added for mongodb
- **/project**: includes the project source code with `Dockerfile` and `docker-compose.yaml`
- **/app-deployment**: includes the project kubernetes config files (`.yaml`) from previous task (Task 6.2C)

## Table of contents
In general, the activities includes:
1. [Creating database for my application](#creating-database-for-my-application)
    1. [Configure persistent storage](#configure-persistent-storage)
    2. [Create mongodb user](#create-mongodb-user)
2. [Adding database to my application](#adding-database-to-my-application)
    1. [Application setup based on previous Task 6.2C](#application-setup-based-on-previous-task-62c)
    2. [Update the application (MongoDB + CRUD support) and rebuild docker image](#update-the-application-mongodb--crud-support-and-rebuild-docker-image)
    3. [Reapply deployment and test the deployement for CRUD operation](#reapply-deployment-and-test-the-deployement-for-crud-operation)
3. [Backup and monitor](#backup-and-monitor)
    1. [Set up database backups](#set-up-database-backups)
    2. [Monitor the MongoDB database](#monitor-the-mongodb-database)
3. [Clean up (optional)](#clean-up-optional)

# Detail step-by-step
## Creating database for my application
### Configure persistent storage
With defined yaml config files, run below commands to apply all configuration

```bash
# Configure persistent storage
kubectl apply -f createStorageClass.yaml
kubectl apply -f createPersistentVolume.yaml
kubectl apply -f createPersistentVolumeClaim.yaml

# Create Kubernetes secrets
kubectl apply -f createMongoSecret.yaml

# Create deployment and service
kubectl apply -f createMongoDeployment.yaml
kubectl apply -f createMongoService.yaml
```

### Create mongodb user
To create mongodb user, we can either init it together with database, or manually add new user after database is created.

In this case, because I already have databased initialized before, so I will create new user manually with following steps:
- Use temporary Mongoclient pod with shell access:
    - The admin username and password (defined in `createMongoSecret.yaml`)
    - The mongo service name (defined in `createMongoService.yaml`). In this case, I named it as `prac9p-mongo-svc`
    ```bash
    # Run in one command
    kubectl run mongo-client --rm -it --image=mongo:5.0 --restart=Never -- mongo "mongodb://<ADMIN_USERNAME>:<ADMIN_PASSWORD>@<MONGO_SERVICE>:27017/?authSource=admin"

    # Divided into 2 commands
    kubectl run mongo-client --rm -it --image=mongo:5.0 --restart=Never -- bash
    mongo "mongodb://<ADMIN_USERNAME>:<ADMIN_PASSWORD>@<MONGO_SERVICE>:27017/?authSource=admin
    ```
- Inside the Mongoclient pod, use the database and create new user:
    ```bash
    # Access the database
    use cloud-prac9p

    # Create new user with authenticated read and write
    db.createUser({
      user: "samplemongouser",
      pwd: "samplesecurepw",
      roles: [
        {
          role: "readWrite",
          db: "cloud-prac9p"
        }
      ]
    });
    ```

After setting up mongodb and user, we can either access the `cloud-prac9p` database with created user or admin role. For example, inside our application (or env setup):
```js
// If use created account
MONGO_URI = `mongodb://${USERNAME}:${PASSWORD}@${SERVICE_NAME}:27017/cloud-prac9p?authSource=cloud-prac9p` 

// If use the admin account
MONGO_URI = `mongodb://${ADMIN_USERNAME}:${ADMIN_PASSWORD}@${SERVICE_NAME}:27017/cloud-prac9p?authSource=admin` 
```

## Adding database to my application
### Application setup based on previous Task 6.2C
To avoid confusion, I create new service for task 9.1P based on task 6.2c.

**Create service configuration for prac9p**

Previous configurations are described as below:
- File: `createDeployment.yaml`
    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: prac9p-deployment
    spec:
    replicas: 1
    selector:
      matchLabels:
      app: myapp-9p # Deployment uses this to manage matching pods
    template:
      metadata:
      labels:
        app: myapp-9p # Apply this label to each created pod
      spec:
      containers:
      - name: node-cal-service
        image: prac6-service:plus # Use the previous image for now, make sure this deployment file is working
        imagePullPolicy: Never
        ports:
        - containerPort: 3040
    ```
- File: `createService.yaml`
    ```yaml
    apiVersion: v1 
    kind: Service 
    metadata: 
    name: prac9p-service 
    spec: 
    type: LoadBalancer
    selector:
      app: myapp-9p # Service will route traffic to Pods with this label
    ports: 
      - port: 3001 # Avoid conflict with previous service in prac6c
        targetPort: 3040
        nodePort: 30080
    ```

**Apply deployment and service**
- Apply all config yaml:
  ```bash
  kubectl apply -f createDeployment.yaml
  kubectl apply -f createService.yaml
  ```
- Check if the service is running by forward the port to local port
  ```bash
  kubectl port-forward service/prac9p-service 8080:3001
  ```
  Access the service via: `localhost:8080/log?n1=5`

### Update the application (MongoDB + CRUD support) and rebuild docker image
1. Modify the **project/index.js** file to add database storage option. In this case, I mongodb to store calculation history logs from user.
    - Mongo connect:
        ```js
        require('dotenv').config();
        const { MongoClient } = require('mongodb');

        const uri = process.env.MONGO_URI;
        const client = new MongoClient(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        client.connect()
              .then(() => {
                console.log("Connected to MongoDB")
              })
              .catch((err) => {
                console.error("Unable to connect to MongoDB: ", err);
              });

        const db = client.db();
        const collection = db.collection("calculation-history");
        ```
    - Add CRUD feature for the app:
      - [C]reate: store calculation servie when received calculation request from user. Ex: `http://localhost:3040/add?n1=1&n2=2`
      - [R]ead: get all calculation history. Ex: `http://localhost:3040/`
      - [U]update: update n1 or n2 or operation for calculation history. Ex: `http://localhost:3040/update/6821da2a151b948989e10d52?n1=33&n2=22&op=sub`
      - [D]elete: clear all history. Ex: `http://localhost:3040/clear`
      
2. Rebuild the docker image with new tag. In this case, I use the name `prac9p-service` and tag `mongo`:
    ```
    docker build -t prac9p-service:mongo ./project
    ```

### Reapply deployment and test the deployement for CRUD operation
1. Update the the `createDeployment.yaml` 
    - Update the image name, changing from `prac6-service:plus` to `prac9p-service:mongo`
    - Update the environment variable under the `containers` section
        ```yaml
        # ...
        containers:
          # ...
          env:
          - name: MONGO_USER
            valueFrom:
              secretKeyRef:
                name: prac9p-mongo-secret
                key: mongo-user  # App gets MongoDB username from Secret
          - name: MONGO_PASSWORD
            valueFrom:
              secretKeyRef:
                name: prac9p-mongo-secret
                key: mongo-password  # App gets MongoDB password from Secret
          - name: MONGO_URI
            value: "mongodb://$(MONGO_USER):$(MONGO_PASSWORD)@prac9p-mongo-svc:27017/cloud-prac9p?authSource=admin"
        ```
2. Re-apply the config file to make changes to the running container
    ```
    kubectl apply -f createDeployment.yaml
    ```
3. Port forwarding:
    ```bash
    kubectl port-forward service/prac9p-service 8080:3001
    ```
4. Try API with CRUD feature with the forwarded port (8080): 
    - Create: `http://localhost:8080/add?n1=1&n2=2`
    - Read: `http://localhost:8080/`
    - Update: `http://localhost:8080/update/<ObjID>?n1=33&n2=22&op=sub` (replace the ObjID with your history id got from READ endpoint)
    - Delete: `http://localhost:8080/clear`

## Backup and monitor
### Set up database backups
To backup database, we can use `mongodump` in Kubernetes Job or CronJob
- **Job** is for manual backups. A Job runs once when we apply it.
- **CronJob** is for automated/scheduled backups. CronJob will run a Job at regular intervals based on the provided schedule.

Since I use local storage, the demonstration will use manual backup to avoid low-on-space issues.
- Create a new `mongoBackup.yaml` and apply the change:
    ```bash
    kubectl apply -f mongoBackup.yaml
    ```
- If we want to run it again, delete the Job and re-apply:
    ```bash
    kubectl delete job mongo-backup-manual
    kubectl apply -f mongoBackup.yaml
    ```

Later if we want to restore our database, we run a Job with `mongorestore` and point it to our backup folder specified in `mongoBackup.yaml`.

### Monitor the MongoDB database
To monitor the MongoDB database, we can use the Kubernetes Dashboard or run following commands:
- Get the mongodb pod name:
    ```bash
    kubectl get pods
    ```
- Copy the pod name and describe it:
    ```bash
    kubectl describe pod <pod-name-with-id>
    ```
- If you want to log the detail, use the log command:
    ```bash
    kubectl logs <pod-name-with-id>
    ```

## Clean up (optional)
If you want to remove all changes, use the `delete` command with the pod name. 

For example, if you want to delete the persistent volume, use:
```bash
kubectl delete pv prac9p-mongo-pv
```
