/*jshint -W030 */

var jsdom = require("jsdom");
global.document = jsdom.jsdom("<html><body></body></html>");
global.window = global.document.parentWindow;
global.$ = require("jquery");

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
var LiteUploader = require("../jquery.liteuploader");

describe("Lite Uploader", function () {

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe("basic instantiation", function () {
    it("should be able to be instantiated", function () {
      sandbox.stub(LiteUploader.prototype, "_applyDefaults").returns({tester: "abc"});
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      expect(liteUploader).to.be.defined;
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

      liteUploader.options.beforeRequest([], "formData")
        .then(function (res) {
          expect(res).to.eql("formData");
        });
    });
  });

  describe("validation", function () {
    it("should not proceed with upload if there are options errors", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns("foo");
      sandbox.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader({script: "script"}, mockEmptyGetFiles, noop);

      liteUploader._init();

      expect(liteUploader._startUploadWithFiles).not.to.have.been.called;
    });

    it("should not proceed with upload if there are file errors", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns("bar");
      sandbox.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader({script: "script"}, mockEmptyGetFiles, noop);

      liteUploader._init();

      expect(liteUploader._startUploadWithFiles).not.to.have.been.called;
    });

    it("should emit event containing errors", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns("foo");
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      liteUploader._init();

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:errors", "foo");
    });

    it("should proceed with upload if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, noop);

      liteUploader._init();

      expect(liteUploader._startUploadWithFiles).to.have.been.calledWith(mockFileList);
    });

    it("should emit event if no errors are found", function () {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null);
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null);
      sandbox.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var mockFileList = mockGetFiles();
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "script"}, mockGetFiles, mockOnEvent);

      liteUploader._init();

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:start", mockFileList);
    });
  });

  describe("upload start", function () {
    it("should upload all files in one request by default", function () {
      sandbox.stub(LiteUploader.prototype, "_beforeUpload");
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);
      var mockFileList = mockGetFiles();

      liteUploader._startUploadWithFiles(mockFileList);

      expect(liteUploader._beforeUpload).to.have.been.calledOnce;
      expect(liteUploader._beforeUpload).to.have.been.calledWith(mockFileList);
    });

    it("should upload all files as separate requests if singleFileUploads option is true", function () {
      sandbox.stub(LiteUploader.prototype, "_beforeUpload");
      var liteUploader = new LiteUploader({script: "script", singleFileUploads: true}, noop, noop);
      var mockFileList = mockGetFiles();

      liteUploader._startUploadWithFiles(mockFileList);

      expect(liteUploader._beforeUpload).to.have.been.calledTwice;
      expect(liteUploader._beforeUpload.getCall(0).args[0]).to.eql([mockFileList["0"]]);
      expect(liteUploader._beforeUpload.getCall(1).args[0]).to.eql([mockFileList["1"]]);
    });
  });

  describe("before each request", function () {
    it("should emit event", function () {
      sandbox.stub(LiteUploader.prototype, "_performUpload");
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns($.Deferred().resolve("resolved"));
      var mockOnEvent = sandbox.stub();
      var mockFileList = mockGetFiles();
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, mockOnEvent);

      liteUploader._beforeUpload(mockFileList);

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:before", mockFileList);
    });

    it("should proceed with upload if beforeRequest was resolved", function () {
      sandbox.stub(LiteUploader.prototype, "_performUpload");
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns($.Deferred().resolve("resolved"));
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, noop);
      var mockFileList = mockGetFiles();

      liteUploader._beforeUpload(mockFileList);

      expect(beforeRequest).to.have.been.calledWith(mockFileList, "collated");
      expect(liteUploader._performUpload).to.have.been.calledWith("resolved");
    });

    it("should not proceed with upload if beforeRequest was rejected", function () {
      sandbox.stub(LiteUploader.prototype, "_performUpload");
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sandbox.stub().returns($.Deferred().reject());
      var liteUploader = new LiteUploader({script: "script", beforeRequest: beforeRequest}, noop, noop);

      liteUploader._beforeUpload();

      expect(liteUploader._performUpload).not.to.have.been.called;
    });
  });

  describe("options errors", function () {
    it("should return error if there is no ref set", function () {
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);

      var result = liteUploader._validateOptions([1]);

      expect(result).to.eql([{name: "_options", errors: [{type: "refRequired"}]}]);
    });

    it("should return error if the script option is blank", function () {
      var liteUploader = new LiteUploader({ref: "tester"}, noop, noop);

      var result = liteUploader._validateOptions([1]);

      expect(result).to.eql([{name: "_options", errors: [{type: "scriptRequired"}]}]);
    });

    it("should return null if no options errors are found", function () {
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);

      var result = liteUploader._validateOptions([1]);

      expect(result).not.to.be.defined;
    });
  });

  describe("file errors", function () {
    it("should return errors if any are found", function () {
      var files = [{name: "name"}];
      sandbox.stub(LiteUploader.prototype, "_findErrorsForFile").returns([{error: "here"}]);
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);

      var result = liteUploader._validateFiles(files);

      expect(result).to.eql([{name: "name", errors: [{error: "here"}]}]);
    });

    it("should return null if no errors are found", function () {
      var files = [{name: "name"}];
      sandbox.stub(LiteUploader.prototype, "_findErrorsForFile").returns([]);
      var liteUploader = new LiteUploader({script: "script"}, noop, noop);

      var result = liteUploader._validateFiles(files);

      expect(result).not.to.be.defined;
    });
  });

  describe("find errors in file", function () {
    it("should return error if file is an invalid type", function () {
      var file = {name: "name", type: "d", size: 100};
      var liteUploader = new LiteUploader({
          script: "script",
          rules: {
            allowedFileTypes: "a,b,c"
          }
        },
        noop,
        noop
      );

      var result = liteUploader._findErrorsForFile(file);

      expect(result).to.eql([{"type": "type", "rule": "a,b,c", "given": "d"}]);
    });

    it("should return error if file has an invalid size", function () {
      var file = {name: "name", type: "a", size: 100};
      var liteUploader = new LiteUploader({
          script: "script",
          rules: {
            allowedFileTypes: "a,b,c",
            maxSize: 99
          }
        },
        noop,
        noop
      );

      var result = liteUploader._findErrorsForFile(file);

      expect(result).to.eql([{"type": "size", "rule": 99, "given": 100}]);
    });
  });

  describe("file type validator", function () {
    it("should return true if the file type exactly matches an allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._isAllowedFileType("image/jpeg,image/png", "image/jpeg");

      expect(res).to.eq(true);
    });

    it("should return false if the file type is not a match for the allowed file type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._isAllowedFileType("image/gif", "image/jpeg");

      expect(res).to.eq(false);
    });

    it("should return true if the file type matches a wildcard allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._isAllowedFileType("image/*,video/*", "image/jpeg");

      expect(res).to.eq(true);
    });

    it("should return false if the file type does not match a wildcard allowed type", function () {
      var liteUploader = new LiteUploader();

      var res = liteUploader._isAllowedFileType("image/*", "text/plain");

      expect(res).to.eq(false);
    });
  });

  describe("form data", function () {
    var formDataObject;

    beforeEach(function () {
      formDataObject = {
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

    afterEach(function () {
      formDataObject = undefined;
      LiteUploader.prototype._getFormDataObject.restore();
    });

    it("should add extra params onto params hash defined on instantiation", function () {
      var liteUploader = new LiteUploader({params: {foo: "123"}}, noop, noop);

      liteUploader.addParam("bar", "456");

      expect(liteUploader.options.params).to.eql({foo: "123", bar: "456"});
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
    var xmlHttpRequestObject;

    beforeEach(function () {
      xmlHttpRequestObject = {
        upload: {
          addEventListener: sandbox.spy()
        }
      };

      sandbox.stub(LiteUploader.prototype, "_getXmlHttpRequestObject").returns(xmlHttpRequestObject);
    });

    afterEach(function () {
      xmlHttpRequestObject = undefined;
      LiteUploader.prototype._getXmlHttpRequestObject.restore();
    });

    it("should return a new instance of XMLHttpRequest with progress listener", function () {
      var liteUploader = new LiteUploader({tester: "abc", params: {foo: "123"}}, noop, noop);

      expect(liteUploader.xhrs.length).to.eql(0);
      var result = liteUploader._buildXhrObject();

      expect(liteUploader.xhrs.length).to.eql(1);
      expect(result).to.eql(xmlHttpRequestObject);
      expect(xmlHttpRequestObject.upload.addEventListener).to.have.been.called;
      expect(xmlHttpRequestObject.upload.addEventListener.getCall(0).args[0]).to.eql("progress");
      expect(xmlHttpRequestObject.upload.addEventListener.getCall(0).args[1]).to.be.a("function");
      expect(xmlHttpRequestObject.upload.addEventListener.getCall(0).args[2]).to.eql(false);
    });
  });

  describe("perform upload", function () {
    it("should setup the ajax call correctly", function () {
      var liteUploader = new LiteUploader({script: "abc", params: {foo: "123"}}, noop, noop);

      sandbox.stub($, "ajax").returns($.Deferred());
      liteUploader._performUpload("form-data");

      expect($.ajax).to.have.been.called;
      expect($.ajax.getCall(0).args[0].xhr).to.be.a("function");
      expect($.ajax.getCall(0).args[0].url).to.eql("abc");
      expect($.ajax.getCall(0).args[0].type).to.eql("POST");
      expect($.ajax.getCall(0).args[0].data).to.eql("form-data");
      expect($.ajax.getCall(0).args[0].headers).to.eql({});
      expect($.ajax.getCall(0).args[0].processData).to.eql(false);
      expect($.ajax.getCall(0).args[0].contentType).to.eql(false);
    });

    it("should setup the ajax call with header if supplied", function () {
      var headers = {"x-my-custom-header": "some value"};
      var options = {script: "abc", params: {foo: "123"}, headers: headers};
      var liteUploader = new LiteUploader(options, noop, noop);

      sandbox.stub($, "ajax").returns($.Deferred());
      liteUploader._performUpload("form-data");

      expect($.ajax.getCall(0).args[0].headers).to.eql(headers);
    });

    it("should emit event on success", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "abc"}, noop, mockOnEvent);
      var deferred = $.Deferred();

      sandbox.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.resolve("response");

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:success", "response");
    });

    it("should emit event on failure", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({script: "abc"}, noop, mockOnEvent);
      var deferred = $.Deferred();

      sandbox.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.reject("response");

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:fail", "response");
    });

    it("should not trigger progress event if lengthComputable is false", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader._onXHRProgress({lengthComputable: false});

      expect(mockOnEvent).not.to.have.been.called;
    });

    it("should trigger progress event if lengthComputable is true", function () {
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
  });

  describe("start upload", function () {
    it("should call _init", function () {
      sandbox.stub(LiteUploader.prototype, "_init");
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      liteUploader.startUpload();

      expect(liteUploader._init).to.have.been.called;
    });
  });

  describe("cancel upload", function () {
    it("should abort the xhr object", function () {
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);
      liteUploader.xhrs = [{
        abort: sandbox.spy()
      }];

      liteUploader.cancelUpload();

      expect(liteUploader.xhrs[0].abort).to.have.been.called;
    });

    it("should emit event", function () {
      var mockOnEvent = sandbox.stub();
      var liteUploader = new LiteUploader({tester: "abc"}, noop, mockOnEvent);

      liteUploader.cancelUpload();

      expect(mockOnEvent.callCount).to.eql(1);
      expect(mockOnEvent).to.have.been.calledWith("lu:cancelled");
    });
  });

  describe("global object methods", function () {
    it("_getXmlHttpRequestObject should return an object", function () {
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      global.XMLHttpRequest = function () {};
      var res = liteUploader._getXmlHttpRequestObject();

      expect(res).to.be.an("object");
      global.XMLHttpRequest = undefined;
    });

    it("_getFormDataObject should return an object", function () {
      var liteUploader = new LiteUploader({tester: "abc"}, noop, noop);

      global.FormData = function () {};
      var res = liteUploader._getFormDataObject();

      expect(res).to.be.an("object");
      global.FormData = undefined;
    });
  });
});
