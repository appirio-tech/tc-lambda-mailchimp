/** == Imports == */
var request = require('request'),
  md5 = require('md5'),
  Q = require('q');


var MAILCHIMP_URL = 'https://us13.api.mailchimp.com/3.0'
var MAILCHIMP_LISTS_URL = MAILCHIMP_URL + '/lists'
var TOPCODER_MEMBERS_LIST_ID = process.env.TOPCODER_MEMBERS_LIST_ID

var TOPCODER_NL_GEN_ID = process.env.TOPCODER_NL_GEN_ID
var TOPCODER_NL_DEV_ID = process.env.TOPCODER_NL_DEV_ID
var TOPCODER_NL_DESIGN_ID = process.env.TOPCODER_NL_DESIGN_ID
var TOPCODER_NL_DATA_ID = process.env.TOPCODER_NL_DATA_ID
var TOPCODER_NL_TCO_ID = process.env.TOPCODER_NL_TCO_ID
var TOPCODER_NL_IOS_ID = process.env.TOPCODER_NL_IOS_ID


exports.updateSubscriptions = function(email, data) {
  var subscription = prepareSubscriptionRequest(data)
  subscription.email_address = email
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
  console.log(options)
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
      deferred.resolve(parseSubscription(body))
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

function parseSubscription(resp) {
  var subscription = {
    'TOPCODER_NL_GEN' : false,
    'TOPCODER_NL_DEV' : false,
    'TOPCODER_NL_DESIGN' : false,
    'TOPCODER_NL_DATA' : false,
    'TOPCODER_NL_TCO' : false,
    'TOPCODER_NL_IOS' : false
  }
  if (resp && resp.interests) {
    if (resp.interests[TOPCODER_NL_GEN_ID]) {
      subscription['TOPCODER_NL_GEN'] = true
    }
    if (resp.interests[TOPCODER_NL_DEV_ID]) {
      subscription['TOPCODER_NL_DEV'] = true
    }
    if (resp.interests[TOPCODER_NL_DESIGN_ID]) {
      subscription['TOPCODER_NL_DESIGN'] = true
    }
    if (resp.interests[TOPCODER_NL_DATA_ID]) {
      subscription['TOPCODER_NL_DATA'] = true
    }
    if (resp.interests[TOPCODER_NL_TCO_ID]) {
      subscription['TOPCODER_NL_TCO'] = true
    }
    if (resp.interests[TOPCODER_NL_IOS_ID]) {
      subscription['TOPCODER_NL_IOS'] = true
    }
  }
  return subscription
}

function prepareSubscriptionRequest(data, context) {
  data.email_type = 'html'
  data.status = 'subscribed'
  var mergeFields = {}
  if (data.firstName) {
    mergeFields.FNAME = data.firstName
  }
  if (data.lastName) {
    mergeFields.LNAME = data.lastName
  }
  if (data.firstName) {
    mergeFields.FNAME = data.firstName
  }
  data.merge_fields = mergeFields

  if (data.subscriptions) {
    data.interests = {}
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_GEN')) {
      data.interests[TOPCODER_NL_GEN_ID] = data.subscriptions['TOPCODER_NL_GEN']
    }
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_DEV')) {
      data.interests[TOPCODER_NL_DEV_ID] = data.subscriptions['TOPCODER_NL_DEV']
    }
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_DESIGN')) {
      data.interests[TOPCODER_NL_DESIGN_ID] = data.subscriptions['TOPCODER_NL_DESIGN']
    }
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_DATA')) {
      data.interests[TOPCODER_NL_DATA_ID] = data.subscriptions['TOPCODER_NL_DATA']
    }
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_TCO')) {
      data.interests[TOPCODER_NL_TCO_ID] = data.subscriptions['TOPCODER_NL_TCO']
    }
    if (data.subscriptions.hasOwnProperty('TOPCODER_NL_IOS')) {
      data.interests[TOPCODER_NL_IOS_ID] = data.subscriptions['TOPCODER_NL_IOS']
    }
  }

  return data
}