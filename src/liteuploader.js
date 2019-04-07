(function (factory) {

  /* istanbul ignore else */
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory(global.$);
  } else {
    factory($);
  }
}(function ($) {

  /* istanbul ignore next */
  if ($ && $.fn) {
    $.fn.liteUploader = function (options) {
      return this.each(function () {
        options.ref = options.ref || $(this).attr("name");

        var getFiles = function () {
          return $(this).get(0).files;
        }.bind(this);

        var onEvent = function (name, data) {
          $(this).trigger.bind($(this))(name, [data]);
        }.bind(this)

        $.data(this, "liteUploader", new LiteUploader(options, onEvent, getFiles));
      });
    };
  }

  function LiteUploader (options, onEvent, getFiles) {
    this.options = this._applyDefaults(options);
    this._getFiles = getFiles || function () { return null};
    this._triggerEvent = onEvent;
    this.xhrs = [];
  }

  LiteUploader.prototype = {
    _applyDefaults: function (options) {
      return Object.assign({
        url: null,
        ref: null,
        method: "POST",
        rules: {},
        params: {},
        headers: {},
        validators: [],
        singleFileUploads: false,
        withCredentials: false,
        beforeRequest: null,
        sendAsFormData: true,
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
          this._triggerEvent("lu:errors", {errors});
        } else {
          this._triggerEvent("lu:start", {files});
          this.xhrs = [];
          this._startUpload(files);
        }
      }.bind(this));
    },

    _startUpload: function (files) {
      const promises = this._splitFiles(files).map(function (fileSplit) {
        return this._buildXhrObject(fileSplit)
          .then(function(xhr) {
            return this._beforeRequest(fileSplit)
            .then(function (formData) {
              if (!this.options.sendAsFormData && this.options.singleFileUploads) return xhr.send(fileSplit[0])
              return xhr.send(formData);
            }.bind(this));
          }.bind(this))
      }.bind(this));

      return Promise.all(promises)
    },

    _splitFiles: function (files) {
      if (this.options.singleFileUploads) {
        return Array.prototype.map.call(files, function (file) {
          return [file];
        });
      } else {
        return [files];
      }
    },

    _beforeRequest: function (files) {
      this._triggerEvent("lu:before", {files});
      var formData = this._collateFormData(files);
      return this.options.beforeRequest ? this.options.beforeRequest(files, formData) : Promise.resolve(formData);
    },

    _validateOptions: function () {
      var requiredOptions = ["url", "ref"];

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
      var promises = Array.prototype.map.call(files, function (file) {
        return this._validateFile(file);
      }.bind(this));

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

    _getFormDataObject: function() {
      return new FormData()
    },

    _collateFormData: function (files) {
      var formData = this._getFormDataObject();

      for (var key in this.options.params) {
        formData.append(key, this.options.params[key]);
      }

      Array.prototype.forEach.call(files, function (file) {
        formData.append(this.options.ref, file);
      }.bind(this));

      return formData;
    },

    _getXmlHttpRequestObject: function () {
      return new XMLHttpRequest();
    },

    _getScriptUrl: function(files) {
      if (typeof this.options.url === "function") return this.options.url(files)
      return Promise.resolve(this.options.url)
    },

    _buildXhrObject: function (files) {
      return this._getScriptUrl(files)
        .then(function(url) {
          var xhr = this._getXmlHttpRequestObject();
          xhr.open(this.options.method, url);
          if (this.options.withCredentials) xhr.withCredentials = true

          for (var key in this.options.headers) {
            xhr.setRequestHeader(key, this.options.headers[key]);
          }

          xhr.upload.addEventListener("progress", this._onXHRProgress.bind(this, files), false);

          xhr.onreadystatechange = function () {
            this._onXHRResponse(files, xhr);
          }.bind(this);

          this.xhrs.push(xhr);
          return xhr;
        }.bind(this))
    },

    _onXHRProgress: function (files, e) {
      if (!e.lengthComputable) return;

      this._triggerEvent("lu:progress", {
        files: files,
        percentage: Math.floor((e.loaded / e.total) * 100)
      });
    },

    _onXHRResponse: function (files, xhr) {
      if (xhr.readyState !== 4) return;

      this._triggerEvent("lu:finish");

      if (xhr.status >= 200 && xhr.status < 300) {
        this._triggerEvent("lu:success", {files, response: xhr.responseText});
      } else {
        this._triggerEvent("lu:fail", {xhr});
      }
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
