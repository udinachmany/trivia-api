#!/usr/bin/env node
import { VpcNetworkRef } from '@aws-cdk/aws-ec2';
import { RepositoryRef } from '@aws-cdk/aws-ecr';
import { Cluster, ContainerImage, LoadBalancedFargateService } from '@aws-cdk/aws-ecs';
import cdk = require('@aws-cdk/cdk');

class TriviaBackendStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);

    // Reference existing network infrastructure
    const vpc = VpcNetworkRef.importFromContext(this, 'VPC', { vpcName: 'TriviaBackendTest/VPC' });
    const cluster = new Cluster(this, 'Cluster', { vpc });

    // Reference Docker image
    const repoName = (process.env.IMAGE_REPO_NAME) ? process.env.IMAGE_REPO_NAME : 'reinvent-trivia-backend';
    const imageRepo = RepositoryRef.import(this, 'Repo', {
      repositoryArn: cdk.ArnUtils.fromComponents({
        service: 'ecr',
        resource: 'repository',
        resourceName: repoName
      })
    });
    const tag = (process.env.IMAGE_TAG) ? process.env.IMAGE_TAG : 'latest';
    const image = ContainerImage.fromEcrRepository(imageRepo, tag)

    // Create Fargate service + load balancer
    new LoadBalancedFargateService(this, 'Service', {
      cluster,
      image
    });
  }
}

const app = new cdk.App();
new TriviaBackendStack(app, 'Api', {});
app.run();