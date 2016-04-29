/** == Imports == */
var request = require('request'),
  _ = require('lodash');

var querystring = require('querystring')


const MAILCHIMP_URL = 'https://us13.api.mailchimp.com/3.0'
const MAILCHIMP_LISTS_URL = MAILCHIMP_URL + '/lists'

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
      console.log(event.body.email_address)
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
        if (!error && response.statusCode == 200) {
          console.log(body) // Show the HTML for the Google homepage.
          context.succeed(wrapResponse(context, 200, null, pType, 1))
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + error.message))
        }
      })
      break
    case 'LIST_MEMBERS':
      // make sure name param was passed is non-empty
      var listId = _.get(event, 'queryParams.listId', '')
      if (listId.trim().length === 0) {
        context.fail(new Error("400_BAD_REQUEST: 'listId' param is currently required"));
      }
      var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + listId + '/members'
      var options = {
        uri: listMembersUrl,
        method: 'GET',
        headers: {
          'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
        }
      };
      console.log(process.env.mailchimpAPIKey)
      console.log(process.env.MAILCHIMP_API_KEY)
      console.log(context)
      request(listMembersUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body) // Show the HTML for the Google homepage.
          context.succeed(wrapResponse(context, 200, body, pType, 1))
        } else {
          context.fail(new Error("500_INTERNAL_ERROR " + error.message))
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

function prepareSubscriptionBody(body) {
  body.email_type = 'html'
  body.status = 'subscribed'
  reutn body
}

function wrapResponse(context, status, body, preferenceType, count) {
  return {
    id: context.awsRequestId,
    result: {
      success: status === 200,
      status: status,
      content: body
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
    case 'POST':
      if (event.resourcePath.endsWith('/members') || event.resourcePath.endsWith('/members/')) {
        return 'ADD_MEMBER'
      }
    default:
      return null
  }
}
