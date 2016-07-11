(function (factory) {
  var noop = {fn: {}};

  /* istanbul ignore else */
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(noop);
  } else {
    factory($ || noop);
  }
}(function ($) {

  /* istanbul ignore next */
  $.fn.liteUploader = function (options) {
    return this.each(function () {
      options.ref = options.ref || $(this).attr("name");

      var getFiles = function () {
        return $(this).get(0).files;
      }.bind(this);

      var onEvent = function (name, data) {
        $(this).trigger.bind($(this))(name, [data]);
      }.bind(this)

      $.data(this, "liteUploader", new LiteUploader(options, getFiles, onEvent));
    });
  };

  function LiteUploader (options, getFiles, onEvent) {
    this.options = this._applyDefaults(options);
    this._getFiles = getFiles;
    this._triggerEvent = onEvent;
    this.xhrs = [];
  }

  LiteUploader.prototype = {
    _applyDefaults: function (options) {
      return Object.assign({
        script: null,
        ref: null,
        rules: {},
        params: {},
        headers: {},
        validators: [],
        singleFileUploads: false,
        beforeRequest: function (files, formData) { return Promise.resolve(formData); }
      }, options);
    },

    _init: function (files) {
      files = files || this._getFiles();
      if (!files || !files.length) throw new Error("No files");

      return Promise.all([this._validateOptions(), this._validateFiles(files)])
      .then(function (allErrors) {
        var errors = allErrors[0];
        if (!errors) errors = allErrors[1];

        if (errors) {
          this._triggerEvent("lu:errors", errors);
        } else {
          this._triggerEvent("lu:start", files);
          this.xhrs = [];
          this._startUpload(files);
        }
      }.bind(this));
    },

    _startUpload: function (files) {
      return this._splitFiles(files).map(function (files) {
        var xhr = this._buildXhrObject();

        return this._beforeRequest(files)
        .then(function (formData) {
          return xhr.send(formData);
        });
      }.bind(this));
    },

    _splitFiles: function (files) {
      var uploads = [];

      if (this.options.singleFileUploads) {
        for (var i = 0; i < files.length; i++) {
          uploads.push([files[i]]);
        }
      } else {
        uploads.push(files);
      }

      return uploads;
    },

    _beforeRequest: function (files) {
      this._triggerEvent("lu:before", files);
      var formData = this._collateFormData(files);
      return this.options.beforeRequest(files, formData);
    },

    _validateOptions: function () {
      var requiredOptions = ["script", "ref"];

      var errors = requiredOptions.reduce(function (acc, option) {
        if (!this.options[option]) acc.push({ type: option + "Required" });
        return acc;
      }.bind(this), []);

      if (!errors.length) return null;

      return [{
        name: "_options",
        errors: errors
      }];
    },

    _allowedFileTypeValidator: function (rule, file) {
      var allowedTypes = rule.split(",");
      var isWildcardType = /([a-z]+)\/\*$/;

      if (allowedTypes.indexOf(file.type) !== -1) return;

      var allowed = allowedTypes.reduce(function(result, allowedType) {
        if (result) {
          return result;
        } else {
          var matches = allowedType.match(isWildcardType) || [];
          return matches[1] === file.type.split("/")[0];
        }
      }, false);

      if (!allowed) {
        return {
          type: "type",
          rule: rule,
          given: file.type
        };
      }
    },

    _maxSizeValidator: function (rule, file) {
      if (file.size > rule) {
        return {
          type: "size",
          rule: rule,
          given: file.size
        };
      }
    },

    _validateFiles: function (files) {
      var promises = []

      for (var i = 0; i < files.length; i++) {
        promises.push(this._validateFile(files[i]));
      }

      return Promise.all(promises)
      .then(function (fileErrors) {
        var allErrors = fileErrors.filter(function (file) {
          return file.errors.length;
        });

        return (allErrors.length) ? allErrors : null;
      });
    },

    _validateFile: function (file) {
      var validatorMap = {
        "allowedFileTypes": this._allowedFileTypeValidator,
        "maxSize": this._maxSizeValidator
      };

      var builtIn = Object.keys(this.options.rules).reduce(function (acc, key) {
        var rule = this.options.rules[key];
        if (rule && validatorMap[key]) acc.push(validatorMap[key](rule, file));
        return acc;
      }.bind(this), []);

      var custom = this.options.validators.map(function (fn) {
        return fn(file);
      });

      return Promise.all(builtIn.concat(custom))
      .then(function (fileErrors) {
        return {
          name: file.name,
          errors: fileErrors.filter(function (error) {
            return !!error;
          })
        }
      });
    },

    _getFormDataObject: function () {
      return new FormData();
    },

    _collateFormData: function (files) {
      var formData = this._getFormDataObject();

      for (var key in this.options.params) {
        formData.append(key, this.options.params[key]);
      }

      for (var i = 0; i < files.length; i++) {
        formData.append(this.options.ref, files[i]);
      }

      return formData;
    },

    _getXmlHttpRequestObject: function () {
      return new XMLHttpRequest();
    },

    _buildXhrObject: function () {
      var xhr = this._getXmlHttpRequestObject();
      xhr.open("POST", this.options.script);

      for (var key in this.options.headers) {
        xhr.setRequestHeader(key, this.options.headers[key]);
      }

      xhr.upload.addEventListener("progress", this._onXHRProgress.bind(this), false);
      xhr.addEventListener("error", this._onXHRFailure.bind(this), false);

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) this._onXHRSuccess(xhr.responseText);
      }.bind(this);

      this.xhrs.push(xhr);
      return xhr;
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

    startUpload: function (files) {
      this._init(files);
    },

    addParam: function (key, value) {
      this.options.params[key] = value;
    },

    cancelUpload: function () {
      this._triggerEvent("lu:cancelled");

      this.xhrs.forEach(function (xhr) {
        xhr.abort();
      });
    }
  };

  return LiteUploader;
}));
