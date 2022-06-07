import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export interface DatabaseProps {
  databaseName: string;
  vpc: ec2.Vpc;
}

export class Database extends Construct {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const cluster = new rds.DatabaseCluster(this, `${id}_Cluster`, {
      engine: rds.DatabaseClusterEngine.auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_01_0 }),
      instanceProps: {
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        vpc: props.vpc,
      },
      defaultDatabaseName: props.databaseName,
    });

    cluster.connections.allowDefaultPortFrom(ec2.Peer.ipv4(props.vpc.vpcCidrBlock));

    this.cluster = cluster;
  }
}
