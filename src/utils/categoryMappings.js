// Maps cloud service names to their category groups.
// Unrecognised services fall into "Other".

export const AZURE_CATEGORIES = {
  // Analytics
  "Azure Synapse Analytics": "Analytics",
  "Azure Data Factory": "Analytics",
  "Azure Databricks": "Analytics",
  "Azure Stream Analytics": "Analytics",
  "Azure Analysis Services": "Analytics",
  "Azure Data Lake Storage": "Analytics",
  "Azure Data Lake Analytics": "Analytics",
  "Azure HDInsight": "Analytics",
  "Power BI Embedded": "Analytics",
  "Azure Purview": "Analytics",
  "Microsoft Fabric": "Analytics",
  "Azure Data Explorer": "Analytics",
  "Log Analytics": "Analytics",

  // Azure Arc
  "Azure Arc": "Azure Arc",
  "Azure Arc-enabled Servers": "Azure Arc",
  "Azure Arc-enabled Kubernetes": "Azure Arc",
  "Azure Arc-enabled Data Services": "Azure Arc",

  // Compute
  "Virtual Machines": "Compute",
  "Azure Virtual Machines": "Compute",
  "Virtual Machine Scale Sets": "Compute",
  "Azure App Service": "Compute",
  "Azure Functions": "Compute",
  "Azure Batch": "Compute",
  "Azure Spring Apps": "Compute",
  "Azure VMware Solution": "Compute",
  "Azure Dedicated Host": "Compute",
  "Azure CycleCloud": "Compute",
  "Azure Spot Virtual Machines": "Compute",
  "Azure Kubernetes Service": "Containers",
  "Container Instances": "Containers",
  "Container Registry": "Containers",
  "Azure Red Hat OpenShift": "Containers",
  "Azure Container Apps": "Containers",

  // Data
  "Azure Cosmos DB": "Data",
  "Azure Cache for Redis": "Data",
  "Azure Table Storage": "Data",
  "Azure Data Share": "Data",
  "Azure Open Datasets": "Data",

  // Databases
  "Azure SQL Database": "Databases",
  "Azure SQL Managed Instance": "Databases",
  "SQL Server on Azure Virtual Machines": "Databases",
  "Azure Database for PostgreSQL": "Databases",
  "Azure Database for MySQL": "Databases",
  "Azure Database for MariaDB": "Databases",
  "Azure Database Migration Service": "Databases",
  "Azure SQL Edge": "Databases",

  // Developer Tools
  "Azure DevOps": "Developer Tools",
  "Azure DevTest Labs": "Developer Tools",
  "Azure Load Testing": "Developer Tools",
  "Azure Managed Grafana": "Developer Tools",
  "Azure Lab Services": "Developer Tools",
  "Visual Studio": "Developer Tools",
  "Visual Studio Subscriptions": "Developer Tools",
  "GitHub": "Developer Tools",
  "App Configuration": "Developer Tools",
  "Azure Chaos Studio": "Developer Tools",

  // Integration
  "Azure Logic Apps": "Integration",
  "Azure Service Bus": "Integration",
  "Azure Event Grid": "Integration",
  "Azure Event Hubs": "Integration",
  "Azure API Management": "Integration",
  "Azure Data Catalog": "Integration",
  "Azure Notification Hubs": "Integration",
  "Azure Relay": "Integration",

  // Internet of Things
  "Azure IoT Hub": "Internet of Things",
  "Azure IoT Central": "Internet of Things",
  "Azure Digital Twins": "Internet of Things",
  "Azure Time Series Insights": "Internet of Things",
  "Azure Maps": "Internet of Things",
  "Azure Sphere": "Internet of Things",
  "Azure RTOS": "Internet of Things",

  // Management and Governance
  "Azure Monitor": "Management and Governance",
  "Azure Policy": "Management and Governance",
  "Azure Automation": "Management and Governance",
  "Azure Backup": "Management and Governance",
  "Azure Site Recovery": "Management and Governance",
  "Azure Advisor": "Management and Governance",
  "Azure Resource Manager": "Management and Governance",
  "Azure Blueprints": "Management and Governance",
  "Azure Cost Management": "Management and Governance",
  "Microsoft Defender for Cloud": "Management and Governance",
  "Azure Lighthouse": "Management and Governance",
  "Azure Managed Applications": "Management and Governance",
  "Azure Migrate": "Management and Governance",
  "Azure Update Management": "Management and Governance",
  "Azure Service Health": "Management and Governance",
  "Microsoft Cost Management": "Management and Governance",
  "Advanced Threat Protection": "Management and Governance",

  // Networking
  "Azure Virtual Network": "Networking",
  "Azure Load Balancer": "Networking",
  "Azure Application Gateway": "Networking",
  "Azure VPN Gateway": "Networking",
  "Azure ExpressRoute": "Networking",
  "Azure DNS": "Networking",
  "Azure DDoS Protection": "Networking",
  "Azure Front Door": "Networking",
  "Azure Traffic Manager": "Networking",
  "Azure Bastion": "Networking",
  "Azure Network Watcher": "Networking",
  "Azure Private Link": "Networking",
  "Azure Firewall": "Networking",
  "Azure Web Application Firewall": "Networking",
  "Azure CDN": "Networking",
  "Content Delivery Network": "Networking",
  "Azure Virtual WAN": "Networking",
  "Bandwidth": "Networking",

  // SaaS
  "Microsoft 365": "SaaS",
  "Dynamics 365": "SaaS",
  "Azure Communication Services": "SaaS",

  // Security
  "Azure Active Directory": "Security",
  "Azure Active Directory B2C": "Security",
  "Azure Key Vault": "Security",
  "Microsoft Sentinel": "Security",
  "Azure Dedicated HSM": "Security",
  "Microsoft Entra": "Security",
  "Microsoft Entra ID": "Security",
  "Azure Information Protection": "Security",
  "Microsoft Defender": "Security",
  "Microsoft Defender for Endpoint": "Security",

  // Storage
  "Azure Blob Storage": "Storage",
  "Azure Files": "Storage",
  "Azure Queue Storage": "Storage",
  "Azure Disk Storage": "Storage",
  "Azure Managed Disks": "Storage",
  "Azure NetApp Files": "Storage",
  "Azure HPC Cache": "Storage",
  "StorSimple": "Storage",
  "Azure Data Box": "Storage",
  "Storage": "Storage",
};

export const AWS_CATEGORIES = {
  // Analytics
  "Amazon Athena": "Analytics",
  "Amazon EMR": "Analytics",
  "Amazon Kinesis": "Analytics",
  "Amazon Kinesis Data Streams": "Analytics",
  "Amazon Kinesis Data Firehose": "Analytics",
  "Amazon QuickSight": "Analytics",
  "Amazon Redshift": "Analytics",
  "AWS Glue": "Analytics",
  "AWS Lake Formation": "Analytics",
  "Amazon OpenSearch Service": "Analytics",
  "Amazon Elasticsearch Service": "Analytics",
  "AWS Data Pipeline": "Analytics",
  "Amazon Managed Streaming for Apache Kafka": "Analytics",

  // Compute
  "Amazon EC2": "Compute",
  "Amazon EC2 - Other": "Compute",
  "AWS Lambda": "Compute",
  "AWS Elastic Beanstalk": "Compute",
  "Amazon Lightsail": "Compute",
  "AWS Batch": "Compute",
  "Amazon EC2 Auto Scaling": "Compute",
  "AWS Outposts": "Compute",
  "Amazon EC2 Image Builder": "Compute",
  "AWS App Runner": "Compute",
  "AWS Wavelength": "Compute",

  // Containers
  "Amazon ECS": "Containers",
  "Amazon EKS": "Containers",
  "AWS Fargate": "Containers",
  "Amazon ECR": "Containers",
  "Amazon Elastic Container Registry": "Containers",
  "Amazon Elastic Container Service": "Containers",
  "Amazon Elastic Kubernetes Service": "Containers",

  // Databases
  "Amazon RDS": "Databases",
  "Amazon DynamoDB": "Databases",
  "Amazon Aurora": "Databases",
  "Amazon ElastiCache": "Databases",
  "Amazon DocumentDB": "Databases",
  "Amazon Neptune": "Databases",
  "Amazon Timestream": "Databases",
  "Amazon QLDB": "Databases",
  "Amazon Keyspaces": "Databases",
  "AWS Database Migration Service": "Databases",
  "Amazon MemoryDB for Redis": "Databases",

  // Developer Tools
  "AWS CodeBuild": "Developer Tools",
  "AWS CodeCommit": "Developer Tools",
  "AWS CodeDeploy": "Developer Tools",
  "AWS CodePipeline": "Developer Tools",
  "AWS Cloud9": "Developer Tools",
  "AWS X-Ray": "Developer Tools",
  "Amazon CodeGuru": "Developer Tools",
  "AWS Amplify": "Developer Tools",

  // Integration
  "Amazon SQS": "Integration",
  "Amazon SNS": "Integration",
  "Amazon EventBridge": "Integration",
  "AWS Step Functions": "Integration",
  "Amazon MQ": "Integration",
  "AWS AppSync": "Integration",
  "Amazon API Gateway": "Integration",

  // Internet of Things
  "AWS IoT Core": "Internet of Things",
  "AWS IoT Greengrass": "Internet of Things",
  "AWS IoT Device Management": "Internet of Things",
  "AWS IoT Analytics": "Internet of Things",
  "Amazon FreeRTOS": "Internet of Things",

  // Machine Learning / AI
  "Amazon SageMaker": "Machine Learning",
  "Amazon Rekognition": "Machine Learning",
  "Amazon Comprehend": "Machine Learning",
  "Amazon Translate": "Machine Learning",
  "Amazon Polly": "Machine Learning",
  "Amazon Lex": "Machine Learning",
  "Amazon Textract": "Machine Learning",
  "Amazon Forecast": "Machine Learning",
  "Amazon Personalize": "Machine Learning",
  "AWS Bedrock": "Machine Learning",
  "Amazon Bedrock": "Machine Learning",

  // Management and Governance
  "AWS CloudTrail": "Management and Governance",
  "Amazon CloudWatch": "Management and Governance",
  "AWS Config": "Management and Governance",
  "AWS Systems Manager": "Management and Governance",
  "AWS Trusted Advisor": "Management and Governance",
  "AWS Auto Scaling": "Management and Governance",
  "AWS CloudFormation": "Management and Governance",
  "AWS OpsWorks": "Management and Governance",
  "AWS Organizations": "Management and Governance",
  "AWS Control Tower": "Management and Governance",
  "AWS Backup": "Management and Governance",
  "AWS Health": "Management and Governance",
  "AWS License Manager": "Management and Governance",
  "AWS Cost Explorer": "Management and Governance",
  "AWS Budgets": "Management and Governance",

  // Networking
  "Amazon VPC": "Networking",
  "Amazon Route 53": "Networking",
  "Amazon CloudFront": "Networking",
  "Elastic Load Balancing": "Networking",
  "AWS Direct Connect": "Networking",
  "AWS Transit Gateway": "Networking",
  "Amazon API Gateway": "Networking",
  "AWS Global Accelerator": "Networking",
  "AWS PrivateLink": "Networking",
  "AWS Network Firewall": "Networking",
  "Amazon VPC Lattice": "Networking",

  // Security
  "AWS IAM": "Security",
  "AWS Key Management Service": "Security",
  "AWS Secrets Manager": "Security",
  "Amazon GuardDuty": "Security",
  "AWS Shield": "Security",
  "AWS WAF": "Security",
  "Amazon Inspector": "Security",
  "AWS Security Hub": "Security",
  "Amazon Macie": "Security",
  "AWS Certificate Manager": "Security",
  "AWS Firewall Manager": "Security",
  "Amazon Cognito": "Security",
  "AWS Single Sign-On": "Security",

  // Storage
  "Amazon S3": "Storage",
  "Amazon EBS": "Storage",
  "Amazon EFS": "Storage",
  "Amazon Glacier": "Storage",
  "Amazon S3 Glacier": "Storage",
  "AWS Storage Gateway": "Storage",
  "AWS Snow Family": "Storage",
  "Amazon FSx": "Storage",
  "AWS Backup": "Storage",
};

export const BTP_CATEGORIES = {
  // Application Development
  "SAP Business Application Studio": "Application Development",
  "SAP Build Work Zone": "Application Development",
  "SAP Build Process Automation": "Application Development",
  "SAP Build Apps": "Application Development",
  "SAP Extension Suite": "Application Development",
  "Workflow Management": "Application Development",

  // Integration
  "SAP Integration Suite": "Integration",
  "Cloud Integration": "Integration",
  "API Management": "Integration",
  "SAP Event Mesh": "Integration",
  "Open Connectors": "Integration",
  "Integration Assessment": "Integration",

  // Data & Analytics
  "SAP Analytics Cloud": "Data & Analytics",
  "SAP HANA Cloud": "Data & Analytics",
  "SAP Data Warehouse Cloud": "Data & Analytics",
  "SAP Datasphere": "Data & Analytics",
  "SAP HANA Service": "Data & Analytics",
  "Data Intelligence": "Data & Analytics",
  "Master Data Integration": "Data & Analytics",

  // AI & Machine Learning
  "SAP AI Core": "AI & Machine Learning",
  "SAP AI Launchpad": "AI & Machine Learning",
  "Document Information Extraction": "AI & Machine Learning",
  "Business Entity Recognition": "AI & Machine Learning",
  "Data Attribute Recommendation": "AI & Machine Learning",
  "Intelligent Robotic Process Automation": "AI & Machine Learning",

  // Security & Identity
  "Authorization and Trust Management": "Security & Identity",
  "SAP Identity Authentication": "Security & Identity",
  "SAP Cloud Identity Services": "Security & Identity",
  "Credential Store": "Security & Identity",
  "SAP Data Custodian": "Security & Identity",

  // DevOps & Platform
  "Cloud Foundry Runtime": "DevOps & Platform",
  "Kyma Runtime": "DevOps & Platform",
  "SAP BTP, Kyma Runtime": "DevOps & Platform",
  "SAP BTP, Cloud Foundry Runtime": "DevOps & Platform",
  "Continuous Integration & Delivery": "DevOps & Platform",
  "Alert Notification": "DevOps & Platform",
  "Application Logging": "DevOps & Platform",
  "Audit Log Service": "DevOps & Platform",

  // Connectivity & Networking
  "SAP Connectivity Service": "Connectivity",
  "Cloud Connector": "Connectivity",
  "Destination Service": "Connectivity",
  "Private Link Service": "Connectivity",

  // Storage & Database
  "Object Store Service": "Storage",
  "PostgreSQL on SAP BTP": "Storage",
  "Redis on SAP BTP": "Storage",
  "SAP HANA Schemas & HDI Containers": "Storage",

  // Monitoring & Operations
  "SAP Cloud ALM": "Monitoring & Operations",
  "SAP Landscape Management Cloud": "Monitoring & Operations",
  "Dynatrace": "Monitoring & Operations",
  "Feature Flags Service": "Monitoring & Operations",
};

/**
 * Groups an array of {name, cost} service items into categories.
 * @param {Array<{name: string, cost: number}>} services
 * @param {"azure"|"aws"|"btp"} provider
 * @returns {Array<{category: string, total: number}>} sorted descending by total
 */
export function groupByCategory(services, provider) {
  const map = provider === "azure" ? AZURE_CATEGORIES : provider === "aws" ? AWS_CATEGORIES : BTP_CATEGORIES;
  const totals = {};

  services.forEach((svc) => {
    const name = svc.name ?? svc.ServiceName ?? svc.service ?? "";
    const cost = svc.cost ?? svc.Cost ?? 0;
    const category = map[name] ?? "Other";
    totals[category] = (totals[category] ?? 0) + cost;
  });

  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
