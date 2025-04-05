# SIT737 - 2025 - Prac 5d

## About the project
This project is for Task 5.2D - Publishing the microservice into the cloud.

This practical exercicse demonstrates the process of publishing a local **Docker** image to **Google Cloud Platfrom** using **Artifact Registry**. 

The step-by-step instructions is provided below.

## Step-by-step instructions
### Containerize the application
1. Prepare a `Dockerfile` and `docker-compose.yml`
2. Containerize the application
    - With `Dockerfile`
      ```
      docker build -t your-image-name .
      ```
    - With `docker-compose.yml`
      ```
      docker compose up
      ```

### Setup Google Cloud registry/repository
1. Access the Google Cloud Platform and login with Google account
2. Go to your project or create a new one
3. Create a new repository in **Artifact Registry**, choosing Docker format with Standard mode

### Setup Google Cloud CLI in our computer
1. Download and install the Google Cloud CLI
2. Configure the CLI using one of following option:
    - Run `gcloud init` to config all at once
      - Login to your google account by following the instruction
      - Choose the target project you working with
      - Configure the default region (optional)
    - Run following command to config
      - To login, use `gcloud auth login`
      - To set working project, use `gcloud config set project <your-project>`

### Authenticate to a repository
1. Google Cloud CLI Credential Helper
    - List all hostnames in the helper
      ```bash
      gcloud auth configure-docker
      ```
    - Add target hostname (current region) to the Docker configuration file
      ```bash
      gcloud auth configure-docker <the-repo-region>-docker.pkg.dev
      ```
2. Enable the container registry service
    ```bash
    gcloud services enable containerregistry.googleapis.com 
    ```

### Publish the container to the registry
After creating the Google Cloud repository, we should be provided the path to the repo with this format: `LOCATION-docker.pkg.dev/PROJECT-ID/REPOSITORY`. We will use this format to tag and push the image to the cloud.
1. Tag the image with the repo name
    ```bash
    docker tag <local-image-name> <the-path-to-your-repository>/<image-name>
    ```
2. Push the image to the cloud
    ```bash
    docker push <the-path-to-your-repository>/<image-name>
    ```
3. Run the container
    ```bash
    docker run -p 8080:8080 <the-path-to-your-repository>/<image-name>
    ```