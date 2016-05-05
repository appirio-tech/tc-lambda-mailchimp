/** == Imports == */
var request = require('request'),
  _ = require('lodash'),
  md5 = require('md5'),
  jwt = require('jsonwebtoken'),
  AWS = require('aws-sdk'),
  Q = require('q');

var querystring = require('querystring')

var mailchimp = require('./mailchimp.service.js')

var dynamoDb = new AWS.DynamoDB()
var docClient = new AWS.DynamoDB.DocumentClient()

String.prototype.endsWith = function(str) {
  var lastIndex = this.lastIndexOf(str);
  return (lastIndex !== -1) && (lastIndex + str.length === this.length);
}

var getSanitizedAuthorizationToken = function(token) {
  var parsedToken = querystring.parse("token=" + token)
  var parts = parsedToken.token.split(' ');
  // Handle scenarios when the event.authorizationToken has 'Bearer ' schema
  if (parts.length > 1) {
    var schema = parts.shift().toLowerCase();
    console.log(schema)
    if (schema !== 'bearer') {
      return null
    }
    return parts.shift();
  } else {
    return parsedToken.token;
  }
};

/**
 * Entry point for lambda function handler
 */
exports.handler = function(event, context) {
  // console.log('Received event:', JSON.stringify(event, null, 2));
  var operation = getOperation(event, context)

  // convert query params to JSON
  switch (operation) {
    case 'UPDATE_PREFERENCE':
      var pType = _.get(event, 'params.path.preferenceType', '')
      if (pType.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'preferenceType' param is currently required"));
        break;
      }
      var userId = _.get(event, 'body.userId', -1)
      if (!userId) {
        context.fail(new Error("400_BAD_REQUEST: 'userId' param is currently required"))
        break
      }
      var token = checkAuthorization(userId, event, context)

      var options = {
        TableName: 'Preferences',
        Key: {
          objectId: objectId
        },
        UpdateExpression: 'set ' + pType + ' = :pType',
        ReturnValues: 'UPDATED_NEW'
      };
      options.ExpressionAttributeValues = {
        ':pType' : parsePreferenceBody(event.body)
      };
      if (!checkParamsForPreference(preferenceType)) {
        return
      }

      docClient.update(options,function(err) {
        if(!err) {
          afterPreferenceUpdate().then(function() {
            context.succeed(wrapResponse(context, 200, null, pType, 1))
          }).catch(function(err) {
            // TODO reverse the db update
            console.log('Error afterPreferenceGet: ' + err)
            // ideally it should never land in this because as of now afterPreferenceUpdate is intented
            // to be fire and forget
          })
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + err.message))
        }
      });
      
      break
    case 'VIEW_PREFERENCE':
      // make sure name param was passed is non-empty
      var pType = _.get(event, 'params.path.preferenceType', '')
      if (pType.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'preferenceType' param is currently required"));
        break;
      }
      var userId = _.get(event, 'params.path.userId', '')
      if (!userId) {
        context.fail(new Error("400_BAD_REQUEST: 'userId' param is currently required"))
        break
      }
      var token = checkAuthorization(userId, event, context)

      var options = {
        TableName : 'Preferences',
        ConsistentRead: false,
        // IndexName: 'objectId-index',
        Select: 'SPECIFIC_ATTRIBUTES',
        ProjectionExpression: 'objectId,' + pType,
        ExpressionAttributeValues: {
          ':objectId': {
            S: userId
          }
        },
        KeyConditionExpression: '(objectId = :objectId)'
      }
      dynamoDb.query(options, function(err, data) {
        if(!err && data && data.Items) { // TODO we can check for more than one matched records
          var pref = data.Items.length > 0 ? data.Items[0] : null;
          afterPreferenceGet(pType, event, context, token).then(function() {
            console.log('Content', JSON.stringify(pref, null, 2))
            context.succeed(wrapResponse(context, 200, pref, pType))
          }).catch(function(err) {
            console.log('Error afterPreferenceGet: ' + err)
            // ideally it should never land in this because as of now afterPreferenceGet is intented
            // to be fire and forget
          })
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + err.message));
        }
      })
      break
    case 'ping':
      context.succeed('pong');
      break;
    default:
      context.fail(new Error('400_BAD_REQUEST: Unrecognized operation "' + operation + '"'));
  }
}

function checkAuthorization(userId, event, context) {
  var authHeader = _.get(event, 'params.header.Authorization', '')
  if (authHeader.trim().length === 0) {
    context.fail(new Error("401_UNAUTHORIZED: Missing Authorization"))
    return
  }
  var token = getSanitizedAuthorizationToken(authHeader)
  token = jwt.decode(token)
  if (!token || !token.userId || token.userId != userId) {
    context.fail(new Error("401_UNAUTHORIZED: Unauthorized access"))
    return
  }
  return token
}

function checkParamsForPreference(pType, event, context, token) {
  if (pType.toLowerCase() === 'email') {
    if (!token || !token.email) {
      context.fail(new Error("400_BAD_REQUEST: Missing Email param in Auth token"))
      return false
    }
  }
  return true
}

function afterPreferenceUpdate(pType, event, context, token) {
  var deferred = Q.defer();
  if (pType.toLowerCase() === 'email') {
    mailchimp.updateSubscriptions(token.email, event.body)
    // fire and forget the mailchimp call and resolve promise immediately
    deferred.resolve()
  } else {// always resolve
    deferred.resolve()
  }
  return deferred.promise
}

function afterPreferenceGet(pType, event, context, token) {
  var deferred = Q.defer();
  if (pType.toLowerCase() === 'email') {
    console.log(token.email)
    mailchimp.getSubscription(token.email)
    // fire and forget the mailchimp call and resolve promise immediately
    deferred.resolve()
  } else {// always resolve
    deferred.resolve()
  }
  return deferred.promise
}

function wrapResponse(context, status, body, pType) {
  var data = body && body[pType] ? body[pType] : {}
  var content = data
  if (pType) {
    if (pType.toLowerCase() === 'recentsearches') {
      content = []
      var prefArray = data.L ? data.L : []
      prefArray.forEach(function(prefItem) {
        content.push(prefItem.S)
      })
    } else if (pType.toLowerCase() === 'email') {
      content = data.M
    }
  }
  return {
    id: context.awsRequestId,
    result: {
      success: status === 200,
      status: status,
      content: content
    }
  }
}

/**
 * @brief Determine description based on request context
 * 
 * @param event lambda event obj
 * @param context lambda context
 * 
 * @return String operation
 */
function getOperation(event, context) {
  var method = _.get(event, 'context.http-method', '')
  var resourcePath = _.get(event, 'context.resource-path', '')
  switch (method.toUpperCase()) {
    case 'GET':
      var regex = new RegExp(/\/users\/\{userId\}\/preferences\/\{preferenceType\}/)
      if (regex.test(resourcePath)) {
        return 'VIEW_PREFERENCE'
      }
      break
    case 'POST':
      var regex = new RegExp(/\/users\/\{userId\}\/preferences\/\{preferenceType\}/)
      if (regex.test(resourcePath)) {
        return 'ADD_PERFERENCE'
      }
      break
    case 'PUT':
      var regex = new RegExp(/\/users\/\{userId\}\/preferences\/\{preferenceType\}/)
      if (regex.test(resourcePath)) {
        return 'UPDATE_PREFERENCE'
      }
      break
    default:
      return null
  }
}
