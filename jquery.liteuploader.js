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
  this.ref = this.el.attr("name");

  this._init();
}

window.LiteUploader = LiteUploader;

LiteUploader.prototype = {
  _init: function () {
    if (this.options.changeHandler) {
      this.el.change(function () {
        this._validateOptionsAndFiles();
      }.bind(this));
    }

    if (this.options.clickElement) {
      this.options.clickElement.click(function () {
        this._validateOptionsAndFiles();
      }.bind(this));
    }
  },

  _getFiles: function () {
    return this.el.get(0).files;
  },

  _triggerEvent: function (name, value) {
    this.el.trigger(name, value);
  },

  _validateOptionsAndFiles: function () {
    var files = this._getFiles();
    var errors = this._getGeneralErrors(files);
    if (!errors) errors = this._getFileErrors(files);

    if (errors) {
      this._triggerEvent("lu:errors", errors);
    } else {
      this._triggerEvent("lu:start", files);
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
    this._triggerEvent("lu:before", files);
    this.options.beforeRequest(files, this._collateFormData(files))
      .done(this._performUpload.bind(this));
  },

  _getGeneralErrors: function (files) {
    var errors = [];
    var generalErrors = [];

    if (!this.ref) {
      errors.push({
        type: "fileRefRequired"
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

    generalErrors.push ({
      name: "_general",
      errors: errors
    });

    return (errors.length > 0) ? [generalErrors] : null;
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

    $.each(this.params, function (key, value) {
      formData.append(key, value);
    });

    files.forEach(function (file) {
      formData.append(this.ref, file);
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
    .fail(this._onXHRFailure.bind(this));
  },

  _onXHRProgress: function (e) {
    if (e.lengthComputable) this._triggerEvent("lu:progress", Math.floor((e.loaded / e.total) * 100));
  },

  _onXHRSuccess: function (response) {
    this._triggerEvent("lu:success", response);
  },

  _onXHRFailure: function (jqXHR) {
    this._triggerEvent("lu:fail", jqXHR);
  },

  /* Public Methods */

  addParam: function (key, value) {
    this.params[key] = value;
  },

  cancelUpload: function () {
    this.xhrs.forEach(function (xhr) {
      xhr.abort();
    });
    this._triggerEvent("lu:cancelled");
  }
};
