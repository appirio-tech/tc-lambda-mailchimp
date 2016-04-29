/**
 * Add mocks here .. cos well.. just do it..
 */
var AWS = require('aws-sdk')
var DynamoDB = {}
AWS.DynamoDB = function() {
  return DynamoDB
}
var DocumentClient = {}
AWS.DynamoDB.DocumentClient = function() {
  return DocumentClient
}

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
    "stage": "test-invoke-stage",
    "requestId": "test-invoke-request",
    "resourcePath": "/v3/preferences",
    "resourceId": "dxtdde",
    "httpMethod": "GET",
    "sourceIp": "test-invoke-source-ip",
    "userAgent": "Apache-HttpClient/4.3.4 (java 1.5)",
    "caller": "AIDAJJMZ5ZCBYPW45NZRC",
    "body": "{}",
    "queryParams": {
      "objectId": "22698855"
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