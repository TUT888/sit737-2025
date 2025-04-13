# SIT737 - 2025 - Task 6P

In this task, we will create a Kubernetes Cluster for a containerized application.

In general, the activities includes:
- Containerization
- Kubernetes Cluster setup
- Kubernetes Deployment and Service

Detailed step-by-step instructions provided below.

![workload](image.png)


## Containerization
1. Create a [Dockerfile](./Dockerfile) in the [project](./project) folder
    - Specify the node version
    - Define the path to the application
    - Copy all dependencies requirements from package*.json to current path
    - Use `RUN npm install` to install all requirements
    - Bundle the app source (`index.js`)
    - Expose the app to specified port, and add run command for the image
2. Build the Docker image named `prac6p-service` from the resources in the [project](./project) folder
    ```
    docker build -t prac6p-service ./project
    ```
3. Run the container to ensure it works correctly
    ```
    docker run -p 3040:3040 prac6p-service
    ```
4. Tag and push the image to DockerHub
    ```
    docker tag prac6p-service tut888/sit737-prac6p-service
    docker push tut888/sit737-prac6p-service
    ```

## Kubernetes Cluster setup
1. Activate Hyper-V:
    
    **Control Panel** > **Turn Windows Features On or Off** > **Select Hyper-V**

2. Install and enable Kubernetes:

    **Start Docker** > **Setting** > **Kubernetes** > **Enable Kubernetes** > **Apply and Restart**

3. Deploy the Dashboard UI:
    ```
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
    ```

4. Initialize `.yaml` files to:
    - Create sample user: [dashboard-adminuser.yaml](./dashboard-adminuser.yaml)
    - Create Cluster Role Binding: [cluster_role_binding.yaml](./cluster_role_binding.yaml)

5. Apply the `.yaml` files:
    ```
    kubectl apply -f dashboard-adminuser.yaml
    kubectl apply -f dashboard-adminuser.yaml
    ```

## Kubernetes Deployment and Service
1. Login to Dashboard
    1. Launch the dashboard (serving on localhost:8001 by default)
        ```
        kubectl proxy
        ```
    2. Create login token for created user
        ```
        kubectl -n kubernetes-dashboard create token admin-user
        ```
    3. Copy the generated token to login and access the dashboard using below URL:

        `http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/`
2. Initialize `.yaml` files to:
    - Create pod: [createPod.yaml](./createPod.yaml)
    - Create replica set: [createReplicaSet.yaml](./createReplicaSet.yaml)
    - Create deployment: [createDeployment.yaml](./createDeployment.yaml)
    - Create service: [createService.yaml](./createService.yaml)
3. Apply the `.yaml` files:
    ```
    kubectl apply -f createPod.yaml
    kubectl apply -f createReplicaSet.yaml
    kubectl apply -f createDeployment.yaml
    kubectl apply -f createService.yaml
    ```
