
# SIT737 - 2025 - Task 10.1P

> The program source code, Docker image and deployment config files in this task is using the node application from **Task 6.1P** at: [TUT888/sit737-2025/tree/prac6p](https://github.com/TUT888/sit737-2025/tree/prac6p)

In this task, we will deploy simple node.js application to Google Cloud Platform (GCP). 
- The Node.js application is containerized with Docker and Kubernetes 
- Deploy the containerized application to a GCP Kubernetes Cluster
- Apply monitoring and visibility tools to collect and analyse metrics and logs

# Table of Contents
- [Application development and Containerization](#application-development-and-containerization)
- [Google Cloud Platform Deployment](#google-cloud-platform-deployment)
    - [GCP Kubernetes Cluster setup](#gcp-kubernetes-cluster-setup)
    - [Apply Deployment and Service](#apply-deployment-and-service)
    - [Check the running pods and services](#check-the-running-pods-and-services)
- [Monitoring the application](#monitoring-the-application)
    - [Monitoring in the Cloud Console Web UI (requires permission)](#monitoring-in-the-cloud-console-web-ui)
    - [Monitoring with commands](#monitoring-with-commands)
- [Project clean up](#project-clean-up)

Detailed step-by-step instructions provided below.

# Application development and Containerization
The development process and containerization was completed since **Task 6.1P** at: [TUT888/sit737-2025/tree/prac6p](https://github.com/TUT888/sit737-2025/tree/prac6p)

In Task 6.1P, the application was containerized and pushed to Docker Hub. 

Therefore, instead of pushing the image to GCP container registry, we can login to Docker Hub and directly pull the docker image to complete the deployment. 

# Google Cloud Platform Deployment
## GCP Kubernetes Cluster setup
> Prerequisite:
> - Google Cloud Console account & project setup
> - Google Cloud SDK Shell installed and configured in our computer
>
> These activities have already completed from **Task 5.2D** at [TUT888/sit737-2025/tree/prac5d](https://github.com/TUT888/sit737-2025/tree/prac5d)

For GCP deployment, we can either use the remote Cloud Console or Google Cloud SDK Shell in our computer. In my case, I use the Google Cloud SDK Shell, following below steps:

**Login**
- Open Google Cloud SDK Shell
- Login to get access to cloud and target project
    ```bash
    gcloud auth login
    gcloud config set project <YOUR-PROJECT-ID> # Ex: sit737-25t1-fname-lname-xxxxxx
    gcloud config set compute/zone <YOUR-COMPUTE-ZONE> # Ex: australia-southeast1-b
    ```

**Create Kubernetes Cluster**

We can create a Kubernetes Cluster by providing its name, number of nodes and the compute zone. In this case, our cluster has:
- Name: `simple-k8s-cluster`
- Number of nodes: 1 node (one virtual machine/instance) per zone. If we set `--num-nodes=3`, GCP would spin up 3 virtual machines (nodes), allowing your workloads to be distributed across them for high availability, scalability, and resilience.

The command would be
```bash
gcloud container clusters create simple-k8s-cluster --num-nodes=1 --zone=australia-southeast1-b
```

After successfully created a cluster, we confirm it by listing all cluster with:
```bash
gcloud container clusters list
```

**Authenicate the cluster**

Before using, we must authenticate `kubectl` with the newly created cluster by getting credential with following command:
```bash
gcloud container clusters get-credentials simple-k8s-cluster --location=australia-southeast1-b
```

## Apply Deployment and Service
Continue using our Google Cloud SDK Shell, we go to the project directory where we store the deployment `.yaml` files
```bash
cd <YOUR-PROJECT-LOCATION>
```

Apply deployment and service configs
```bash
kubectl apply -f createDeployment.yaml
kubectl apply -f createService.yaml
```

## Check the running pods and services
**Check the running pods**

If you have 3 replicas specified in deployment yaml, you should see 3 pods are running with following commands
```bash
kubectl get pods
```

**Check the running services**
```bash
kubectl get services
```
The Cloud Shell should return a table like:
| NAME | TYPE | CLUSTER-IP | EXTERNAL-IP | PORT(S) | AGE |
| --- |  --- |  --- |  --- |  --- |  --- | 
| kubernetes | ClusterIP | 11.222.224.1 | none | 443/TCP | 15m |
| simple-app-service | LoadBalancer | 11.222.234.210 | **pending** | 3040:31503/TCP | 9s |

After the `EXTERNAL-IP` complete loading, it should show the IP address, which is accessible through our browser. 

For example, if the `EXTERNAL-IP` shows 11.222.3.101, we  can access our application with:
```
http://11.222.3.101:3040/add?n1=1&n2=3
```

**Then the deployment is completed!**

# Monitoring the application
## Monitoring in the Cloud Console Web UI
Google Cloud Platform provides UI for monitoring our deployed application.
1. Go to Google Cloud Console
2. On the left side navigation bar, locate and go to the Monitoring tab
3. On the navigation bar, select Metrics Explorer
4. Choose Resource Type as Kubernetes Container
5. Choose the metrics and visualisation type you want to explore. For example
    - kubernetes.io/container/cpu/request_utilization
    - kubernetes.io/container/memory/request_utilization

**Note: In this task, since I don't have the permission to set the *Resource Type* to *Kubernetes Container*, the monitoring will be done using the commands in next section**

## Monitoring with commands
**View resource usage**
Get CPU and memory usage with `kubectl top`. In this case, `default` namespace is used for all resources unless you specify a different one
```bash
kubectl top pod --namespace=default
```

View pod-level network traffic (packets, bytes)
```bash
kubectl describe pod <POD-NAME> --namespace=default
```

View cluster-level resource usage
```bash
kubectl top nodes
```

**View the logs**
```bash
kubectl logs <POD-NAME>
```
If the application has log configuration (like in my `project/index.js` file), the command should print the logs as follow
> Hello, I am listening to 3040<br>
> http://localhost:3040/<br>
> info: Parameters 1 and 3 received for addition {"service":"calculator-microservice"}<br>
> info: Parameters 1 and 3 received for subtraction {"service":"calculator-microservice"}<br>
> info: Parameters 1 and 3 received for division {"service":"calculator-microservice"}

# Project clean up
If we are not using the app anymore, we would want to delete the deployment to prevent extra cost:
- GCP charges for each external IP used by a LoadBalancer (even if the service is idle)
- Charges stop only when you delete the LoadBalancer-type service .

To stop the service:
- Identify the service with 
    ```bash
    kubectl get service
    ```
- Get ther service name and delete it with 
    ```bash
    kubectl delete service <YOUR-SERVICE-NAME>
    ```
To free all other resources:
```bash
# Delete the deployment
kubectl delete deployment <YOUR-DEPLOYMENT-NAME>

# Delete entire cluster (will remove all workloads and charges)
gcloud container clusters delete <YOUR-CLUSTER-NAME> --zone <YOUR-ZONE>
```