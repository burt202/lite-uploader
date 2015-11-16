/* liteUploader v2.2.0 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

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
        // By default file selections are uploaded in one request each.
        // Set to true to upload each file of a selection using an individual request.
        singleFileUploads: false,
        // Delay the file upload request by returning a promise.
        // File upload will start after the promise resolves with the formData.
        beforeRequest: function (files, formData) { return $.when(formData); }
    };

    return this.each(function () {
        $.data(this, 'liteUploader', new LiteUploader(this, $.extend(defaults, options)));
    });
};

function LiteUploader (element, options) {
    this.el = $(element);
    this.options = options;
    this.params = options.params;
    this.xhrs = [];

    this._init();
}

LiteUploader.prototype = {
    _init: function () {
        if (this.options.changeHandler) {
            this.el.change(function () {
                this._start();
            }.bind(this));
        }

        if (this.options.clickElement) {
            this.options.clickElement.click(function () {
                this._start();
            }.bind(this));
        }
    },

    _start: function () {
        var files = this.el.get(0).files;
        var errors = this._getInputErrors(files);
        if (!errors) errors = this._getFileErrors(files);

        if (errors) {
            this.el.trigger('lu:errors', errors);
            this._resetInput();
        } else {
            this.el.trigger('lu:start', files);
            this._startUploadWithFiles(files);
        }
    },

    _startUploadWithFiles: function (files) {
        function performUpload() {
            this.el.trigger('lu:before', [files]);
            this.options.beforeRequest(files, this._collateFormData(files))
                .done(this._performUpload.bind(this));
        }

        if (this.options.singleFileUploads) {
            $.each(files, function (i) {
                performUpload.call(this, [files[i]]);
            }.bind(this));
        } else {
            performUpload.call(this, files);
        }
    },

    _resetInput: function () {
        this.el.val('');
    },

    _getInputErrors: function (files) {
        var errors = [];
        var inputErrors = [];

        if (!this.el.attr('name')) {
            errors.push({
                type: 'fileInputNameRequired'
            });
        }

        if (!this.options.script) {
            errors.push({
                type: 'scriptOptionRequired'
            });
        }

        if (files.length === 0) {
            errors.push({
                type: 'noFilesSelected'
            });
        }

        inputErrors.push ({
            name: 'liteUploader_input',
            errors: errors
        });

        return (errors.length > 0) ? [inputErrors] : null;
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
            if (key === 'allowedFileTypes' && value && $.inArray(file.type, value.split(',')) === -1) {
                errorsArray.push({
                    type: 'type',
                    rule: value,
                    given: file.type
                });
            }

            if (key === 'maxSize' && value && file.size > value) {
                errorsArray.push({
                    type: 'size',
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
        if (this.el.attr('id')) formData.append('liteUploader_id', this.el.attr('id'));

        $.each(this.params, function (key, value) {
            formData.append(key, value);
        });

        $.each(files, function (i) {
            formData.append(this.el.attr('name'), files[i]);
        }.bind(this));

        return formData;
    },

    _buildXhrObject: function () {
        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', this._onXHRProgress.bind(this), false);
        this.xhrs.push(xhr);
        return xhr;
    },

    _performUpload: function (formData) {
        $.ajax({
            xhr: this._buildXhrObject.bind(this),
            url: this.options.script,
            type: 'POST',
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
        if (e.lengthComputable) this.el.trigger('lu:progress', Math.floor((e.loaded / e.total) * 100));
    },

    _onXHRSuccess: function (response) {
        this.el.trigger('lu:success', response);
    },

    _onXHRFailure: function (jqXHR) {
        this.el.trigger('lu:fail', jqXHR);
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
        this.el.trigger('lu:cancelled');
        this._resetInput();
    }
};
