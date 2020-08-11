# deno_sqs

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/sqs/mod.ts)

Amazon SQS for Deno

> ⚠️ This project is work in progress. Expect breaking changes.

## Examples

Coming soon...

## Contributing

To run tests you need to have a S3 bucket you can talk to. For local development you can use min.io to emulate an S3 bucket:

```
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
docker-compose up -d
aws --endpoint-url "http://localhost:9324" sqs create-queue --queue-name test --region us-east-1 --attributes VisibilityTimeout=0
deno test --allow-net --allow-env
```
