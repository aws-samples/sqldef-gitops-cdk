import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as commit from 'aws-cdk-lib/aws-codecommit';
import * as build from 'aws-cdk-lib/aws-codebuild';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as path from 'path';

export interface CdkDeployProps {
  repository: commit.Repository;
}

export class CdkDeploy extends Construct {
  public readonly project: build.Project;
  public readonly task: tasks.CodeBuildStartBuild;

  constructor(scope: Construct, id: string, props: CdkDeployProps) {
    super(scope, id);

    const project = new build.Project(this, `${id}_CdkDeploy`, {
      source: build.Source.codeCommit({ repository: props.repository }),
      environment: {
        buildImage: build.LinuxBuildImage.fromAsset(this, `${id}_CdkImage`, {
          directory: path.join(__dirname, '..', '..', '..', 'docker'),
          file: 'Dockerfile.cdk',
        }),
      },
      buildSpec: build.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              "npm install",
              "npx cdk deploy --require-approval never",
            ],
          },
        },
      }),
      timeout: Duration.minutes(90),
    });

    project.role?.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
    });

    const task = new tasks.CodeBuildStartBuild(this, `${id}_CdkDeployTask`, {
      project,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    this.project = project;
    this.task = task;
  }
}
