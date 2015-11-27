/* liteUploader v3.0.0 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

$.fn.liteUploader = function (options) {
  return this.each(function () {
    var getFiles = function () {
      return $(this).get(0).files;
    }.bind(this);

    $.data(this, "liteUploader", new LiteUploader(
      options,
      $(this).attr("name"),
      getFiles,
      $(this).trigger.bind($(this))
    ));
  });
};

function LiteUploader (options, ref, getFiles, onEvent) {
  this.options = this._applyDefaults(options);
  this.ref = ref;
  this._getFiles = getFiles;
  this._triggerEvent = onEvent;
  this.xhrs = [];
}

window.LiteUploader = LiteUploader;

LiteUploader.prototype = {
  _applyDefaults: function (options) {
    return $.extend({
      script: null,
      rules: {
        allowedFileTypes: null,
        maxSize: null
      },
      params: {},
      headers: {},
      singleFileUploads: false,
      beforeRequest: function (files, formData) { return $.when(formData); }
    }, options);
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
      $.each(files, function (i) {
        this._beforeUpload([files[i]]);
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
        type: "refRequired"
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
    var fileErrors = [];

    $.each(files, function (i) {
      var errorsFound = this._findErrorsForFile(files[i]);

      fileErrors.push({
        name: files[i].name,
        errors: errorsFound
      });

      errorsCount += errorsFound.length;
    }.bind(this));

    return (errorsCount > 0) ? [fileErrors] : null;
  },

  _findErrorsForFile: function (file) {
    var errorsArray = [];

    $.each(this.options.rules, function (key, value) {
      if (key === 'allowedFileTypes' && value && !this._isAllowedFileType(value, file.type)) {
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
    }.bind(this));

    return errorsArray;
  },

  _isAllowedFileType: function(rules, type) {
    var allowedTypes = rules.split(','),
      mediaClassLike = /\/\*$/;

    if ($.inArray(type, allowedTypes) !== -1) {
      return true;
    }

    return allowedTypes.reduce(function(result, allowedType) {
      if (result || mediaClassLike.test(allowedType)) {
        return result || type.indexOf(allowedType.substring(0, allowedType.length - 1)) === 0;
      }
      return result || false;
    }, false);
  },

  _getFormDataObject: function () {
    return new FormData();
  },

  _collateFormData: function (files) {
    var formData = this._getFormDataObject();

    $.each(this.options.params, function (key, value) {
      formData.append(key, value);
    });

    $.each(files, function (i) {
      formData.append(this.ref, files[i]);
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
      headers: this.options.headers,
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

  startUpload: function () {
    this._validateOptionsAndFiles();
  },

  addParam: function (key, value) {
    this.options.params[key] = value;
  },

  cancelUpload: function () {
    this.xhrs.forEach(function (xhr) {
      xhr.abort();
    });
    this._triggerEvent("lu:cancelled");
  }
};
