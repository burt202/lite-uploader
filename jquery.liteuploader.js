/* liteUploader v2.3.0 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

$.fn.liteUploader = function (options) {
  var defaults = {
    script: null,
    rules: {
      allowedFileTypes: null,
      maxSize: null
    },
    params: {},
    headers: {},
    changeHandler: true,
    clickElement: null,
    singleFileUploads: false,
    beforeRequest: function (files, formData) { return $.when(formData); }
  };

  return this.each(function () {
    $.data(this, "liteUploader", new LiteUploader(this, $.extend(defaults, options)));
  });
};

function LiteUploader (element, options) {
  this.el = $(element);
  this.options = options;
  this.params = options.params;
  this.xhrs = [];

  this._init();
}

window.LiteUploader = LiteUploader;

LiteUploader.prototype = {
  _init: function () {
    if (this.options.changeHandler) {
      this.el.change(function () {
        this._validateInputAndFiles();
      }.bind(this));
    }

    if (this.options.clickElement) {
      this.options.clickElement.click(function () {
        this._validateInputAndFiles();
      }.bind(this));
    }
  },

  _getInputFiles: function () {
    return this.el.get(0).files;
  },

  _validateInputAndFiles: function () {
    var files = this._getInputFiles();
    var errors = this._getInputErrors(files);
    if (!errors) errors = this._getFileErrors(files);

    if (errors) {
      this.el.trigger("lu:errors", errors);
      this._resetInput();
    } else {
      this.el.trigger("lu:start", files);
      this._startUploadWithFiles(files);
    }
  },

  _startUploadWithFiles: function (files) {
    if (this.options.singleFileUploads) {
      files.forEach(function (file) {
        this._beforeUpload([file]);
      }.bind(this));
    } else {
      this._beforeUpload(files);
    }
  },

  _beforeUpload: function (files) {
    this.el.trigger("lu:before", files);
    this.options.beforeRequest(files, this._collateFormData(files))
      .done(this._performUpload.bind(this));
  },

  _resetInput: function () {
    this.el.val("");
  },

  _getInputErrors: function (files) {
    var errors = [];
    var inputErrors = [];

    if (!this.el.attr("name")) {
      errors.push({
        type: "fileInputNameRequired"
      });
    }

    if (!this.options.script) {
      errors.push({
        type: "scriptOptionRequired"
      });
    }

    if (files.length === 0) {
      errors.push({
        type: "noFilesSelected"
      });
    }

    inputErrors.push ({
      name: "liteUploader_input",
      errors: errors
    });

    return (errors.length > 0) ? [inputErrors] : null;
  },

  _getFileErrors: function (files) {
    var errorsCount = 0;

    var fileErrors = files.map(function (file) {
      var errorsFound = this._findErrorsForFile(file);
      errorsCount += errorsFound.length;

      return {
        name: file.name,
        errors: errorsFound
      };
    }.bind(this));

    return (errorsCount > 0) ? [fileErrors] : null;
  },

  _findErrorsForFile: function (file) {
    var errorsArray = [];

    $.each(this.options.rules, function (key, value) {
      if (key === "allowedFileTypes" && value && value.split(",").indexOf(file.type) === -1) {
        errorsArray.push({
          type: "type",
          rule: value,
          given: file.type
        });
      }

      if (key === "maxSize" && value && file.size > value) {
        errorsArray.push({
          type: "size",
          rule: value,
          given: file.size
        });
      }
    });

    return errorsArray;
  },

  _getFormDataObject: function () {
    return new FormData();
  },

  _collateFormData: function (files) {
    var formData = this._getFormDataObject();
    if (this.el.attr("id")) formData.append("liteUploader_id", this.el.attr("id"));

    $.each(this.params, function (key, value) {
      formData.append(key, value);
    });

    files.forEach(function (file) {
      formData.append(this.el.attr("name"), file);
    }.bind(this));

    return formData;
  },

  _getXmlHttpRequestObject: function () {
    return new XMLHttpRequest();
  },

  _buildXhrObject: function () {
    var xhr = this._getXmlHttpRequestObject();
    xhr.upload.addEventListener("progress", this._onXHRProgress.bind(this), false);
    this.xhrs.push(xhr);
    return xhr;
  },

  _performUpload: function (formData) {
    $.ajax({
      xhr: this._buildXhrObject.bind(this),
      url: this.options.script,
      type: "POST",
      data: formData,
      headers: this.options.headers || {},
      processData: false,
      contentType: false
    })
    .done(this._onXHRSuccess.bind(this))
    .fail(this._onXHRFailure.bind(this))
    .always(this._onXHRAlways.bind(this));
  },

  _onXHRProgress: function (e) {
    if (e.lengthComputable) this.el.trigger("lu:progress", Math.floor((e.loaded / e.total) * 100));
  },

  _onXHRSuccess: function (response) {
    this.el.trigger("lu:success", response);
  },

  _onXHRFailure: function (jqXHR) {
    this.el.trigger("lu:fail", jqXHR);
  },

  _onXHRAlways: function () {
    this._resetInput();
  },

  /* Public Methods */

  addParam: function (key, value) {
    this.params[key] = value;
  },

  cancelUpload: function () {
    this.xhrs.forEach(function (xhr) {
      xhr.abort();
    });
    this.el.trigger("lu:cancelled");
    this._resetInput();
  }
};
