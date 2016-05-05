/** == Imports == */
var request = require('request'),
  md5 = require('md5'),
  Q = require('q');


var MAILCHIMP_URL = 'https://us13.api.mailchimp.com/3.0'
var MAILCHIMP_LISTS_URL = MAILCHIMP_URL + '/lists'
var TOPCODER_MEMBERS_LIST_ID = process.env.TOPCODER_MEMBERS_LIST_ID


exports.updateSubscriptions = function(email, body) {
  var subscription = prepareSubscriptionBody(body)
  subscription.email_address = token.email
  var listMembersUrl = MAILCHIMP_LISTS_URL + '/' + TOPCODER_MEMBERS_LIST_ID + '/members/'
  listMembersUrl += md5(email)
  var options = {
    uri: listMembersUrl,
    method: 'PUT',
    json: subscription,
    headers: {
      'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
    }
  }
  var deferred = Q.defer();
  request(options, function (error, response, body) {
    console.log(body)
    if (!error && response.statusCode == 200) {
      deferred.resolve()
    } else if(!error && response.statusCode === 401) {
      deferred.reject(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
    } else {
      if (body && body.status && body.status === 404) {
         deferred.reject(new Error("404_NOT_FOUND: Member or List not found"))
      } else {
         deferred.reject(new Error("500_INTERNAL_ERROR " + error))
      }
    }
  })
  return deferred.promise
}

exports.getSubscription = function(email) {
  var memberUrl = MAILCHIMP_LISTS_URL + '/' + TOPCODER_MEMBERS_LIST_ID + '/members/'
  memberUrl += md5(email)
  var options = {
    uri: memberUrl,
    method: 'GET',
    headers: {
      'Authorization': 'apiKey ' + process.env.MAILCHIMP_API_KEY
    }
  };

  var deferred = Q.defer();
  request(options, function (error, response, body) {
    console.log(body)
    if (!error && response.statusCode == 200) {
      deferred.resolve(body)
    } else if(!error && response.statusCode === 401) {
      deferred.reject(new Error("500_INTERNAL_ERROR " + "Unauthorized access to mailchimp"))
    } else if(!error && response.statusCode === 404) {
      deferred.reject(new Error("404_NOT_FOUND: Member or List not found"))
    } else {
      if (body && body.status && body.status === 404) {
        deferred.reject(new Error("404_NOT_FOUND: Member or List not found"))
      } else {
        deferred.reject(new Error("500_INTERNAL_ERROR " + error))
      }
    }
  });
  return deferred.promise
}

function prepareSubscriptionBody(body, context) {
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