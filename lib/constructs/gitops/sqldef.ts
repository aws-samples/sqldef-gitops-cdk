import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as commit from 'aws-cdk-lib/aws-codecommit';
import * as build from 'aws-cdk-lib/aws-codebuild';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';

export interface SqldefProps {
  repository: commit.Repository;
  cluster: rds.DatabaseCluster;
  databaseName: string;
  vpc: ec2.Vpc;
}

export class Sqldef extends Construct {
  public readonly project: build.Project;
  public readonly task: tasks.CodeBuildStartBuild;

  constructor(scope: Construct, id: string, props: SqldefProps) {
    super(scope, id);

    const project = new build.Project(this, `${id}_Sqldef`, {
      source: build.Source.codeCommit({ repository: props.repository }),
      environment: {
        buildImage: build.LinuxBuildImage.fromAsset(this, `${id}_SqldefImage`, {
          directory: path.join(__dirname, '..', '..', '..', 'docker'),
          file: 'Dockerfile.sqldef',
        }),
      },
      environmentVariables: {
        DB_USERNAME: {
          type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: `${props.cluster.secret?.secretArn}:username`,
        },
        DB_PASSWORD: {
          type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: `${props.cluster.secret?.secretArn}:password`,
        },
        DB_HOST: {
          type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
          value: `${props.cluster.secret?.secretArn}:host`,
        },
        DB_NAME: {
          type: build.BuildEnvironmentVariableType.PLAINTEXT,
          value: props.databaseName,
        },
      },
      buildSpec: build.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              "./scripts/entrypoint.sh",
            ],
          },
        },
      }),
      timeout: Duration.minutes(10),
      vpc: props.vpc,
    });

    props.cluster.secret?.grantRead(project);

    const task = new tasks.CodeBuildStartBuild(this, `${id}_SqldefTask`, {
      project,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    });

    this.project = project;
    this.task = task;
  }
}
