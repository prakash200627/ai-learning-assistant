pipeline {
    agent any

    stages {
        stage('Deploy') {
            steps {
                sh '''
                cd /home/ubuntu/ai-learning-assistant

                git fetch origin
                git reset --hard origin/main

                docker compose down || true
                docker compose up -d --build
                '''
            }
        }
    }
}