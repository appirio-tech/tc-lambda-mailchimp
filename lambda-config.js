module.exports = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
  description: "Lambda function to support preferences related CRUD",
  handler: 'index.handler',
  role: process.env.AWS_LAMBDA_ROLE_ARN,
  region: 'us-east-1',
  handler: 'index.handler',
  functionName: 'tc-preference-api',
  timeout: 180,
  memorySize: 512
  // eventSource: {}
}