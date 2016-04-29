/** == Imports == */
var request = require('request'),
  _ = require('lodash'),
  md5 = require('md5');

var querystring = require('querystring')


var MAILCHIMP_URL = 'https://us13.api.mailchimp.com/3.0'
var MAILCHIMP_LISTS_URL = MAILCHIMP_URL + '/lists'

String.prototype.endsWith = function(str) {
  var lastIndex = this.lastIndexOf(str);
  return (lastIndex !== -1) && (lastIndex + str.length === this.length);
}

/**
 * Entry point for lambda function handler
 */
exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  var operation = getOperation(event, context)

  // convert query params to JSON
  switch (operation) {
    case 'ADD_MEMBER':
      var listId = _.get(event, 'queryParams.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"))
        break
      }
      var emailAddress = _.get(event, 'body.email_address', '')
      if (emailAddress.length == 0) {
        context.fail(new Error("400_BAD_REQUEST: 'emailAddress' param is currently required"))
        break
      }
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members'
      var options = {
        uri: listMembersUrl,
        method: 'POST',
        json: prepareSubscriptionBody(event.body),
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
          context.fail(new Error("500_INTERNAL_ERROR " + error.message))
        }
      })
      break
    case 'UPDATE_MEMBER':
      var listId = _.get(event, 'queryParams.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"))
        break
      }
      var emailAddress = _.get(event, 'body.email_address', '')
      if (emailAddress.length == 0) {
        context.fail(new Error("400_BAD_REQUEST: 'emailAddress' param is currently required"))
        break
      }
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members/'
      listMembersUrl += md5(emailAddress)
      var options = {
        uri: listMembersUrl,
        method: 'PUT',
        json: prepareSubscriptionBody(event.body),
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
          context.fail(new Error("500_INTERNAL_ERROR " + error.message))
        }
      })
      break
    case 'VIEW_MEMBER':
      // make sure name param was passed is non-empty
      var listId = _.get(event, 'queryParams.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"));
        break;
      }
      // make sure name param was passed is non-empty
      var emailHash = _.get(event, 'queryParams.email', '')
      if (emailHash.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'email' param is currently required"));
        break;
      }
      var memberUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members/'
      memberUrl += emailHash
      var options = {
        uri: memberUrl,
        method: 'GET',
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          context.succeed(wrapResponse(context, 200, body, 1))
        } else if(!error && response.statusCode === 401) {
          context.fail(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + error))
        }
      });
      break
    case 'LIST_MEMBERS':
      // make sure name param was passed is non-empty
      var listId = _.get(event, 'queryParams.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"));
        break;
      }
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members'
      var options = {
        uri: listMembersUrl,
        method: 'GET',
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          context.succeed(wrapResponse(context, 200, body, 1))
        } else if(!error && response.statusCode === 401) {
          context.fail(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + error))
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

function prepareSubscriptionBody(body) {
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
  switch (event.httpMethod.toUpperCase()) {
    case 'GET':
      if (event.resourcePath.endsWith('/members') || event.resourcePath.endsWith('/members/')) {
        return 'LIST_MEMBERS'
      }
      var regex = new RegExp(/\/members\/[a-zA-Z0-9]*/)
      if (regex.test(event.resourcePath)) {
        return 'VIEW_MEMBER'
      }
      break
    case 'POST':
      if (event.resourcePath.endsWith('/members') || event.resourcePath.endsWith('/members/')) {
        return 'ADD_MEMBER'
      }
      break
    case 'PUT':
      if (event.resourcePath.endsWith('/members') || event.resourcePath.endsWith('/members/')) {
        return 'UPDATE_MEMBER'
      }
      break
    default:
      return null
  }
}
