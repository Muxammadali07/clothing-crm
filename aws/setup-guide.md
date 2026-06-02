# AWS Infrastructure Setup — ClothCo B2B CRM

One-time AWS setup before the GitHub Actions pipeline can deploy.

---

## 1 — Prerequisites

- AWS CLI installed and configured (`aws configure`)
- AWS account ID ready: `aws sts get-caller-identity --query Account --output text`

---

## 2 — Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name clothing-crm \
  --region us-east-1
```

Note the `repositoryUri` — replace `<ECR_REGISTRY>` in `task-definition.json`.

---

## 3 — Store Secrets in SSM Parameter Store

```bash
REGION=us-east-1

aws ssm put-parameter --name /clothing-crm/MONGO_URI \
  --value "mongodb+srv://USER:PASS@cluster.mongodb.net/clothco" \
  --type SecureString --region $REGION

aws ssm put-parameter --name /clothing-crm/JWT_SECRET \
  --value "your-super-secret-key" \
  --type SecureString --region $REGION

aws ssm put-parameter --name /clothing-crm/JWT_EXPIRES_IN \
  --value "7d" --type String --region $REGION

aws ssm put-parameter --name /clothing-crm/CLIENT_ORIGIN \
  --value "https://your-alb-dns.us-east-1.elb.amazonaws.com" \
  --type String --region $REGION
```

> **MongoDB**: Use MongoDB Atlas (free tier) — the docker-compose local Mongo is for dev only.
> Get your Atlas connection string from https://cloud.mongodb.com → Connect → Drivers.

---

## 4 — IAM Roles

### ecsTaskExecutionRole (allows ECS to pull image + read SSM secrets)
```bash
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'

aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Allow reading SSM SecureString parameters
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess
```

### ecsTaskRole (app runtime permissions — add S3/SES etc. here later)
```bash
aws iam create-role --role-name ecsTaskRole \
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'
```

---

## 5 — CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/clothing-crm --region us-east-1
```

---

## 6 — ECS Cluster

```bash
aws ecs create-cluster --cluster-name clothing-crm-cluster --region us-east-1
```

---

## 7 — Application Load Balancer + Target Group

```bash
# Create ALB (replace subnet IDs and security group IDs with yours)
aws elbv2 create-load-balancer \
  --name clothing-crm-alb \
  --subnets subnet-AAAA subnet-BBBB \
  --security-groups sg-XXXXXXXX \
  --region us-east-1

# Create target group (ALB → ECS containers)
aws elbv2 create-target-group \
  --name clothing-crm-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-XXXXXXXX \
  --target-type ip \
  --health-check-path /api/v1/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-east-1

# Create HTTP listener (port 80 → target group)
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=<TG_ARN> \
  --region us-east-1
```

---

## 8 — Register Task Definition

Update the placeholders in `task-definition.json` first:
- `<ACCOUNT_ID>` → your AWS account ID
- `<REGION>` → `us-east-1`
- `<ECR_REGISTRY>` → ECR repository URI (from step 2)

Then register:
```bash
aws ecs register-task-definition \
  --cli-input-json file://aws/task-definition.json \
  --region us-east-1
```

---

## 9 — ECS Service with Auto Scaling

```bash
# Create the ECS service (linked to ALB)
aws ecs create-service \
  --cluster clothing-crm-cluster \
  --service-name clothing-crm-service \
  --task-definition clothing-crm \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-AAAA,subnet-BBBB],securityGroups=[sg-XXXXXXXX],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<TG_ARN>,containerName=clothing-crm,containerPort=3000" \
  --region us-east-1

# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/clothing-crm-cluster/clothing-crm-service \
  --min-capacity 2 \
  --max-capacity 6

# Scale out when CPU > 70%
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/clothing-crm-cluster/clothing-crm-service \
  --policy-name cpu-scale-out \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'
```

---

## 10 — GitHub Secrets

In your GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user access key (deploy-only permissions) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |

The pipeline uses `us-east-1` by default (change `AWS_REGION` in `deploy.yml` if needed).

---

## Architecture Summary

```
GitHub push → GitHub Actions
  └─ docker build & push → ECR
  └─ ECS rolling deploy
       └─ ALB (port 80)
            └─ Target Group → ECS Fargate tasks (min 2, max 6)
                 └─ Auto Scaling on CPU > 70%
                      └─ App connects to MongoDB Atlas (external)
```
