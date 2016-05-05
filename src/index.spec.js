/**
 * Add mocks here .. cos well.. just do it..
 */
var AWS = require('aws-sdk')
var DynamoDB = {}
AWS.DynamoDB = function() {
  return DynamoDB
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

describe('When receiving an invalid request (without any params)', function() {
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
      "resource-path" : "/v3/lists/{listId}/members/{userId}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 400 error msg', function() {
      expect(resp.error.message).to.match(/400_BAD_REQUEST/)
    })
  })
})

describe('When receiving an invalid request (without listId)', function() {
  var resp = { success: null, error: null };
  const ctx = context()
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "userId": "22688955"
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
      "resource-path" : "/v3/lists/{listId}/members/{userId}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 400 error msg', function() {
      expect(resp.error.message).to.match(/400_BAD_REQUEST/)
    })
  })
})

describe('When receiving an invalid request (without userId)', function() {
  var resp = { success: null, error: null };
  const ctx = context()
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "listId": "72cdd94102"
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
      "resource-path" : "/v3/lists/{listId}/members/{userId}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 400 error msg', function() {
      expect(resp.error.message).to.match(/400_BAD_REQUEST/)
    })
  })
})


describe('When receiving an invalid request (without token)', function() {
  var resp = { success: null, error: null };
  const ctx = context()
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "listId": "72cdd94102",
        "userId": "22688955"
      },
      "querystring" : {
      },
      "header" : {
        //"Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6W10sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJ2aWthc3JvaGl0IiwiZXhwIjoxNDYyMTc1NTM3LCJ1c2VySWQiOiIyMjY4ODk1NSIsImlhdCI6MTQ2MjE3NDkzNywiZW1haWwiOiJlbWFpbEBkb21haW4uY29tLnoiLCJqdGkiOiJjZjZlNTVhOC01MGU2LTQwM2ItODUwNC03YzNkNTlhMmJjNWQifQ.0s8HXhbZJQ1nvKDpiqKUyyP17wijVx48HSIticU2dnw"
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
      "resource-path" : "/v3/lists/{listId}/members/{userId}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 401 error msg', function() {
      expect(resp.error.message).to.match(/401_UNAUTHORIZED/)
    })
  })
})


describe('When receiving an invalid token', function() {
  var resp = { success: null, error: null };
  const ctx = context()
  testLambda({
    "body" : {},
    "params" : {
      "path" : {
        "listId": "72cdd94102",
        "userId": "22688955"
      },
      "querystring" : {
      },
      "header" : {
        "Authorization" : "Bearer faketoken"
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
      "resource-path" : "/v3/lists/{listId}/members/{userId}"
    }
  }, ctx, resp)

  describe('then response object ', function() {
    it('should be an error object', function() {
      expect(resp.error).to.exist
        .and.be.instanceof(Error)
    })

    it('should contain 401 error msg', function() {
      expect(resp.error.message).to.match(/401_UNAUTHORIZED/)
    })
  })
})