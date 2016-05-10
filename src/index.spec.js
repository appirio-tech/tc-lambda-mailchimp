/**
 * Add mocks here .. cos well.. just do it..
 */
var AWS = require('aws-sdk'),
    Q = require('q')
var DynamoDB = {}
AWS.DynamoDB = function() {
  return DynamoDB
}
var DocumentClient = {}
AWS.DynamoDB.DocumentClient = function() {
  return DocumentClient
}

var mailchimp = require('./mailchimp.service.js')

var chai = require("chai");
var expect = require("chai").expect,
  lambdaToTest = require('./index.js');

sinon = require("sinon");
chai.use(require('sinon-chai'));
const context = require('aws-lambda-mock-context');

var testLambda = function(event, ctx, resp) {
  // Fires once for the group of tests, done is mocha's callback to 
  // let it know that an   async operation has completed before running the rest 
  // of the tests, 2000ms is the default timeout though
  before(function(done) {
    //This fires the event as if a Lambda call was being sent in
    lambdaToTest.handler(event, ctx)
      //Captures the response and/or errors
    ctx.Promise
      .then(function(response) {
        resp.success = response;
        done();
      })
      .catch(function(err) {
        resp.error = err;
        done();
      })
  })
}

describe('When receiving an invalid request', function() {
  var resp = { success: null, error: null };
  const ctx = context()
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
      },
      "querystring" : {
      },
      "header" : {
        "Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W10sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ2aWthc3JvaGl0IiwiZXhwIjoxNDYyMTc1NTM3LCJ1c2VySWQiOiIyMjY4ODk1NSIsImlhdCI6MTQ2MjE3NDkzNywiZW1haWwiOiJlbWFpbEBkb21haW4uY29tLnoiLCJqdGkiOiJjZjZlNTVhOC01MGU2LTQwM2ItODUwNC03YzNkNTlhMmJjNWQifQ.0s8HXhbZJQ1nvKDpiqKUyyP17wijVx48HSIticU2dnw"
      }
    },
    "stage-variables" : {
    },
    "context" : {
      "http-method" : "GET",
      "stage" : "test-invoke-stage",
      "source-ip" : "test-invoke-source-ip",
      "user" : "AIDAIMBY5G7X4KB6FEHDQ",
      "user-agent" : "Apache-HttpClient/4.3.4 (java 1.5)",
      "user-arn" : "arn:aws:iam::811668436784:user/vagarwal",
      "resource-path" : "/v3/users/{userId}/preferences/{preferenceType}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      console.log(resp.error)
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 400 error msg', function() {
      expect(resp.error.message).to.match(/400_BAD_REQUEST/)
    })
  })
})

xdescribe('When receiving a valid search request', function() {
  var resp = { success: null, error: null }
  const ctx = context()

  DynamoDB.query = function(options, callback) {
    callback.apply(DynamoDB, [null, {
      Items: [
        {
          recentSearches: {
            L : ['Java', 'React', 'CSS']
          }
        }
      ]
    }])
  }
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "userId" : "22688955",
        "preferenceType": "recentSearches"
      },
      "querystring" : {
      },
      "header" : {
        "Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W10sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ2aWthc3JvaGl0IiwiZXhwIjoxNDYyMTc1NTM3LCJ1c2VySWQiOiIyMjY4ODk1NSIsImlhdCI6MTQ2MjE3NDkzNywiZW1haWwiOiJlbWFpbEBkb21haW4uY29tLnoiLCJqdGkiOiJjZjZlNTVhOC01MGU2LTQwM2ItODUwNC03YzNkNTlhMmJjNWQifQ.0s8HXhbZJQ1nvKDpiqKUyyP17wijVx48HSIticU2dnw"
      }
    },
    "stage-variables" : {
    },
    "context" : {
      "http-method" : "GET",
      "stage" : "test-invoke-stage",
      "source-ip" : "test-invoke-source-ip",
      "user" : "AIDAIMBY5G7X4KB6FEHDQ",
      "user-agent" : "Apache-HttpClient/4.3.4 (java 1.5)",
      "user-arn" : "arn:aws:iam::811668436784:user/vagarwal",
      "resource-path" : "/v3/users/{userId}/preferences/{preferenceType}"
    }
  }, ctx, resp)

  describe('then success response ', function() {
    var spy = sinon.spy(DynamoDB, 'query')
    it('should be a valid response', function() {
      console.log(resp)
      var result = resp.success.result
      // console.log(result)
      expect(spy.calledOnce).to.be.true
      expect(resp.success.result).to.not.be.null
      expect(result.success).to.be.true
      expect(result.status).to.equal(200)
      expect(resp.success.result).to.not.be.null
      expect(result.content).to.have.lengthOf(3)
    })
  })
})


describe('When receiving a valid search request for email settings', function() {
  var resp = { success: null, error: null }
  const ctx = context()
  // DynamoDB.query = function(options, callback) {
  //   callback.apply(DynamoDB, [null, {
  //     Items: [
  //       {
  //         email: {
  //           M : {
  //             'TOPCODER_NL_DEV' : true,
  //             'TOPCODER_NL_DESIGN' : true,
  //             'TOPCODER_NL_DATA' : false
  //           }
  //         }
  //       }
  //     ]
  //   }])
  // }
  DocumentClient.get = function(options, callback) {
    callback.apply(DocumentClient, [null, {
      Item: {
        email: {
          'TOPCODER_NL_DEV' : true,
          'TOPCODER_NL_DESIGN' : true,
          'TOPCODER_NL_DATA' : false
        }
      }
    }])
  }
  sinon.stub(mailchimp, 'getSubscription', function(email) {
    var deferred = Q.defer();
    if (email === 'email@domain.com.z') {
      deferred.resolve({id: '12345', email_address: 'hassubscription@topcoder.com'}) 
    } else {
      deferred.reject(new Error("404_NOT_FOUND"))
    }
    return deferred.promise
  })
  sinon.stub(mailchimp, 'updateSubscriptions', function(email, body) {
    var deferred = Q.defer();
    if (email === 'email@domain.com.z') {
      deferred.resolve() 
    } else {
      deferred.reject()
    }
    return deferred.promise
  })
  
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "userId" : "22688955",
        "preferenceType": "email"
      },
      "querystring" : {
      },
      "header" : {
        "Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W10sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ2aWthc3JvaGl0IiwiZXhwIjoxNDYyMTc1NTM3LCJ1c2VySWQiOiIyMjY4ODk1NSIsImlhdCI6MTQ2MjE3NDkzNywiZW1haWwiOiJlbWFpbEBkb21haW4uY29tLnoiLCJqdGkiOiJjZjZlNTVhOC01MGU2LTQwM2ItODUwNC03YzNkNTlhMmJjNWQifQ.0s8HXhbZJQ1nvKDpiqKUyyP17wijVx48HSIticU2dnw"
      }
    },
    "stage-variables" : {
    },
    "context" : {
      "http-method" : "GET",
      "stage" : "test-invoke-stage",
      "source-ip" : "test-invoke-source-ip",
      "user" : "AIDAIMBY5G7X4KB6FEHDQ",
      "user-agent" : "Apache-HttpClient/4.3.4 (java 1.5)",
      "user-arn" : "arn:aws:iam::811668436784:user/vagarwal",
      "resource-path" : "/v3/users/{userId}/preferences/{preferenceType}"
    }
  }, ctx, resp)

  describe('then success response ', function() {
    var spy = sinon.spy(DocumentClient, 'get')
    it('should be a valid response', function() {
      var result = resp.success.result
      expect(spy.calledOnce).to.be.true
      expect(mailchimp.getSubscription.calledOnce).to.be.true
      expect(resp.success.result).to.not.be.null
      expect(result.success).to.be.true
      expect(result.status).to.equal(200)
      expect(resp.success.result).to.not.be.null
      expect(result.content).to.exist
      console.log(result)
      expect(result.content['TOPCODER_NL_DEV']).to.be.true
      expect(result.content['TOPCODER_NL_DESIGN']).to.be.true
      expect(result.content['TOPCODER_NL_DATA']).to.be.false
    })
  })
})