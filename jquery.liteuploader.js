/* liteUploader v2.1.1 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

$.fn.liteUploader = function (options) {
    var defaults = {
        script: null,
        rules: {
            allowedFileTypes: null,
            maxSize: null
        },
        params: {},
        changeHandler: true,
        clickElement: null
    };

    return this.each(function () {
        $.data(this, 'liteUploader', new LiteUploader(this, $.extend(defaults, options)));
    });
};

function LiteUploader (element, options) {
    this.el = $(element);
    this.options = options;
    this.params = options.params;
    this.xhr = this._buildXhrObject();

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

    _buildXhrObject: function () {
        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', this._onProgress.bind(this), false);
        return xhr;
    },

    _onProgress: function (evt) {
        if (evt.lengthComputable) {
            this.el.trigger('lu:progress', Math.floor((evt.loaded / evt.total) * 100));
        }
    },

    _start: function () {
        var files = this.el.get(0).files;

        if (this._validateInput(files)) {
            this._resetInput();
            return;
        }

        if (this._validateFiles(files)) {
            this._resetInput();
            return;
        }

        this.el.trigger('lu:before', [files]);
        this._performUpload(this._collateFormData(files));
    },

    _resetInput: function () {
        this.el.val('');
    },

    _validateInput: function (files) {
        var errors = [];

        if (!this.el.attr('name')) {
            errors.push('the file input element must have a name attribute');
        }

        if (!this.options.script) {
            errors.push('the script option is required');
        }

        if (files.length === 0) {
            errors.push('at least one file must be selected');
        }

        this.el.trigger('lu:errors', [[{
            name: 'liteUploader_input',
            errors: errors
        }]]);

        if (errors.length > 0) {
            return true;
        }
        return false;
    },

    _validateFiles: function (files) {
        var errorsPresent = false,
            errorReporter = [];

        $.each(files, function (i) {
            var errorsFound = this._findErrors(files[i]);

            errorReporter.push({
                name: files[i].name,
                errors: errorsFound
            });

            if (errorsFound.length > 0) {
                errorsPresent = true;
            }
        }.bind(this));

        this.el.trigger('lu:errors', [errorReporter]);
        return errorsPresent;
    },

    _findErrors: function (file) {
        var errorsArray = [];

        $.each(this.options.rules, function (key, value) {
            if (key === 'allowedFileTypes' && value && $.inArray(file.type, value.split(',')) === -1) {
                errorsArray.push({'type': 'type', 'rule': value, 'given': file.type});
            }

            if (key === 'maxSize' && value && file.size > value) {
                errorsArray.push({'type': 'size', 'rule': value, 'given': file.size});
            }
        });

        return errorsArray;
    },

    _getFormDataObject: function () {
        return new FormData();
    },

    _collateFormData: function (files) {
        var formData = this._getFormDataObject();

        if (this.el.attr('id')) {
            formData.append('liteUploader_id', this.el.attr('id'));
        }

        $.each(this.params, function (key, value) {
            formData.append(key, value);
        });

        $.each(files, function (i) {
            formData.append(this.el.attr('name'), files[i]);
        }.bind(this));

        return formData;
    },

    _performUpload: function (formData) {
        $.ajax({
            xhr: function () {
                return this.xhr;
            }.bind(this),
            url: this.options.script,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false
        })
        .done(function(response){
            this.el.trigger('lu:success', response);
        }.bind(this))
        .fail(function(jqXHR) {
            this.el.trigger('lu:fail', jqXHR);
        }.bind(this))
        .always(function() {
            this._resetInput();
        }.bind(this));
    },

    addParam: function (key, value) {
        this.params[key] = value;
    },

    cancelUpload: function () {
        this.xhr.abort();
        this.el.trigger('lu:cancelled');
        this._resetInput();
    }
};
