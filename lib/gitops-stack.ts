import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as commit from 'aws-cdk-lib/aws-codecommit';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import {
  Database,
  CdkDeploy,
  Sqldef,
} from './constructs';

export interface GitOpsStackProps extends StackProps {
  databaseName: string;
  repositoryName: string;
}

export class GitOpsStack extends Stack {
  constructor(scope: Construct, id: string, props: GitOpsStackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'Vpc');

    // Create Aurora cluster
    const database = new Database(this, 'Database', {
      databaseName: props.databaseName,
      vpc,
    })

    // Create CodeCommit repository
    const repository = new commit.Repository(this, 'Repository', {
      repositoryName: props.repositoryName,
    });

    // Create `cdk deploy` CodeBuild project
    const cdkDeploy = new CdkDeploy(this, 'CdkDeploy', {
      repository,
    });

    // Create `mysqldef` CodeBuild project
    const sqlDef = new Sqldef(this, 'Sqldef', {
      repository,
      vpc,
      cluster: database.cluster,
      databaseName: props.databaseName,
    });

    // Create Step Function StateMachine
    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: cdkDeploy.task.next(sqlDef.task),
      timeout: Duration.minutes(120),
    });

    // Set a trigger on "commit" for "main" branch
    repository.onCommit('OnCommit', {
      branches: ['main'],
      target: new targets.SfnStateMachine(stateMachine),
    });

    /*
      const vpc = new ec2.Vpc(this, 'Vpc');

      const databaseName = 'awesomesystem';
      const cluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_01_0 }),
      instanceProps: {
      vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
      vpc,
      },
      defaultDatabaseName: databaseName,
      });

      cluster.connections.allowDefaultPortFrom(ec2.Peer.ipv4(vpc.vpcCidrBlock));

      const repository = new commit.Repository(this, 'Repository', {
      repositoryName: 'sqldef-gitops-cdk',
      });

      const cdkDeploy = new build.Project(this, 'CdkDeploy', {
      source: build.Source.codeCommit({ repository }),
      environment: {
      buildImage: build.LinuxBuildImage.fromAsset(this, 'CdkImage', {
      directory: path.join(__dirname, '..', 'docker'),
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

      cdkDeploy.role?.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
      });

      const cdkDeployTask = new tasks.CodeBuildStartBuild(this, 'CdkDeployTask', {
      project: cdkDeploy,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
      });

      const migration = new build.Project(this, 'Migration', {
      source: build.Source.codeCommit({ repository }),
      environment: {
      buildImage: build.LinuxBuildImage.fromAsset(this, 'SqldefImage', {
      directory: path.join(__dirname, '..', 'docker'),
      file: 'Dockerfile.sqldef',
      }),
      },
      environmentVariables: {
      DB_USERNAME: {
      type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
      value: `${cluster.secret?.secretArn}:username`,
      },
      DB_PASSWORD: {
      type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
      value: `${cluster.secret?.secretArn}:password`,
      },
      DB_HOST: {
      type: build.BuildEnvironmentVariableType.SECRETS_MANAGER,
      value: `${cluster.secret?.secretArn}:host`,
      },
      DB_NAME: {
      type: build.BuildEnvironmentVariableType.PLAINTEXT,
      value: databaseName,
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
      vpc,
      });

      cluster.secret?.grantRead(migration);

      const migrationTask = new tasks.CodeBuildStartBuild(this, 'MigrationTask', {
      project: migration,
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
      });

      const definition = cdkDeployTask.next(migrationTask);
      const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition,
      timeout: Duration.minutes(120),
      });

      repository.onCommit('onCommit', {
      branches: ['main'],
      target: new targets.SfnStateMachine(stateMachine),
      });
    */
  }
}
