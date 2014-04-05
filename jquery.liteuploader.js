/* liteUploader v2.0.0 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

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

    this.init();
}

LiteUploader.prototype = {
    init: function () {
        if (this.options.changeHandler) {
            this.el.change(function () {
                this.start();
            }.bind(this));
        }

        if (this.options.clickElement) {
            this.options.clickElement.click(function () {
                this.start();
            }.bind(this));
        }
    },

    start: function () {
        var proceedWithUpload = true,
            files = this.el.get(0).files;

        if (!this.el.attr('name')) {
            console.error('the file input element must have a name attribute');
            proceedWithUpload = false;
        }

        if (!this.options.script) {
            console.error('the script option is required');
            proceedWithUpload = false;
        }

        if (this.validateFiles(files)) {
            proceedWithUpload = false;
        }

        if (!proceedWithUpload) {
            this.resetInput();
            return;
        }

        this.el.trigger('lu:before', [files]);
        this.performUpload(this.collateFormData(files));
    },

    resetInput: function () {
        this.el.replaceWith(this.el.clone(true));
    },

    validateFiles: function (files) {
        var errorsPresent = false,
            errorReporter = [];

        $.each(files, function (i) {
            var errorsFound = this.findErrors(files[i]);

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

    findErrors: function (file) {
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

    getFormDataObject: function () {
        return new FormData();
    },

    addParam: function (key, value) {
        this.params[key] = value;
    },

    collateFormData: function (files) {
        var formData = this.getFormDataObject();

        if (this.el.attr('id')) {
            formData.append('liteUploader_id', this.el.attr('id'));
        }

        $.each(this.params, function (key, value) {
            formData.append(key, value);
        });

        $.each(files, function (i) {
            formData.append(this.el.attr('name') + '[]', files[i]);
        }.bind(this));

        return formData;
    },

    performUpload: function (formData) {
        $.ajax({
            xhr: function () {
                var xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', function (evt) {
                    if (evt.lengthComputable) {
                        this.el.trigger('lu:progress', Math.floor((evt.loaded / evt.total) * 100));
                    }
                }.bind(this), false);

                return xhr;
            }.bind(this),
            url: this.options.script,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false
        })
        .done(function(response){
            this.el.trigger('lu:success', response);
            this.resetInput();
        }.bind(this))
        .fail(function(jqXHR) {
            this.el.trigger('lu:fail', jqXHR);
            this.resetInput();
        }.bind(this));
    }
};
