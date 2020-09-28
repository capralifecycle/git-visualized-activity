#!/bin/bash
set -eux

bucket_name=incub-gva-pipeline-buildbucket51d063ef-b7qfsei4rpk1

if [ -e cloud-assembly.zip ]; then
  rm cloud-assembly.zip
fi

npm run cdk -- synth

cd cdk.out

zip -r ../cloud-assembly.zip .

cd ..

aws s3 cp cloud-assembly.zip s3://$bucket_name/cloud-assembly-incubator.zip
