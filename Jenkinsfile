pipeline {
    agent any

    triggers {
        pollSCM('H/30 * * * *')
    }

    environment {
        COMPOSE_FILE = '~/home-monitoring/docker-compose.yml'
    }

    stages {
        stage('Build Backend') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} build backend"
            }
        }

        stage('Build Logger') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} build logger"
            }
        }

        stage('Build Frontend') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} build frontend"
            }
        }

        stage('Deploy Backend') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} up -d --no-deps backend"
            }
        }

        stage('Wait for Backend Health') {
            steps {
                retry(10) {
                    sleep 15
                    sh """
                        CONTAINER_ID=\$(docker compose -f ${COMPOSE_FILE} ps -q backend)
                        STATUS=\$(docker inspect --format='{{.State.Health.Status}}' "\$CONTAINER_ID")
                        echo "Backend health status: \$STATUS"
                        [ "\$STATUS" = "healthy" ]
                    """
                }
            }
        }

        stage('Deploy Logger') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} up -d --no-deps logger"
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh "docker compose -f ${COMPOSE_FILE} up -d --no-deps frontend"
            }
        }

        stage('Frontend Health Check') {
            steps {
                retry(10) {
                    sleep 15
                    sh """
                        CONTAINER_ID=\$(docker compose -f ${COMPOSE_FILE} ps -q frontend)
                        STATUS=\$(docker inspect --format='{{.State.Health.Status}}' "\$CONTAINER_ID")
                        echo "Frontend health status: \$STATUS"
                        [ "\$STATUS" = "healthy" ]
                    """
                }
            }
        }
    }

    post {
        failure {
            echo 'Home monitoring deployment failed!'
        }
        success {
            echo 'Home monitoring deployed successfully.'
        }
    }
}
