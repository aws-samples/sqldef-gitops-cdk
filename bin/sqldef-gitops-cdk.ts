#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GitOpsStack } from '../lib/gitops-stack';

const app = new cdk.App();

new GitOpsStack(app, 'GitOpsStack', {
  databaseName: 'gitops_sample',
  repositoryName: 'gitops-sample',
});
