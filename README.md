# SIT737 - 2025 - Task 6.2C

This task is **extended from** [Task 6.1P](https://github.com/TUT888/sit737-2025/tree/prac6p) to interact with Kubernetes.

Additionally, unlike Task 6.1P, this task added `imagePullPolicy: Never` in `containers` section to use a local image, avoiding the extra step of pulling the image from Docker Hub.

In general, the activities includes:
- Interact with the Deployed Application
    - Verify the application is running or not
    - Forward traffic from local port to Kubernetes service
    - Access the applcation
- Update the application and redeploy

Detailed step-by-step instructions provided below.

![workload](image.png)


## Interact with the Deployed Application
1. To verify the running pods and services, use following commands:
    ```
    kubectl get pods
    kubectl get services
    ```
2. To forward the traffic from local port to Kubernetes service, use following command:
    ```
    kubectl port-forward service/<service-name> <local-port>:<service-port>
    ```
    *Note: The `<service-name>` and `service-port` is specified in `createService.yaml`, or we can double check it by using `kubectl get services` command.*
    ```
    // Example
    kubectl port-forward service/prac6c-service 8080:3000
    ```
3. The application is now accessible on our computer through `localhost:8080`.

    Try the API: `localhost:8080/add?n1=1&n2=2
    
## Update the application and redeploy
1. Modify the `index.js` file to adopt new feature. In this case, I added a new logarithm mathematics API.
2. Rebuild the docker image with new tag. In this case, I used `plus`:
    ```
    docker build -t prac6-service:plus ./project
    ```
3. Update the image tag in `createDeployment.yaml` file, changing from `prac6-service:latest` to `prac6-service:plus`
4. Re-apply the config file to make changes to the running container
    ```
    kubectl apply -f createDeployment.yaml
    ```
5. Try new API: `localhost:8080/log?n1=5`