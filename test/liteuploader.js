const sinon = require("sinon")
const chai = require("chai")
const expect = chai.expect
const sinonChai = require("sinon-chai")
chai.use(sinonChai)

const LiteUploader = require("../src/liteuploader")

let sandbox
const noop = () => {}

const mockGetFiles = () => {
  return {0: {name: "file1"}, 1: {name: "file2"}, length: 2}
}

const mockEmptyGetFiles = () => {
  return {length: 0}
}

describe("Lite Uploader", () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe("uploader object and options defaults", () => {
    it("should be able to be instantiated", () => {
      sandbox.stub(LiteUploader.prototype, "_applyDefaults").returns({tester: "abc"})
      const liteUploader = new LiteUploader({tester: "abc"}, noop)

      expect(liteUploader).to.exist
      expect(liteUploader.options).to.eql({tester: "abc"})
      expect(liteUploader._getFiles).to.be.a("function")
      expect(liteUploader._triggerEvent).to.be.a("function")
      expect(liteUploader.xhrs).to.eql([])
    })

    it("should fallback to defaults if not all options are passed in", () => {
      const liteUploader = new LiteUploader({}, noop, noop)

      expect(liteUploader.options.beforeRequest).to.eql(null)
      expect(liteUploader.options.url).to.eql(null)
      expect(liteUploader.options.ref).to.eql(null)
      expect(liteUploader.options.headers).to.eql({})
      expect(liteUploader.options.params).to.eql({})
      expect(liteUploader.options.rules).to.eql({})
      expect(liteUploader.options.validators).to.eql([])
      expect(liteUploader.options.singleFileUploads).to.eql(false)
    })
  })

  describe("instantiation", () => {
    it("should throw error if there is no file list", () => {
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const liteUploader = new LiteUploader({url: "url"}, noop)

      expect(() => {
        liteUploader._init()
      }).to.throw("No files")
    })

    it("should throw error if the file list is empty", () => {
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const liteUploader = new LiteUploader({url: "url"}, noop, mockEmptyGetFiles)

      expect(() => {
        liteUploader._init()
      }).to.throw("No files")
    })

    it("should trigger 'error' event if there are options errors and not proceed with upload", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns("foo")
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "url"}, mockOnEvent, mockGetFiles)

      return liteUploader._init().then(() => {
        expect(mockOnEvent.callCount).to.eql(1)
        expect(mockOnEvent).to.have.been.calledWith("lu:errors", {
          errors: "foo",
        })
        expect(liteUploader._startUpload).not.to.have.been.called
      })
    })

    it("should trigger 'error' event if there are file errors and not proceed with upload", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null)
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns("bar")
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "url"}, mockOnEvent, mockGetFiles)

      return liteUploader._init().then(() => {
        expect(mockOnEvent.callCount).to.eql(1)
        expect(mockOnEvent).to.have.been.calledWith("lu:errors", {
          errors: "bar",
        })
        expect(liteUploader._startUpload).not.to.have.been.called
      })
    })

    it("should trigger 'start' event if no errors are found", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null)
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null)
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const mockFileList = mockGetFiles()
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "url"}, mockOnEvent, mockGetFiles)

      return liteUploader._init().then(() => {
        expect(mockOnEvent.callCount).to.eql(1)
        expect(mockOnEvent).to.have.been.calledWith("lu:start", {
          files: mockFileList,
        })
      })
    })

    it("should clear any previous references to built xhr objects before starting another upload", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null)
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null)
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "url"}, mockOnEvent, mockGetFiles)

      liteUploader.xhrs = ["foo"]
      return liteUploader._init().then(() => {
        expect(liteUploader.xhrs.length).to.eql(0)
      })
    })

    it("should proceed with upload if no errors are found", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null)
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null)
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const mockFileList = mockGetFiles()
      const liteUploader = new LiteUploader({url: "url"}, noop, mockGetFiles)

      return liteUploader._init().then(() => {
        expect(liteUploader._startUpload).to.have.been.calledOnce
        expect(liteUploader._startUpload).to.have.been.calledWith(mockFileList)
      })
    })

    it("should proceed with upload with injected files if no errors are found", () => {
      sandbox.stub(LiteUploader.prototype, "_validateOptions").returns(null)
      sandbox.stub(LiteUploader.prototype, "_validateFiles").returns(null)
      sandbox.stub(LiteUploader.prototype, "_startUpload")
      const liteUploader = new LiteUploader({url: "url"}, noop, mockGetFiles)

      return liteUploader._init("foo").then(() => {
        expect(liteUploader._startUpload).to.have.been.calledOnce
        expect(liteUploader._startUpload).to.have.been.calledWith("foo")
      })
    })
  })

  describe("start upload", () => {
    let mockFormDataObject

    beforeEach(() => {
      mockFormDataObject = {
        append: function (key, value) {
          if (!mockFormDataObject.data) mockFormDataObject.data = {}

          if (mockFormDataObject.data[key]) {
            mockFormDataObject.data[key] = [mockFormDataObject.data[key]]
            mockFormDataObject.data[key].push(value)
          } else {
            mockFormDataObject.data[key] = value
          }
        },
        get: function (key) {
          return mockFormDataObject.data[key]
        },
      }

      sandbox.stub(LiteUploader.prototype, "_getFormDataObject").returns(mockFormDataObject)
    })

    afterEach(() => {
      mockFormDataObject = null
    })

    it("should upload all files in one request by default", () => {
      const mockXhrObject = {
        send: sandbox.spy(),
      }
      const mockOnEvent = sandbox.stub()
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").resolves(mockXhrObject)
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"))
      const liteUploader = new LiteUploader({url: "url"}, mockOnEvent, noop)
      const mockFileList = mockGetFiles()

      return liteUploader._startUpload(mockFileList).then(() => {
        expect(mockXhrObject.send).to.have.been.calledOnce
      })
    })

    it("should split all files into separate requests if singleFileUploads option is true", () => {
      const mockXhrObject = {
        send: sandbox.spy(),
      }
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").resolves(mockXhrObject)
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"))
      const liteUploader = new LiteUploader({url: "url", singleFileUploads: true}, noop)
      const mockFileList = mockGetFiles()

      return liteUploader._startUpload(mockFileList).then(() => {
        expect(mockXhrObject.send).to.have.been.calledTwice
      })
    })

    it("should send formData with xhr request", () => {
      const mockXhrObject = {
        send: sandbox.spy(),
      }
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").resolves(mockXhrObject)
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"))
      const liteUploader = new LiteUploader({url: "url"}, noop)
      const mockFileList = mockGetFiles()

      return liteUploader._startUpload(mockFileList).then(() => {
        expect(mockXhrObject.send).to.have.been.calledWith("foo")
      })
    })

    it("should not continue with upload if beforeRequest rejects", () => {
      const mockXhrObject = {
        send: sandbox.spy(),
      }
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").resolves(mockXhrObject)
      const beforeRequest = () => {
        return Promise.reject(new Error("bar"))
      }
      const liteUploader = new LiteUploader({url: "url", beforeRequest: beforeRequest}, noop)
      const mockFileList = mockGetFiles()

      return liteUploader
        ._startUpload(mockFileList)
        .then(() => {
          expect("thisnot").to.eql("topass")
        })
        .catch((error) => {
          expect(error).to.be.instanceof(Error)
          expect(error.message).to.eql("bar")
          expect(mockXhrObject.send).not.to.have.been.called
        })
    })

    it("should not send file as form data when sendAsFormData is false and singleFileUploads is true", () => {
      const mockXhrObject = {
        send: sandbox.spy(),
      }
      sandbox.stub(LiteUploader.prototype, "_buildXhrObject").resolves(mockXhrObject)
      sandbox.stub(LiteUploader.prototype, "_beforeRequest").returns(Promise.resolve("foo"))
      const liteUploader = new LiteUploader(
        {url: "url", sendAsFormData: false, singleFileUploads: true},
        noop,
      )
      const mockFileList = mockGetFiles()

      return liteUploader._startUpload(mockFileList).then(() => {
        expect(mockXhrObject.send.callCount).to.eql(2)
        expect(mockXhrObject.send).to.have.been.calledWith(mockFileList[0])
        expect(mockXhrObject.send).to.have.been.calledWith(mockFileList[1])
      })
    })
  })

  describe("before request", () => {
    it("should trigger 'before' event with files", () => {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated")
      const beforeRequest = sandbox.stub().returns("resolved")
      const mockOnEvent = sandbox.stub()
      const mockFileList = mockGetFiles()
      const liteUploader = new LiteUploader({url: "url", beforeRequest: beforeRequest}, mockOnEvent)

      liteUploader._beforeRequest(mockFileList)

      expect(mockOnEvent.callCount).to.eql(1)
      expect(mockOnEvent).to.have.been.calledWith("lu:before", {
        files: mockFileList,
      })
    })

    it("should collate form data and pass it to beforeRequest function with files", () => {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated")
      const beforeRequest = sandbox.stub().returns("resolved")
      const mockOnEvent = sandbox.stub()
      const mockFileList = mockGetFiles()
      const liteUploader = new LiteUploader({url: "url", beforeRequest: beforeRequest}, mockOnEvent)

      liteUploader._beforeRequest(mockFileList)

      expect(beforeRequest).to.have.been.calledWith(mockFileList, "collated")
    })

    it("should return beforeRequest response", () => {
      sandbox.stub(LiteUploader.prototype, "_collateFormData").returns("collated")
      const beforeRequest = sandbox.stub().returns("resolved")
      const mockOnEvent = sandbox.stub()
      const mockFileList = mockGetFiles()
      const liteUploader = new LiteUploader({url: "url", beforeRequest: beforeRequest}, mockOnEvent)

      const result = liteUploader._beforeRequest(mockFileList)

      expect(result).to.eql("resolved")
    })
  })

  describe("options errors", () => {
    it("should return error if there is no ref set", () => {
      const liteUploader = new LiteUploader({url: "url"}, noop, noop)

      const result = liteUploader._validateOptions()

      expect(result).to.eql([{name: "_options", errors: [{type: "refRequired"}]}])
    })

    it("should return error if the url option is blank", () => {
      const liteUploader = new LiteUploader({ref: "ref"}, noop, noop)

      const result = liteUploader._validateOptions()

      expect(result).to.eql([{name: "_options", errors: [{type: "urlRequired"}]}])
    })

    it("should return null if no options errors are found", () => {
      const liteUploader = new LiteUploader({url: "url", ref: "ref"}, noop, noop)

      const result = liteUploader._validateOptions()

      expect(result).to.eql(null)
    })
  })

  describe("file type validator", () => {
    it("should return undefined if the file type exactly matches an allowed type", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._allowedFileTypeValidator("image/jpeg,image/png", {
        type: "image/jpeg",
      })

      expect(res).to.eq(undefined)
    })

    it("should return error object if the file type is not a match for the allowed file type", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._allowedFileTypeValidator("image/gif", {
        type: "image/jpeg",
      })

      expect(res).to.eql({
        type: "type",
        rule: "image/gif",
        given: "image/jpeg",
      })
    })

    it("should return undefined if the file type matches a wildcard allowed type", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._allowedFileTypeValidator("image/*,video/*", {
        type: "image/jpeg",
      })

      expect(res).to.eq(undefined)
    })

    it("should return error object if the file type does not match a wildcard allowed type", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._allowedFileTypeValidator("image/*", {
        type: "text/plain",
      })

      expect(res).to.eql({
        type: "type",
        rule: "image/*",
        given: "text/plain",
      })
    })
  })

  describe("file size validator", () => {
    it("should return undefined if the file size is below limit", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._maxSizeValidator(200, {size: 199})

      expect(res).to.eq(undefined)
    })

    it("should return error object if the file is above limit", () => {
      const liteUploader = new LiteUploader()

      const res = liteUploader._maxSizeValidator(200, {size: 201})

      expect(res).to.eql({
        type: "size",
        rule: 200,
        given: 201,
      })
    })
  })

  describe("file errors", () => {
    it("should return errors if any are found", () => {
      const allowedFileTypeValidatorStub = sandbox.stub(
        LiteUploader.prototype,
        "_allowedFileTypeValidator",
      )
      allowedFileTypeValidatorStub.onCall(0).returns("foo")
      allowedFileTypeValidatorStub.onCall(1).returns(undefined)
      const maxSizeValidatorStub = sandbox.stub(LiteUploader.prototype, "_maxSizeValidator")
      maxSizeValidatorStub.onCall(0).returns("bar")
      maxSizeValidatorStub.onCall(1).returns("bar")
      const liteUploader = new LiteUploader(
        {
          url: "url",
          rules: {
            allowedFileTypes: "a,b,c",
            maxSize: 20,
          },
        },
        noop,
      )

      return liteUploader._validateFiles(mockGetFiles()).then((result) => {
        expect(result).to.eql([
          {name: "file1", errors: ["foo", "bar"]},
          {name: "file2", errors: ["bar"]},
        ])
      })
    })

    it("should return null if no errors are found", () => {
      sandbox.stub(LiteUploader.prototype, "_allowedFileTypeValidator").returns(undefined)
      sandbox.stub(LiteUploader.prototype, "_maxSizeValidator").returns(undefined)
      const liteUploader = new LiteUploader(
        {
          url: "url",
          rules: {
            allowedFileTypes: "a,b,c",
          },
        },
        noop,
      )

      return liteUploader._validateFiles(mockGetFiles()).then((result) => {
        expect(result).to.eql(null)
      })
    })

    it("should return errors from a custom validator if one is supplied", () => {
      sandbox.stub(LiteUploader.prototype, "_allowedFileTypeValidator").returns(undefined)
      sandbox.stub(LiteUploader.prototype, "_maxSizeValidator").returns(undefined)
      const customValidator = sandbox.stub()
      customValidator.onCall(0).returns(Promise.resolve(null))
      customValidator.onCall(1).returns(Promise.resolve("error"))

      const liteUploader = new LiteUploader(
        {
          validators: [customValidator],
        },
        noop,
      )

      return liteUploader._validateFiles(mockGetFiles()).then(function (result) {
        expect(result).to.eql([{name: "file2", errors: ["error"]}])
      })
    })
  })

  describe("form data", () => {
    let mockFormDataObject

    beforeEach(() => {
      mockFormDataObject = {
        append: function (key, value) {
          if (!mockFormDataObject.data) mockFormDataObject.data = {}

          if (mockFormDataObject.data[key]) {
            mockFormDataObject.data[key] = [mockFormDataObject.data[key]]
            mockFormDataObject.data[key].push(value)
          } else {
            mockFormDataObject.data[key] = value
          }
        },
        get: function (key) {
          return mockFormDataObject.data[key]
        },
      }

      sandbox.stub(LiteUploader.prototype, "_getFormDataObject").returns(mockFormDataObject)
    })

    afterEach(() => {
      mockFormDataObject = null
    })

    it("should add any params to form data", () => {
      const liteUploader = new LiteUploader({params: {foo: "bar", another: "abc"}}, noop)

      const result = liteUploader._collateFormData([])

      expect(result.get("foo")).to.eql("bar")
      expect(result.get("another")).to.eql("abc")
    })

    it("should add any files to form data keyed by ref", () => {
      const liteUploader = new LiteUploader({params: {}, ref: "tester"}, noop)

      const result = liteUploader._collateFormData(["tester1", "tester2"])

      expect(result.get("tester")).to.eql(["tester1", "tester2"])
    })
  })

  describe("building xhr object", () => {
    let mockXmlHttpRequestObject

    beforeEach(() => {
      mockXmlHttpRequestObject = {
        open: sandbox.spy(),
        setRequestHeader: sandbox.spy(),
        events: {},
        addEventListener: function (name, fn) {
          mockXmlHttpRequestObject.events[name] = fn
        },
        dispatchEvent: function (name) {
          mockXmlHttpRequestObject.events[name].apply(
            this,
            Array.prototype.slice.call(arguments, 1),
          )
        },
        upload: {
          events: {},
          addEventListener: function (name, fn) {
            mockXmlHttpRequestObject.upload.events[name] = fn
          },
          dispatchEvent: function (name) {
            mockXmlHttpRequestObject.upload.events[name].apply(
              this,
              Array.prototype.slice.call(arguments, 1),
            )
          },
        },
      }

      sandbox
        .stub(LiteUploader.prototype, "_getXmlHttpRequestObject")
        .returns(mockXmlHttpRequestObject)
    })

    afterEach(() => {
      mockXmlHttpRequestObject = null
    })

    it("should open it with correct method and url", () => {
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, noop)

      return liteUploader._buildXhrObject().then(() => {
        expect(mockXmlHttpRequestObject.open).to.have.been.calledWith("POST", "abc")
      })
    })

    it("should open it with correct method and url, when url option is a function ", () => {
      const liteUploader = new LiteUploader(
        {
          url: () => {
            return Promise.resolve("abc")
          },
          params: {foo: "123"},
        },
        noop,
      )

      return liteUploader._buildXhrObject(mockGetFiles).then(() => {
        expect(mockXmlHttpRequestObject.open).to.have.been.calledWith("POST", "abc")
      })
    })

    it("should open it with overriden method and url", () => {
      const liteUploader = new LiteUploader({url: "abc", method: "PUT"}, noop)

      return liteUploader._buildXhrObject().then(() => {
        expect(mockXmlHttpRequestObject.open).to.have.been.calledWith("PUT", "abc")
      })
    })

    it("should set headers using passed in option", () => {
      const liteUploader = new LiteUploader(
        {
          url: "abc",
          params: {foo: "123"},
          headers: {foo: "bar", abc: "def"},
        },
        noop,
      )

      return liteUploader._buildXhrObject().then(() => {
        expect(mockXmlHttpRequestObject.setRequestHeader.callCount).to.eql(2)
        expect(mockXmlHttpRequestObject.setRequestHeader.getCall(0)).to.have.been.calledWith(
          "foo",
          "bar",
        )
        expect(mockXmlHttpRequestObject.setRequestHeader.getCall(1)).to.have.been.calledWith(
          "abc",
          "def",
        )
      })
    })

    it("should set withCredentials to true if set in options", () => {
      const liteUploader = new LiteUploader(
        {url: "abc", params: {foo: "123"}, withCredentials: true},
        noop,
      )

      return liteUploader._buildXhrObject().then(() => {
        expect(mockXmlHttpRequestObject.withCredentials).to.eql(true)
      })
    })

    it("should trigger 'progress' event with percentage on xhr progress", () => {
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "abc"}, mockOnEvent)

      return liteUploader._buildXhrObject(mockGetFiles).then(() => {
        mockXmlHttpRequestObject.upload.dispatchEvent("progress", {
          lengthComputable: true,
          loaded: 2,
          total: 10,
        })

        expect(mockOnEvent.callCount).to.eql(1)
        expect(mockOnEvent).to.have.been.calledWith("lu:progress", {
          percentage: 20,
          files: mockGetFiles,
        })
      })
    })

    it("should trigger 'success' event with response on xhr success", () => {
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, mockOnEvent)

      return liteUploader._buildXhrObject(mockGetFiles).then(() => {
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 3
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 4
        liteUploader.xhrs[0].status = 200
        liteUploader.xhrs[0].responseText = "responseText"
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(2)
        expect(mockOnEvent).to.have.been.calledWith("lu:finish")
        expect(mockOnEvent).to.have.been.calledWith("lu:success", {
          files: mockGetFiles,
          response: "responseText",
        })
      })
    })

    it("should trigger 'success' event with response on xhr success (json data)", () => {
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, mockOnEvent)

      return liteUploader._buildXhrObject(mockGetFiles).then(() => {
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 3
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 4
        liteUploader.xhrs[0].status = 200
        liteUploader.xhrs[0].responseText = '{"foo": "bar"}'
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(2)
        expect(mockOnEvent).to.have.been.calledWith("lu:finish")
        expect(mockOnEvent).to.have.been.calledWith("lu:success", {
          files: mockGetFiles,
          response: {foo: "bar"},
        })
      })
    })

    it("should trigger 'fail' event when a non-successful http status code is encountered", () => {
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, mockOnEvent)

      return liteUploader._buildXhrObject().then(() => {
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 3
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(0)

        liteUploader.xhrs[0].readyState = 4
        liteUploader.xhrs[0].status = 400
        liteUploader.xhrs[0].onreadystatechange()
        expect(mockOnEvent.callCount).to.eql(2)
        expect(mockOnEvent).to.have.been.calledWith("lu:finish")
        expect(mockOnEvent).to.have.been.calledWith("lu:fail", {
          xhr: liteUploader.xhrs[0],
        })
      })
    })

    it("should keep a reference to the built object for later use", () => {
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, noop)

      expect(liteUploader.xhrs.length).to.eql(0)

      return liteUploader._buildXhrObject().then(() => {
        expect(liteUploader.xhrs.length).to.eql(1)
      })
    })

    it("should return xhr instance", () => {
      const liteUploader = new LiteUploader({url: "abc", params: {foo: "123"}}, noop)

      return liteUploader._buildXhrObject().then((result) => {
        expect(result).to.eql(mockXmlHttpRequestObject)
      })
    })
  })

  describe("start upload", () => {
    it("should initiate the upload", () => {
      sandbox.stub(LiteUploader.prototype, "_init")
      const liteUploader = new LiteUploader({tester: "abc"}, noop)

      liteUploader.startUpload()

      expect(liteUploader._init).to.have.been.called
    })
  })

  describe("add params", () => {
    it("should add extra params onto params hash defined on instantiation", () => {
      const liteUploader = new LiteUploader({params: {foo: "123"}}, noop)

      liteUploader.addParam("bar", "456")

      expect(liteUploader.options.params).to.eql({foo: "123", bar: "456"})
    })
  })

  describe("cancel upload", () => {
    it("should abort the upload", () => {
      const liteUploader = new LiteUploader({tester: "abc"}, noop)
      liteUploader.xhrs = [
        {
          abort: sandbox.spy(),
        },
      ]

      liteUploader.cancelUpload()

      expect(liteUploader.xhrs[0].abort).to.have.been.called
    })

    it("should trigger 'cancelled' event", () => {
      const mockOnEvent = sandbox.stub()
      const liteUploader = new LiteUploader({tester: "abc"}, mockOnEvent)

      liteUploader.cancelUpload()

      expect(mockOnEvent.callCount).to.eql(1)
      expect(mockOnEvent).to.have.been.calledWith("lu:cancelled")
    })
  })
})
