/** == Imports == */
var request = require('request'),
  _ = require('lodash'),
  md5 = require('md5'),
  jwt = require('jsonwebtoken');

var querystring = require('querystring')


var MAILCHIMP_URL = 'https://us13.api.mailchimp.com/3.0'
var MAILCHIMP_LISTS_URL = MAILCHIMP_URL + '/lists'

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
  console.log('Received event:', JSON.stringify(event, null, 2));
  var operation = getOperation(event, context)

  // convert query params to JSON
  switch (operation) {
    case 'ADD_MEMBER':
      var listId = _.get(event, 'params.path.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"))
        break
      }
      var userId = _.get(event, 'body.userId', -1)
      if (!userId) {
        context.fail(new Error("400_BAD_REQUEST: 'userId' param is currently required"))
        break
      }
      var token = checkAuthorization(userId, event, context)
      if (!token || !token.email) {
        context.fail(new Error("400_BAD_REQUEST: Missing Email param in Auth token"))
        break
      }
      var subscription = prepareSubscriptionBody(event, context)
      subscription.email_address = token.email
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members'
      var options = {
        uri: listMembersUrl,
        method: 'POST',
        json: subscription,
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };
      request(options, function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
          context.succeed(wrapResponse(context, 200, null, 1))
        } else if(!error && response.statusCode === 400) {
          context.fail(new Error("400_INTERNAL_ERROR " + "Member already existing the target list"))
        } else if(!error && response.statusCode === 401) {
          context.fail(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
        } else {
          if (body && body.status && body.status === 404) {
            context.fail(new Error("404_NOT_FOUND: Member or List not found"))
          } else {
            context.fail(new Error("500_INTERNAL_ERROR " + error))
          }
        }
      })
      break
    case 'UPDATE_MEMBER':
      var listId = _.get(event, 'params.path.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"))
        break
      }
      var userId = _.get(event, 'body.userId', -1)
      if (!userId) {
        context.fail(new Error("400_BAD_REQUEST: 'userId' param is currently required"))
        break
      }
      var token = checkAuthorization(userId, event, context)
      if (!token || !token.email) {
        context.fail(new Error("400_BAD_REQUEST: Missing Email param in Auth token"))
        break
      }
      var subscription = prepareSubscriptionBody(event, context)
      subscription.email_address = token.email
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members/'
      listMembersUrl += md5(token.email)
      var options = {
        uri: listMembersUrl,
        method: 'PUT',
        json: subscription,
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };
      request(options, function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
          context.succeed(wrapResponse(context, 200, null, 1))
        } else if(!error && response.statusCode === 401) {
          context.fail(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
        } else {
          if (body && body.status && body.status === 404) {
            context.fail(new Error("404_NOT_FOUND: Member or List not found"))
          } else {
            context.fail(new Error("500_INTERNAL_ERROR " + error))
          }
        }
      })
      break
    case 'VIEW_MEMBER':
      // make sure name param was passed is non-empty
      var listId = _.get(event, 'params.path.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"));
        break;
      }
      var userId = _.get(event, 'params.path.userId', -1)
      if (!userId) {
        context.fail(new Error("400_BAD_REQUEST: 'userId' param is currently required"))
        break
      }
      var token = checkAuthorization(userId, event, context)
      if (!token || !token.email) {
        context.fail(new Error("400_BAD_REQUEST: Missing Email param in Auth token"))
        break
      }
      var memberUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members/'
      memberUrl += md5(token.email)
      var options = {
        uri: memberUrl,
        method: 'GET',
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };

      request(options, function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
          context.succeed(wrapResponse(context, 200, body, 1))
        } else if(!error && response.statusCode === 401) {
          context.fail(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
        } else if(!error && response.statusCode === 404) {
          context.fail(new Error("404_NOT_FOUND: Member or List not found"))
        } else {
          if (body && body.status && body.status === 404) {
            context.fail(new Error("404_NOT_FOUND: Member or List not found"))
          } else {
            context.fail(new Error("500_INTERNAL_ERROR " + error))
          }
        }
      });
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

function prepareSubscriptionBody(event, context) {
  var body = event.body
  body.email_type = 'html'
  body.status = 'subscribed'
  var mergeFields = {}
  if (body.firstName) {
    mergeFields.FNAME = body.firstName
  }
  if (body.lastName) {
    mergeFields.LNAME = body.lastName
  }
  if (body.firstName) {
    mergeFields.FNAME = body.firstName
  }
  body.merge_fields = mergeFields
  return body
}

function wrapResponse(context, status, body, count) {
  return {
    id: context.awsRequestId,
    result: {
      success: status === 200,
      status: status,
      content: JSON.parse(body)
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
      var regex = new RegExp(/\/members\/\{userId\}/)
      if (regex.test(resourcePath)) {
        return 'VIEW_MEMBER'
      }
      break
    case 'POST':
      if (resourcePath.endsWith('/members') || resourcePath.endsWith('/members/')) {
        return 'ADD_MEMBER'
      }
      break
    case 'PUT':
      if (resourcePath.endsWith('/members') || resourcePath.endsWith('/members/')) {
        return 'UPDATE_MEMBER'
      }
      break
    default:
      return null
  }
}
