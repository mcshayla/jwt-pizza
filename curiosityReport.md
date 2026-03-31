### Jenkins

# why I chose this project?
 - I have a job interview coming up and they asked if I had experience or knowledge of Jenkins.

 
# What it is?
Jenkins solves the same problem that Github Actions solves. Jenkins allows for Continuous Integration and Continuous Delivery.

What's different then?
 - Jenkins is very similar to GitHub Actions but it has different syntax. 

| Feature | GitHub Actions | Jenkins |
|---|---|---|
| Config file | workflow `.yml` | `Jenkinsfile` |
| Trigger | `on: push / pull_request` | webhook / pollSCM |
| Pipeline unit | workflow | pipeline / job |
| Stages | `jobs:` | `stages { }` |
| Steps | `steps:` | `steps { }` |
| Secrets | GitHub Secrets | Credentials store |
| Parallel runs | jobs with no `needs:` | `parallel { }` block |
| Reuse | Reusable workflows | Shared Libraries |
| Runner / agent | `runs-on: ubuntu-latest` | `agent { label / docker }` |
| Marketplace | `actions/checkout`, etc. | 1,800+ plugins |

Self-hosted server is required for Jenkins though where GitHub has a free tier for hosting. 

 - This could be a main selling point for regulated business like banking, healthcare, government, or defense that care about security and node never touching the internet during a build. 
 - Jenkins is also useful when the pipeline needs to reach things that are only local. 
 - Jenkins can also be cheaper for a large oraganization with thousands of builds per day. 
 - Jenkins is a longer to install and config but also has access to lots of plugins and can be used with basically any tool. 
 - You have a lot more control with Jenkins using full Groovy scripting.


 ```
  pipeline {
    agent any

    // Equivalent to: on: push branches: [main] + workflow_dispatch
    // Configure webhook + "Build when a change is pushed" in Jenkins job settings.
    // workflow_dispatch = "Build Now" button in the Jenkins UI — no extra config needed.

    environment {
        // Equivalent to: env.version consumed across jobs via needs.build.outputs.version
        // We set this once in the Build stage and share it via a .env file + readFile trick,
        // or more simply by declaring it at pipeline level and setting it in the stage.
        VERSION = ''
    }

    stages {

        // ─────────────────────────────────────────────
        // JOB: build
        // Equivalent to the 'build' job in the workflow
        // ─────────────────────────────────────────────
        stage('Build') {
            steps {
                // Equivalent to: actions/checkout@v4
                checkout scm

                // Equivalent to: actions/setup-node@v4 with node-version: '22.x'
                // Assumes Node 22 is installed on the agent, or use a docker agent:
                //   agent { docker { image 'node:22' } }
                nodejs('node-22') {
                    // Equivalent to: set version step
                    script {
                        def ts = sh(script: "date +'%Y%m%d.%H%M%S'", returnStdout: true).trim()
                        env.VERSION = ts
                        sh """printf '{"version": "%s"}' "${ts}" > public/version.json"""
                    }

                    // Equivalent to: npm ci && npm run build
                    sh 'npm ci && npm run build'
                }

                // Equivalent to: actions/upload-artifact@v4 (name: package, path: dist/)
                // stash preserves files between stages on the same agent,
                // or use archiveArtifacts if you want them visible in the Jenkins UI too.
                stash name: 'package', includes: 'dist/**'
            }
        }

        // ─────────────────────────────────────────────
        // JOB: deploy
        // Equivalent to the 'deploy' job (needs: build)
        // Stages in Jenkins run sequentially by default — 'deploy' runs after 'build' passes.
        // ─────────────────────────────────────────────
        stage('Deploy') {
            steps {
                // Equivalent to: actions/download-artifact@v4
                unstash 'package'

                // Equivalent to: aws-actions/configure-aws-credentials@v4 with OIDC
                // Jenkins uses the AWS Credentials plugin + an IAM role ARN.
                // Add an "AWS Credentials" entry in Jenkins → Manage Credentials,
                // then reference it here. The plugin handles assume-role automatically.
                withCredentials([
                    string(credentialsId: 'aws-account',   variable: 'AWS_ACCOUNT'),
                    string(credentialsId: 'ci-iam-role',   variable: 'CI_IAM_ROLE'),
                    string(credentialsId: 'app-bucket',    variable: 'APP_BUCKET'),
                    string(credentialsId: 'distribution-id', variable: 'DISTRIBUTION_ID')
                ]) {
                    // Assume the IAM role (mirrors the OIDC role-to-assume in GitHub Actions)
                    sh """
                        aws sts assume-role \
                            --role-arn arn:aws:iam::${AWS_ACCOUNT}:role/${CI_IAM_ROLE} \
                            --role-session-name jenkins-deploy \
                            --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
                            --output text | read AK SK ST
                        export AWS_ACCESS_KEY_ID=\$AK
                        export AWS_SECRET_ACCESS_KEY=\$SK
                        export AWS_SESSION_TOKEN=\$ST
                    """

                    // Equivalent to: aws s3 cp dist s3://... --recursive
                    sh """
                        echo "Deploying ${env.VERSION}"
                        aws s3 cp dist s3://\${APP_BUCKET} --recursive
                    """

                    // Equivalent to: aws cloudfront create-invalidation
                    sh """
                        aws cloudfront create-invalidation \
                            --distribution-id \${DISTRIBUTION_ID} \
                            --paths "/*"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────
        // JOB: release
        // Equivalent to the 'release' job (needs: build, deploy)
        // Runs after both previous stages pass.
        // ─────────────────────────────────────────────
        stage('Release') {
            steps {
                // Equivalent to: ncipollo/release-action
                // Jenkins uses the GitHub Release plugin, or a direct API call via curl.
                // The curl approach is more portable and doesn't need an extra plugin.
                withCredentials([
                    string(credentialsId: 'github-token', variable: 'GH_TOKEN')
                ]) {
                    script {
                        def commitMsg = sh(
                            script: 'git log -1 --pretty=%B',
                            returnStdout: true
                        ).trim()
                        def commitSha = sh(
                            script: 'git rev-parse HEAD',
                            returnStdout: true
                        ).trim()
                        def repoSlug = env.GIT_URL
                            .replaceAll('https://github.com/', '')
                            .replaceAll('\\.git$', '')

                        // Equivalent to: ncipollo/release-action tag + name + body + makeLatest
                        sh """
                            curl -s -X POST \
                                -H "Authorization: token \${GH_TOKEN}" \
                                -H "Content-Type: application/json" \
                                https://api.github.com/repos/${repoSlug}/releases \
                                -d '{
                                    "tag_name":    "version-${env.VERSION}",
                                    "name":        "Version ${env.VERSION}",
                                    "body":        "## Changes\\n\\n${commitMsg}\\n\\n**commit**: ${commitSha}",
                                    "make_latest": "true"
                                }'
                        """
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────
    // Equivalent to: no explicit post block in your workflow,
    // but good practice to add — mirrors GitHub's always() cleanup.
    // ─────────────────────────────────────────────
    post {
        success {
            echo "Pipeline complete. Version: ${env.VERSION}"
        }
        failure {
            echo "Pipeline failed at version: ${env.VERSION}"
            // Add: mail to: 'team@yourco.com', subject: "Build failed: ${env.VERSION}"
        }
        always {
            cleanWs()  // Clean workspace after every run
        }
    }
} ```