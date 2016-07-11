/*jshint -W030 */

var jsdom = require("jsdom");
global.document = jsdom.jsdom("<html><body></body></html>");
global.window = global.document.parentWindow;

var sinon = require("sinon");
var chai = require("chai");
var expect = chai.expect;
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var sandbox;
var noop = function () {};

var mockGetFiles = function () {
  return {0: {name: "file1"}, 1: {name: "file2"}, length: 2};
};

var mockEmptyGetFiles = function () {
  return {length: 0};
};
var LiteUploader = require("../liteuploader");

describe("Lite Uploader", function () {

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("uploader object and options defaults", function () {
    it("should be able to be instantiated", function () {
      sandbox.stub(LiteUploader.prototype, "_applyDefaults").returns({tester: "abc"});
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      expect(liteUploader).to.exist;
      expect(liteUploader.options).to.eql({tester: "abc"});
      expect(liteUploader._getFiles).to.be.a("function");
      expect(liteUploader._triggerEvent).to.be.a("function");
      expect(liteUploader.xhrs).to.eql([]);
    });

    it("should fallback to defaults if not all options are passed in", function () {
      var liteUploader = new LiteUploader({}, noop, noop);

      expect(liteUploader.options.beforeRequest).to.be.a("function");
      expect(liteUploader.options.script).to.eql(null);
      expect(liteUploader.options.ref).to.eql(null);
      expect(liteUploader.options.headers).to.eql({});
      expect(liteUploader.options.params).to.eql({});
      expect(liteUploader.options.rules).to.eql({});
      expect(liteUploader.options.singleFileUploads).to.eql(false);
    });

    it("default beforeRequest method should return a promise", function () {
      var liteUploader = new LiteUploader({}, noop, noop);

      return liteUploader.options.beforeRequest([], "formData")
        .then(function (res) {
          expect(res).to.eql("formData");
        });
    });
  });

  describe("instantiation", function () {
    it("should throw error if there is no file list", function () {
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var liteUploader = new LiteUploader({script: "script"}, function () { return undefined; }, noop);

      expect(function () {
        liteUploader._init();
      }).to.throw("No files");
    });

    it("should throw error if the file list is empty", function () {
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var liteUploader = new LiteUploader({script: "script"}, mockEmptyGetFiles, noop);

      expect(function () {
        liteUploader._init();
      }).to.throw("No files");
    });

    it("should trigger 'error' event if there are options errors and not proceed with upload", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns("foo");
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      return liteUploader._init()
      .then(function () {
        expect(mockOnEvent.callCount).to.eql(1);
        expect(mockOnEvent).to.have.been.calledWith("lu:errors", "foo");
        expect(liteUploader._startUpload).not.to.have.been.called;
      });
    });

    it("should trigger 'error' event if there are file errors and not proceed with upload", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns("bar");
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      return liteUploader._init()
      .then(function () {
        expect(mockOnEvent.callCount).to.eql(1);
        expect(mockOnEvent).to.have.been.calledWith("lu:errors", "bar");
        expect(liteUploader._startUpload).not.to.have.been.called;
      });
    });

    it("should trigger 'start' event if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var mockFileList = mockGetFiles();
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      return liteUploader._init()
      .then(function () {
        expect(mockOnEvent.callCount).to.eql(1);
        expect(mockOnEvent).to.have.been.calledWith("lu:start", mockFileList);
      });
    });

    it("should clear any previous references to built xhr objects before starting another upload", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      liteUploader.xhrs = ["foo"];
      return liteUploader._init()
      .then(function () {
        expect(liteUploader.xhrs.length).to.eql(0);
      });
    });

    it("should proceed with upload if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, noop);

      return liteUploader._init()
      .then(function () {
        expect(liteUploader._startUpload).to.have.been.calledOnce;
        expect(liteUploader._startUpload).to.have.been.calledWith(mockFileList);
      });
    });

    it("should proceed with upload with injected files if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUpload");
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, noop);

      return liteUploader._init("foo")
      .then(function () {
        expect(liteUploader._startUpload).to.have.been.calledOnce;
        expect(liteUploader._startUpload).to.have.been.calledWith("foo");
      });
    });
  });

  describe("start upload", function () {
    it("should upload all files in one request by default", function () {
      var mockXhrObject = {
        send: sandbox.spy()
      };
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").returns(mockXhrObject);
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"));
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);
      var mockFileList = mockGetFiles();

      return Promise.all(liteUploader._startUpload(mockFileList))
      .then(function () {
        expect(mockXhrObject.send).to.have.been.calledOnce;
      });
    });

    it("should split all files into separate requests if singleFileUploads option is true", function () {
      var mockXhrObject = {
        send: sandbox.spy()
      };
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").returns(mockXhrObject);
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"));
      var liteUploader = new LiteUploader({script: "script", singleFileUploads: true}, noop, noop);
      var mockFileList = mockGetFiles();

      return Promise.all(liteUploader._startUpload(mockFileList))
      .then(function () {
        expect(mockXhrObject.send).to.have.been.calledTwice;
      });
    });

    it("should send formData with xhr request", function () {
      var mockXhrObject = {
        send: sandbox.spy()
      };
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").returns(mockXhrObject);
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"));
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);
      var mockFileList = mockGetFiles();

      return Promise.all(liteUploader._startUpload(mockFileList))
      .then(function () {
        expect(mockXhrObject.send).to.have.been.calledWith("foo");
      });
    });
  });

  describe("before request", function () {
    it("should trigger 'before' event with files", function () {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns("resolved");
      var mockOnEvent = sandbox.stub();
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, mockOnEvent);

      liteUploader._beforeRequest(mockFileList);

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:before", mockFileList);
    });

    it("should collate form data and pass it to beforeRequest function with files", function () {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns("resolved");
      var mockOnEvent = sandbox.stub();
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, mockOnEvent);

      liteUploader._beforeRequest(mockFileList);

      expect(beforeRequest).to.have.been.calledWith(mockFileList, "collated");
    });

    it("should return beforeRequest response", function () {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns("resolved");
      var mockOnEvent = sandbox.stub();
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, mockOnEvent);

      var result = liteUploader._beforeRequest(mockFileList);

      expect(result).to.eql("resolved");
    });
  });

  describe("options errors", function () {
    it("should return error if there is no ref set", function () {
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);

      var result = liteUploader._validateOptions();

      expect(result).to.eql([{name: "_options", errors: [{type: "refRequired"}]}]);
    });

    it("should return error if the script option is blank", function () {
      var liteUploader = new LiteUploader({ref: "ref"}, noop, noop);

      var result = liteUploader._validateOptions();

      expect(result).to.eql([{name: "_options", errors: [{type: "scriptRequired"}]}]);
    });

    it("should return null if no options errors are found", function () {
      var liteUploader = new LiteUploader({script: "script", ref: "ref"}, noop, noop);

      var result = liteUploader._validateOptions();

      expect(result).to.eql(null);
    });
  });

  describe("file type validator", function () {
    it("should return undefined if the file type exactly matches an allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._allowedFileTypeValidator("image/jpeg,image/png", {type: "image/jpeg"});

      expect(res).to.eq(undefined);
    });

    it("should return error object if the file type is not a match for the allowed file type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._allowedFileTypeValidator("image/gif", {type: "image/jpeg"});

      expect(res).to.eql({
        type: "type",
        rule: "image/gif",
        given: "image/jpeg"
      });
    });

    it("should return undefined if the file type matches a wildcard allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._allowedFileTypeValidator("image/*,video/*", {type: "image/jpeg"});

      expect(res).to.eq(undefined);
    });

    it("should return error object if the file type does not match a wildcard allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._allowedFileTypeValidator("image/*", {type: "text/plain"});

      expect(res).to.eql({
        type: "type",
        rule: "image/*",
        given: "text/plain"
      });
    });
  });

  describe("file size validator", function () {
    it("should return undefined if the file size is below limit", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._maxSizeValidator(200, {size: 199});

      expect(res).to.eq(undefined);
    });

    it("should return error object if the file is above limit", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._maxSizeValidator(200, {size: 201});

      expect(res).to.eql({
        type: "size",
        rule: 200,
        given: 201
      });
    });
  });

  describe("file errors", function () {
    it("should return errors if any are found", function () {
      var allowedFileTypeValidatorStub = sandbox.stub(LiteUploader.prototype, "_allowedFileTypeValidator")
      allowedFileTypeValidatorStub.onCall(0).returns("foo");
      allowedFileTypeValidatorStub.onCall(1).returns(undefined);
      var maxSizeValidatorStub = sandbox.stub(LiteUploader.prototype, "_maxSizeValidator")
      maxSizeValidatorStub.onCall(0).returns("bar");
      maxSizeValidatorStub.onCall(1).returns("bar");
      var liteUploader = new LiteUploader({
        script: "script",
        rules: {
          allowedFileTypes: "a,b,c",
          maxSize: 20
        }}, noop, noop);

      return liteUploader._validateFiles(mockGetFiles())
      .then(function (result) {
        expect(result).to.eql([
          {name: "file1", errors: ["foo", "bar"]},
          {name: "file2", errors: ["bar"]}
        ]);
      });
    });

    it("should return null if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_allowedFileTypeValidator").returns(undefined);
      sandbox.stub(LiteUploader.prototype, "_maxSizeValidator").returns(undefined);
      var liteUploader = new LiteUploader({
        script: "script",
        rules: {
          allowedFileTypes: "a,b,c"
        }}, noop, noop);

      return liteUploader._validateFiles(mockGetFiles())
      .then(function (result) {
        expect(result).to.eql(null);
      });
    });
  });

  describe("form data", function () {
    beforeEach(function () {
      var formDataObject = {
        data: [],
        append: function (key, value) {
          var obj = {};
          obj[key] = value;
          this.data.push(obj);
        },
        get: function () {
          return this.data;
        }
      };

      sandbox.stub(LiteUploader.prototype, "_getFormDataObject").returns(formDataObject);
    });

    it("should add any params to form data", function () {
      var liteUploader = new LiteUploader({params: {tester: 123, another: "abc"}}, noop, noop);

      var result = liteUploader._collateFormData([]);

      expect(result.get()).to.eql([{tester: 123}, {another: "abc"}]);
    });

    it("should add any files to form data", function () {
      var liteUploader = new LiteUploader({params: {}, ref: "tester"}, noop, noop);

      var result = liteUploader._collateFormData(["tester1", "tester2"]);

      expect(result.get()).to.eql([{"tester": "tester1"}, {"tester": "tester2"}]);
    });
  });

  describe("building xhr object", function () {
    var mockXmlHttpRequestObject;

    beforeEach(function () {
      mockXmlHttpRequestObject = {
        open: sandbox.spy(),
        setRequestHeader: sandbox.spy(),
        addEventListener: sandbox.spy(),
        upload: {
          addEventListener: sandbox.spy()
        }
      };

      sandbox.stub(LiteUploader.prototype, "_getXmlHttpRequestObject").returns(mockXmlHttpRequestObject);
    });

    afterEach(function () {
      mockXmlHttpRequestObject = null;
    })

    it("should open it with correct method and url", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}}, noop, noop);

      liteUploader._buildXhrObject();

      expect(mockXmlHttpRequestObject.open).to.have.been.calledWith("POST", "abc");
    });

    it("should set headers using passed in option", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}, headers: {foo: "bar", abc: "def"}}, noop, noop);

      liteUploader._buildXhrObject();

      expect(mockXmlHttpRequestObject.setRequestHeader.callCount).to.eql(2);
      expect(mockXmlHttpRequestObject.setRequestHeader.getCall(0)).to.have.been.calledWith("foo", "bar");
      expect(mockXmlHttpRequestObject.setRequestHeader.getCall(1)).to.have.been.calledWith("abc", "def");
    });

    it("should add listeners for progress and error events", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}, headers: {foo: "bar", abc: "def"}}, noop, noop);

      liteUploader._buildXhrObject();

      expect(mockXmlHttpRequestObject.upload.addEventListener).to.have.been.calledOnce;
      expect(mockXmlHttpRequestObject.upload.addEventListener.getCall(0).args[0]).to.eql("progress");
      expect(mockXmlHttpRequestObject.upload.addEventListener.getCall(0).args[1]).to.be.a("function");
      expect(mockXmlHttpRequestObject.upload.addEventListener.getCall(0).args[2]).to.eql(false);
      expect(mockXmlHttpRequestObject.addEventListener).to.have.been.calledOnce;
      expect(mockXmlHttpRequestObject.addEventListener.getCall(0).args[0]).to.eql("error");
      expect(mockXmlHttpRequestObject.addEventListener.getCall(0).args[1]).to.be.a("function");
      expect(mockXmlHttpRequestObject.addEventListener.getCall(0).args[2]).to.eql(false);
    });

    it("should call success function with response when xhr object indicates success", function () {
      sandbox.stub(LiteUploader.prototype, "_onXHRSuccess");
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}}, noop, noop);

      liteUploader._buildXhrObject();
      expect(liteUploader._onXHRSuccess.callCount).to.eql(0);

      liteUploader.xhrs[0].readyState = 3;
      liteUploader.xhrs[0].status = 199;
      liteUploader.xhrs[0].onreadystatechange()
      expect(liteUploader._onXHRSuccess.callCount).to.eql(0);

      liteUploader.xhrs[0].readyState = 4;
      liteUploader.xhrs[0].status = 200;
      liteUploader.xhrs[0].responseText = "responseText";
      liteUploader.xhrs[0].onreadystatechange()
      expect(liteUploader._onXHRSuccess.callCount).to.eql(1);
      expect(liteUploader._onXHRSuccess).to.have.been.calledWith("responseText");
    });

    it("should keep a reference to the built object for later use", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}}, noop, noop);

      expect(liteUploader.xhrs.length).to.eql(0);
      liteUploader._buildXhrObject();

      expect(liteUploader.xhrs.length).to.eql(1);
    });

    it("should return xhr instance", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}}, noop, noop);

      var result = liteUploader._buildXhrObject();

      expect(result).to.eql(mockXmlHttpRequestObject);
    });
  });

  describe("progress event", function () {
    it("should trigger 'progress' event when possible", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader._onXHRProgress({
        lengthComputable: true,
        loaded: 2.1,
        total: 10.3
      });

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:progress", 20);
    });
  })

  describe("success event", function () {
    it("should trigger 'success' event with response", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader._onXHRSuccess("response");

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:success", "response");
    });
  });

  describe("failure event", function () {
    it("should trigger 'fail' event with response", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader._onXHRFailure("jqXHR");

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:fail", "jqXHR");
    });
  });

  describe("start upload", function () {
    it("should initiate the upload", function () {
      sandbox.stub(LiteUploader.prototype, "_init");
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      liteUploader.startUpload();

      expect(liteUploader._init).to.have.been.called;
    });
  });

  describe("add params", function () {
    it("should add extra params onto params hash defined on instantiation", function () {
      var liteUploader = new LiteUploader({params: {foo: "123"}}, noop, noop);

      liteUploader.addParam("bar", "456");

      expect(liteUploader.options.params).to.eql({foo: "123", bar: "456"});
    });
  });

  describe("cancel upload", function () {
    it("should abort the upload", function () {
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);
      liteUploader.xhrs = [{
        abort: sandbox.spy()
      }];

      liteUploader.cancelUpload();

      expect(liteUploader.xhrs[0].abort).to.have.been.called;
    });

    it("should trigger 'cancelled' event", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader.cancelUpload();

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:cancelled");
    });
  });

  describe("global object methods", function () {
    describe("_getXmlHttpRequestObject", function () {
      it("should return an object", function () {
        var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

        global.XMLHttpRequest = function () {};
        var res = liteUploader._getXmlHttpRequestObject();

        expect(res).to.be.an("object");
        global.XMLHttpRequest = undefined;
      });
    });

    describe("_getFormDataObject", function () {
      it("should return an object", function () {
        var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

        global.FormData = function () {};
        var res = liteUploader._getFormDataObject();

        expect(res).to.be.an("object");
        global.FormData = undefined;
      });
    });
  });
});
