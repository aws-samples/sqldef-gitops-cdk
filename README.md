# `sqldef` GitOps CDK

There are serveral approaches to the database table migration.
This project introduces one of the approach, GitOps with AWS CDK by leveraging [`sqldef`](https://github.com/k0kubun/sqldef).
[`sqldef`](https://github.com/k0kubun/sqldef) is a idempotent schema management tool. So it has a high affinity for GitOps.
You can use this project as a skeleton so that acquire the maintainable table migration from the beginning.

## Architecture

![](/imgs/arch.png)

## Step-by-Step Guide

**Install the dependencies**
```bash
npm install
```

**Bootstrap CDK (Skip if you already did it.)**
```bash
npx cdk bootstrap
```

**Deployment**
```bash
npx cdk deploy
```

After the deployment, push this code to AWS CodeCommit.
The CodeCommit repository was created by the deployment above.
Read [Setup for HTTPS users using Git credentials](https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-gc.html).

The `git push` will trigger the AWS Step Functions execution.
Visit [StateMachine](https://console.aws.amazon.com/states/home#/statemachines) and confirm the AWS CodeBuild execution logs.

## How does the "GitOps" work?

Modify [/sql/tables.sql](/sql/tables.sql) to add new table or new columns.
Then push the code again to trigger the new execution.
You can confirm that the new `ALTER` query is applied to the database.

## Why Step Functions?

Database-related CI/CD may require complex CI/CD flows in the future, including rollback and adaptation to staging environments.
CodePipeline can also be used in the current CI/CD flow.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
