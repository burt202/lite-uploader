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

var fileInput;
var clickElement;
var LiteUploader;
require("../jquery.liteuploader");

describe("Lite Uploader", function () {
  beforeEach(function () {
    fileInput = "<input type=\"file\" name=\"tester\" id=\"foobar\" />";
    clickElement = $("<input type=\"button\" />");

    LiteUploader = window.LiteUploader;
  });

  afterEach(function () {
    fileInput = undefined;
    clickElement = undefined;
    LiteUploader = undefined;
  });

  describe("basic instantiation", function () {
    it("should be able to be instantiated", function () {
      sinon.stub(LiteUploader.prototype, "_init");
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});

      expect(liteUploader).to.be.defined;
      expect(liteUploader.el).to.be.an("object");
      expect(liteUploader.options).to.eql({tester: "abc", params: {foo: "123"}});
      expect(liteUploader.params).to.eql({foo: "123"});
      expect(liteUploader.xhrs).to.eql([]);
      expect(liteUploader._init).to.have.been.called;

      LiteUploader.prototype._init.restore();
    });
  });

  describe("starting handlers", function () {
    it("should continue with plugin on file input change when changeHandler option is true", function () {
      sinon.stub(LiteUploader.prototype, "_validateInputAndFiles");
      var liteUploader = new LiteUploader(fileInput, {changeHandler: true});

      liteUploader.el.triggerHandler("change");

      expect(liteUploader._validateInputAndFiles).to.have.been.called;

      LiteUploader.prototype._validateInputAndFiles.restore();
    });

    it("should continue with plugin on file input change when changeHandler option is false", function () {
      sinon.stub(LiteUploader.prototype, "_validateInputAndFiles");
      var liteUploader = new LiteUploader(fileInput, {changeHandler: false});

      liteUploader.el.triggerHandler("change");

      expect(liteUploader._validateInputAndFiles).not.to.have.been.called;

      LiteUploader.prototype._validateInputAndFiles.restore();
    });

    it("should continue with plugin on element click when clickElement option is set", function () {
      sinon.stub(LiteUploader.prototype, "_validateInputAndFiles");
      var liteUploader = new LiteUploader(fileInput, {clickElement: clickElement});

      clickElement.triggerHandler("click");

      expect(liteUploader._validateInputAndFiles).to.have.been.called;

      LiteUploader.prototype._validateInputAndFiles.restore();
    });
  });

  describe("validation", function () {
    it("should not proceed with upload if there are input errors", function () {
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns("foo");
      sinon.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader._validateInputAndFiles();

      expect(liteUploader._startUploadWithFiles).not.to.have.been.called;

      LiteUploader.prototype._getInputErrors.restore();
      LiteUploader.prototype._startUploadWithFiles.restore();
    });

    it("should not proceed with upload if the files do not pass file validation", function () {
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns(null);
      sinon.stub(LiteUploader.prototype, "_getFileErrors").returns("bar");
      sinon.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader._validateInputAndFiles();

      expect(liteUploader._startUploadWithFiles).not.to.have.been.called;

      LiteUploader.prototype._getInputErrors.restore();
      LiteUploader.prototype._getFileErrors.restore();
      LiteUploader.prototype._startUploadWithFiles.restore();
    });

    it("should reset input if there are errors", function () {
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns("foo");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader.el.val("abc");
      expect(liteUploader.el.val()).to.eql("abc");

      liteUploader._validateInputAndFiles();
      expect(liteUploader.el.val()).to.eql("");

      LiteUploader.prototype._getInputErrors.restore();
    });

    it("should emit event containing errors", function () {
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns("foo");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader.el.on("lu:errors", function (e, errors) {
        expect(errors).to.eql("foo");
      });

      liteUploader._validateInputAndFiles();

      LiteUploader.prototype._getInputErrors.restore();
    });

    it("should proceed with upload if no errors are found", function () {
      sinon.stub(LiteUploader.prototype, "_getInputFiles").returns("files");
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns(null);
      sinon.stub(LiteUploader.prototype, "_getFileErrors").returns(null);
      sinon.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader._validateInputAndFiles();

      expect(liteUploader._startUploadWithFiles).to.have.been.calledWith("files");

      LiteUploader.prototype._getInputFiles.restore();
      LiteUploader.prototype._getInputErrors.restore();
      LiteUploader.prototype._getFileErrors.restore();
      LiteUploader.prototype._startUploadWithFiles.restore();
    });

    it("should emit event if no errors are found", function () {
      sinon.stub(LiteUploader.prototype, "_getInputFiles").returns("files");
      sinon.stub(LiteUploader.prototype, "_getInputErrors").returns(null);
      sinon.stub(LiteUploader.prototype, "_getFileErrors").returns(null);
      sinon.stub(LiteUploader.prototype, "_startUploadWithFiles");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      liteUploader.el.on("lu:start", function (e, files) {
        expect(files).to.eql("files");
      });

      liteUploader._validateInputAndFiles();

      LiteUploader.prototype._getInputFiles.restore();
      LiteUploader.prototype._getInputErrors.restore();
      LiteUploader.prototype._getFileErrors.restore();
      LiteUploader.prototype._startUploadWithFiles.restore();
    });
  });

  describe("upload start", function () {
    it("should upload all files in one request by default", function () {
      sinon.stub(LiteUploader.prototype, "_beforeUpload");
      var liteUploader = new LiteUploader(fileInput, {script: "script"});
      var files = ["file1", "file2"];

      liteUploader._startUploadWithFiles(files);

      expect(liteUploader._beforeUpload).to.have.been.calledOnce;
      expect(liteUploader._beforeUpload).to.have.been.calledWith(files);

      LiteUploader.prototype._beforeUpload.restore();
    });

    it("should upload all files as separate requests if singleFileUploads option is true", function () {
      sinon.stub(LiteUploader.prototype, "_beforeUpload");
      var liteUploader = new LiteUploader(fileInput, {script: "script", singleFileUploads: true});
      var files = ["file1", "file2"];

      liteUploader._startUploadWithFiles(files);

      expect(liteUploader._beforeUpload).to.have.been.calledTwice;
      expect(liteUploader._beforeUpload.getCall(0).args[0]).to.eql(["file1"]);
      expect(liteUploader._beforeUpload.getCall(1).args[0]).to.eql(["file2"]);

      LiteUploader.prototype._beforeUpload.restore();
    });
  });

  describe("before each request", function () {
    it("should emit event", function () {
      sinon.stub(LiteUploader.prototype, "_performUpload");
      sinon.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sinon.stub().returns($.Deferred().resolve("resolved"));
      var liteUploader = new LiteUploader(fileInput, {script: "script", beforeRequest: beforeRequest});

      liteUploader.el.on("lu:start", function (e, files) {
        expect(files).to.eql(["file1", "file2"]);
      });

      liteUploader._beforeUpload(["file1", "file2"]);

      LiteUploader.prototype._performUpload.restore();
      LiteUploader.prototype._collateFormData.restore();
    });

    it("should proceed with upload if beforeRequest was resolved", function () {
      sinon.stub(LiteUploader.prototype, "_performUpload");
      sinon.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sinon.stub().returns($.Deferred().resolve("resolved"));
      var liteUploader = new LiteUploader(fileInput, {script: "script", beforeRequest: beforeRequest});

      liteUploader._beforeUpload(["file1", "file2"]);

      expect(beforeRequest).to.have.been.calledWith(["file1", "file2"], "collated");
      expect(liteUploader._performUpload).to.have.been.calledWith("resolved");

      LiteUploader.prototype._performUpload.restore();
      LiteUploader.prototype._collateFormData.restore();
    });

    it("should not proceed with upload if beforeRequest was rejected", function () {
      sinon.stub(LiteUploader.prototype, "_performUpload");
      sinon.stub(LiteUploader.prototype, "_collateFormData").returns("collated");
      var beforeRequest = sinon.stub().returns($.Deferred().reject());
      var liteUploader = new LiteUploader(fileInput, {script: "script", beforeRequest: beforeRequest});

      liteUploader._beforeUpload();

      expect(liteUploader._performUpload).not.to.have.been.called;

      LiteUploader.prototype._performUpload.restore();
      LiteUploader.prototype._collateFormData.restore();
    });
  });

  describe("input errors", function () {
    it("should return error if the file input has no name attribute", function () {
      var liteUploader = new LiteUploader("<input type=\"file\" />", {script: "script"});

      var result = liteUploader._getInputErrors([1]);

      expect(result).to.eql([[{name: "liteUploader_input", errors: [{type: "fileInputNameRequired"}]}]]);
    });

    it("should return error if the script option is blank", function () {
      var liteUploader = new LiteUploader(fileInput, {});

      var result = liteUploader._getInputErrors([1]);

      expect(result).to.eql([[{name: "liteUploader_input", errors: [{type: "scriptOptionRequired"}]}]]);
    });

    it("should return error if the file array is empty", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      var result = liteUploader._getInputErrors([]);

      expect(result).to.eql([[{name: "liteUploader_input", errors: [{type: "noFilesSelected"}]}]]);
    });

    it("should return null if no input errors are found", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      var result = liteUploader._getInputErrors([1]);

      expect(result).not.to.be.defined;
    });
  });

  describe("file errors", function () {
    it("should return errors if any are found", function () {
      var files = [{name: "name"}];
      sinon.stub(LiteUploader.prototype, "_findErrorsForFile").returns([{error: "here"}]);
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      var result = liteUploader._getFileErrors(files);

      expect(result).to.eql([[{name: "name", errors: [{error: "here"}]}]]);

      LiteUploader.prototype._findErrorsForFile.restore();
    });

    it("should return null if no errors are found", function () {
      var files = [{name: "name"}];
      sinon.stub(LiteUploader.prototype, "_findErrorsForFile").returns([]);
      var liteUploader = new LiteUploader(fileInput, {script: "script"});

      var result = liteUploader._getFileErrors(files);

      expect(result).not.to.be.defined;

      LiteUploader.prototype._findErrorsForFile.restore();
    });
  });

  describe("find errors in file", function () {
    it("should return error if file is an invalid type", function () {
      var file = {name: "name", type: "d", size: 100};
      var liteUploader = new LiteUploader(fileInput, {
        script: "script",
        rules: {
          allowedFileTypes: "a,b,c"
        }
      });

      var result = liteUploader._findErrorsForFile(file);

      expect(result).to.eql([{"type": "type", "rule": "a,b,c", "given": "d"}]);
    });

    it("should return error if file has an invalid size", function () {
      var file = {name: "name", type: "a", size: 100};
      var liteUploader = new LiteUploader(fileInput, {
        script: "script",
        rules: {
          allowedFileTypes: "a,b,c",
          maxSize: 99
        }
      });

      var result = liteUploader._findErrorsForFile(file);

      expect(result).to.eql([{"type": "size", "rule": 99, "given": 100}]);
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

      sinon.stub(LiteUploader.prototype, "_getFormDataObject").returns(formDataObject);
    });

    afterEach(function () {
      formDataObject = undefined;
      LiteUploader.prototype._getFormDataObject.restore();
    });

    it("should add extra params onto params hash defined on instantiation", function () {
      var liteUploader = new LiteUploader(fileInput, {params: {foo: "123"}});

      liteUploader.addParam("bar", "456");

      expect(liteUploader.params).to.eql({foo: "123", bar: "456"});
    });

    it("should add liteUploader_id to form data if the file input has an id", function () {
      var liteUploader = new LiteUploader(fileInput, {params: {}});

      var result = liteUploader._collateFormData([]);

      expect(result.get()).to.eql([{"liteUploader_id": "foobar"}]);
    });

    it("should not add liteUploader_id to form data if the file input does not have an id", function () {
      var liteUploader = new LiteUploader("<input type=\"file\" name=\"tester\" />", {params: {}});

      var result = liteUploader._collateFormData([]);

      expect(result.get()).to.eql([]);
    });

    it("should add any params to form data", function () {
      var liteUploader = new LiteUploader(fileInput, {params: {tester: 123, another: "abc"}});

      var result = liteUploader._collateFormData([]);

      expect(result.get()).to.eql([{ "liteUploader_id" : "foobar" }, {tester: 123}, {another: "abc"}]);
    });

    it("should add any files to form data", function () {
      var liteUploader = new LiteUploader(fileInput, {params: {}});

      var result = liteUploader._collateFormData(["tester1", "tester2"]);

      expect(result.get()).to.eql([{ "liteUploader_id" : "foobar" }, {"tester": "tester1"}, {"tester": "tester2"}]);
    });
  });

  describe("building xhr object", function () {
    var xmlHttpRequestObject;

    beforeEach(function () {
      xmlHttpRequestObject = {
        upload: {
          addEventListener: sinon.spy()
        }
      };

      sinon.stub(LiteUploader.prototype, "_getXmlHttpRequestObject").returns(xmlHttpRequestObject);
    });

    afterEach(function () {
      xmlHttpRequestObject = undefined;
      LiteUploader.prototype._getXmlHttpRequestObject.restore();
    });

    it("should return a new instance of XMLHttpRequest with progress listener", function () {
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});

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
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});

      sinon.stub($, "ajax").returns($.Deferred());
      liteUploader._performUpload("form-data");

      expect($.ajax).to.have.been.called;
      expect($.ajax.getCall(0).args[0].xhr).to.be.a("function");
      expect($.ajax.getCall(0).args[0].url).to.eql("abc");
      expect($.ajax.getCall(0).args[0].type).to.eql("POST");
      expect($.ajax.getCall(0).args[0].data).to.eql("form-data");
      expect($.ajax.getCall(0).args[0].headers).to.eql({});
      expect($.ajax.getCall(0).args[0].processData).to.eql(false);
      expect($.ajax.getCall(0).args[0].contentType).to.eql(false);

      $.ajax.restore();
    });

    it("should setup the ajax call with header if supplied", function () {
      var headers = {"x-my-custom-header": "some value"};
      var options = {script: "abc", params: {foo: "123"}, headers: headers};
      var liteUploader = new LiteUploader(fileInput, options);

      sinon.stub($, "ajax").returns($.Deferred());
      liteUploader._performUpload("form-data");

      expect($.ajax.getCall(0).args[0].headers).to.eql(headers);

      $.ajax.restore();
    });

    it("should emit event on success", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});
      var deferred = $.Deferred();

      liteUploader.el.on("lu:success", function (e, response) {
        expect(response).to.eql("response");
      });

      sinon.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.resolve("response");

      $.ajax.restore();
    });

    it("should reset input on success", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});
      var deferred = $.Deferred();

      liteUploader.el.val("foo");
      expect(liteUploader.el.val()).to.eql("foo");

      sinon.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.resolve("response");

      expect(liteUploader.el.val()).to.eql("");

      $.ajax.restore();
    });

    it("should emit event on failure", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});
      var deferred = $.Deferred();

      liteUploader.el.on("lu:failure", function (e, response) {
        expect(response).to.eql("response");
      });

      sinon.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.reject("response");

      $.ajax.restore();
    });

    it("should reset input on failure", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});
      var deferred = $.Deferred();

      liteUploader.el.val("foo");
      expect(liteUploader.el.val()).to.eql("foo");

      sinon.stub($, "ajax").returns(deferred);
      liteUploader._performUpload("form-data");
      deferred.reject("response");

      expect(liteUploader.el.val()).to.eql("");

      $.ajax.restore();
    });

    it("should not trigger progress event if lengthComputable is false", function () {
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});
      sinon.stub(liteUploader.el, "trigger");

      liteUploader._onXHRProgress({lengthComputable: false});

      expect(liteUploader.el.trigger).not.to.have.been.called;

      liteUploader.el.trigger.restore();
    });

    it("should trigger progress event if lengthComputable is true", function () {
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});
      sinon.stub(liteUploader.el, "trigger");

      liteUploader._onXHRProgress({
        lengthComputable: true,
        loaded: 2.1,
        total: 10.3
      });

      expect(liteUploader.el.trigger).to.have.been.calledWith("lu:progress", 20);

      liteUploader.el.trigger.restore();
    });
  });

  describe("cancel upload", function () {
    it("should abort the xhr object", function () {
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});
      liteUploader.xhrs = [{
        abort: sinon.spy()
      }];

      liteUploader.cancelUpload();

      expect(liteUploader.xhrs[0].abort).to.have.been.called;
    });

    it("should emit event", function () {
      var liteUploader = new LiteUploader(fileInput, {tester: "abc", params: {foo: "123"}});
      sinon.stub(liteUploader.el, "trigger");

      liteUploader.cancelUpload();

      expect(liteUploader.el.trigger).to.have.been.calledWith("lu:cancelled");

      liteUploader.el.trigger.restore();
    });

    it("should reset input on failure", function () {
      var liteUploader = new LiteUploader(fileInput, {script: "abc", params: {foo: "123"}});

      liteUploader.el.val("foo");
      expect(liteUploader.el.val()).to.eql("foo");

      liteUploader.cancelUpload();

      expect(liteUploader.el.val()).to.eql("");
    });
  });
});
