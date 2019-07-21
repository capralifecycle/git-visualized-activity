'use strict'

const { SSM } = require('aws-sdk')

// Cache values from parameter store for this time.
const cacheTime = 60 * 1000 // in ms

async function getParams() {
  const ssm = new SSM({ region: 'eu-central-1' })
  const data = await ssm
    .getParameters({
      Names: [
        '/git-visualized-activity/prod/basicauth/username',
        '/git-visualized-activity/prod/basicauth/password',
      ],
      WithDecryption: true,
    })
    .promise()

  function getParam(name) {
    return data.Parameters.find(it => it.Name === name).Value
  }

  return {
    username: getParam('/git-visualized-activity/prod/basicauth/username'),
    password: getParam('/git-visualized-activity/prod/basicauth/password'),
  }
}

function createCachedParamsGetter() {
  let lastResult = null
  let lastResultTime = null

  return async () => {
    const expire = new Date().getTime() - cacheTime
    if (lastResultTime === null || lastResultTime < expire) {
      lastResult = await getParams()
      lastResultTime = new Date().getTime()
    }
    return lastResult
  }
}

const getCachedParams = createCachedParamsGetter()

async function main(event, context, callback) {
  // Get request and request headers
  const request = event.Records[0].cf.request
  const headers = request.headers

  const { username, password } = await getCachedParams()

  // Construct the Basic Auth string
  const authString =
    'Basic ' + new Buffer(username + ':' + password).toString('base64')

  // Require Basic authentication
  if (
    typeof headers.authorization == 'undefined' ||
    headers.authorization[0].value != authString
  ) {
    const body = 'Unauthorized'
    const response = {
      status: '401',
      statusDescription: 'Unauthorized',
      body: body,
      headers: {
        'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Basic' }],
      },
    }
    callback(null, response)
  }

  // Continue request processing if authentication passed
  callback(null, request)
}

exports.handler = (event, context, callback) => {
  main(event, context, callback)
}
