/* global LiteUploader, XMLHttpRequestUpload */

'use strict';

describe('Lite Uploader', function () {
    var fileInput = '<input type="file" name="tester" id="foobar" />';
    var clickElement = $('<input type="button" />');

    describe('basic instantiation', function () {
        it('should be able to be instantiated', function () {
            spyOn(LiteUploader.prototype, '_init');

            spyOn(LiteUploader.prototype, '_buildXhrObject').and.returnValue('xhrObject');
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});

            expect(liteUploader).toBeTruthy();
            expect(liteUploader.el).toEqual(jasmine.any(Object));
            expect(liteUploader.options).toEqual({tester: 'abc', params: {foo: '123'}});
            expect(liteUploader.params).toEqual({foo: '123'});
            expect(liteUploader.xhr).toEqual('xhrObject');
            expect(liteUploader._init).toHaveBeenCalled();
        });
    });

    describe('binding start event', function () {
        it('should be called on file input change when changeHandler option is true', function () {
            spyOn(LiteUploader.prototype, '_start');
            var liteUploader = new LiteUploader(fileInput, {changeHandler: true});

            liteUploader.el.triggerHandler('change');

            expect(liteUploader._start).toHaveBeenCalled();
        });

        it('should not be called on file input change when changeHandler option is false', function () {
            spyOn(LiteUploader.prototype, '_start');
            var liteUploader = new LiteUploader(fileInput, {changeHandler: false});

            liteUploader.el.triggerHandler('change');

            expect(liteUploader._start).not.toHaveBeenCalled();
        });

        it('should be called on element click when clickElement option is set', function () {
            spyOn(LiteUploader.prototype, '_start');
            var liteUploader = new LiteUploader(fileInput, {clickElement: clickElement});

            clickElement.triggerHandler('click');

            expect(liteUploader._start).toHaveBeenCalled();
        });
    });

    describe('start', function () {
        it('should not proceed with upload if there are input errors', function () {
            spyOn(LiteUploader.prototype, '_getInputErrors').and.returnValue('foo');
            spyOn(LiteUploader.prototype, '_resetInput');
            spyOn(LiteUploader.prototype, '_performUpload');
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._start();

            expect(liteUploader._resetInput).toHaveBeenCalled();
            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:errors', 'foo');
            expect(liteUploader._performUpload).not.toHaveBeenCalled();
        });

        it('should not proceed with upload if the files do not pass file validation', function () {
            spyOn(LiteUploader.prototype, '_getInputErrors').and.returnValue(null);
            spyOn(LiteUploader.prototype, '_getFileErrors').and.returnValue('bar');
            spyOn(LiteUploader.prototype, '_resetInput');
            spyOn(LiteUploader.prototype, '_performUpload');
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._start();

            expect(liteUploader._resetInput).toHaveBeenCalled();
            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:errors', 'bar');
            expect(liteUploader._performUpload).not.toHaveBeenCalled();
        });

        it('should proceed with upload if no errors are found', function () {
            spyOn(LiteUploader.prototype, '_getInputErrors').and.returnValue(null);
            spyOn(LiteUploader.prototype, '_getFileErrors').and.returnValue(null);
            spyOn(LiteUploader.prototype, '_resetInput');
            spyOn(LiteUploader.prototype, '_collateFormData').and.returnValue('collated');
            spyOn(LiteUploader.prototype, '_performUpload');
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._start();

            expect(liteUploader._resetInput).not.toHaveBeenCalled();
            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:before', jasmine.any(Array));
            expect(liteUploader._performUpload).toHaveBeenCalledWith('collated');
        });
    });

    describe('reset input', function () {
        it('should change the value of the form input to an empty string', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});

            spyOn(liteUploader.el, 'val');
            liteUploader._resetInput();

            expect(liteUploader.el.val).toHaveBeenCalledWith('');
        });
    });

    describe('get input errors', function () {
        it('should return error if the file input has no name attribute', function () {
            var liteUploader = new LiteUploader('<input type="file" />', {script: 'script'});

            var result = liteUploader._getInputErrors([1]);

            expect(result).toEqual([[{name: 'liteUploader_input', errors: [{type: 'fileInputNameRequired'}]}]]);
        });

        it('should return error if the script option is blank', function () {
            var liteUploader = new LiteUploader(fileInput, {});

            var result = liteUploader._getInputErrors([1]);

            expect(result).toEqual([[{name: 'liteUploader_input', errors: [{type: 'scriptOptionRequired'}]}]]);
        });

        it('should return error if the file array is empty', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});

            var result = liteUploader._getInputErrors([]);

            expect(result).toEqual([[{name: 'liteUploader_input', errors: [{type: 'noFilesSelected'}]}]]);
        });

        it('should return null if no input errors are found', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});

            var result = liteUploader._getInputErrors([1]);

            expect(result).not.toBeTruthy();
        });
    });

    describe('file validation', function () {
        it('should return errors if any are found', function () {
            var files = [{name: 'name'}];
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader, '_findErrorsForFile').and.returnValue([{error: 'here'}]);

            var result = liteUploader._getFileErrors(files);

            expect(result).toEqual([[{name: 'name', errors: [{error: 'here'}]}]]);
        });

        it('should return null if no errors are found', function () {
            var files = [{name: 'name'}];
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader, '_findErrorsForFile').and.returnValue([]);

            var result = liteUploader._getFileErrors(files);

            expect(result).not.toBeTruthy();
        });
    });

    describe('find errors in file', function () {
        it('should return error if file is an invalid type', function () {
            var file = {name: 'name', type: 'd', size: 100},
                liteUploader = new LiteUploader(fileInput, {
                    script: 'script',
                    rules: {
                        allowedFileTypes: 'a,b,c'
                    }
                }),
                result;

            result = liteUploader._findErrorsForFile(file);

            expect(result).toEqual([{'type': 'type', 'rule': 'a,b,c', 'given': 'd'}]);
        });

        it('should return error if file has an invalid size', function () {
            var file = {name: 'name', type: 'a', size: 100},
                liteUploader = new LiteUploader(fileInput, {
                    script: 'script',
                    rules: {
                        allowedFileTypes: 'a,b,c',
                        maxSize: 99
                    }
                }),
                result;

            result = liteUploader._findErrorsForFile(file);

            expect(result).toEqual([{'type': 'size', 'rule': 99, 'given': 100}]);
        });
    });

    describe('get form data object', function () {
        it('should return FormData object', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}}),
                returned;

            returned = liteUploader._getFormDataObject();

            expect(returned instanceof FormData).toBeTruthy();
        });
    });

    describe('form data', function () {
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
        });

        afterEach(function () {
            formDataObject = null;
        });

        it('should add extra params onto params hash defined on instantiation', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {foo: '123'}});

            liteUploader.addParam('bar', '456');

            expect(liteUploader.params).toEqual({foo: '123', bar: '456'});
        });

        it('should add liteUploader_id to form data if the file input has an id', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {}}),
                result;
            spyOn(liteUploader, '_getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader._collateFormData([]);

            expect(result.get()).toEqual([{'liteUploader_id': 'foobar'}]);
        });

        it('should not add liteUploader_id to form data if the file input does not have an id', function () {
            var liteUploader = new LiteUploader('<input type="file" name="tester" />', {params: {}}),
                result;
            spyOn(liteUploader, '_getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader._collateFormData([]);

            expect(result.get()).toEqual([]);
        });

        it('should add any params to form data', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {tester: 123, another: 'abc'}}),
                result;
            spyOn(liteUploader, '_getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader._collateFormData([]);

            expect(result.get()).toEqual([{ 'liteUploader_id' : 'foobar' }, {tester: 123}, {another: 'abc'}]);
        });

        it('should add any files to form data', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {}}),
                result;
            spyOn(liteUploader, '_getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader._collateFormData(['tester1', 'tester2']);

            expect(result.get()).toEqual([{ 'liteUploader_id' : 'foobar' }, {'tester': 'tester1'}, {'tester': 'tester2'}]);
        });
    });

    describe('building xhr object', function () {
        it('should return a new instance of XMLHttpRequest and setup a progress listener', function () {
            spyOn(XMLHttpRequestUpload.prototype, 'addEventListener');
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});

            liteUploader._buildXhrObject();

            expect(liteUploader.xhr instanceof XMLHttpRequest).toBeTruthy();
            expect(XMLHttpRequestUpload.prototype.addEventListener).toHaveBeenCalledWith('progress', jasmine.any(Function), false);
        });
    });

    describe('get xhr object', function () {
        it('should return the xhr variable', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'abc', params: {foo: '123'}});

            liteUploader.xhr = 'abc';
            var result = liteUploader._getXHRObject();

            expect(result).toEqual('abc');
        });
    });

    describe('perform upload', function () {
        it('should setup the ajax call correctly', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'abc', params: {foo: '123'}});
            var deferred = $.Deferred();

            spyOn($, 'ajax').and.returnValue(deferred);
            liteUploader._performUpload('form-data');

            expect($.ajax).toHaveBeenCalledWith({
                xhr: jasmine.any(Function),
                url: 'abc',
                type: 'POST',
                data: 'form-data',
                processData: false,
                contentType: false
            });
        });

        it('should trigger success event on success', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'abc', params: {foo: '123'}});
            var deferred = $.Deferred();

            spyOn($, 'ajax').and.returnValue(deferred);
            spyOn(liteUploader, '_onXHRSuccess');
            spyOn(liteUploader, '_resetInput');
            liteUploader._performUpload('form-data');
            deferred.resolve();

            expect(liteUploader._onXHRSuccess).toHaveBeenCalled();
            expect(liteUploader._resetInput).toHaveBeenCalled();
        });

        it('should trigger fail event on fail', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'abc', params: {foo: '123'}});
            var deferred = $.Deferred();

            spyOn($, 'ajax').and.returnValue(deferred);
            spyOn(liteUploader, '_onXHRFailure');
            spyOn(liteUploader, '_resetInput');
            liteUploader._performUpload('form-data');
            deferred.reject();

            expect(liteUploader._onXHRFailure).toHaveBeenCalled();
            expect(liteUploader._resetInput).toHaveBeenCalled();
        });
    });

    describe('xhr object on-progress', function () {
        it('should not trigger progress event if lengthComputable is false', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._onXHRProgress({lengthComputable: false});

            expect(liteUploader.el.trigger).not.toHaveBeenCalled();
        });

        it('should trigger progress event if lengthComputable is true', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._onXHRProgress({
                lengthComputable: true,
                loaded: 2.1,
                total: 10.3
            });

            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:progress', 20);
        });
    });

    describe('xhr object on-success', function () {
        it('should trigger success event', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._onXHRSuccess({response: 'something'});

            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:success', {response: 'something'});
        });
    });

    describe('xhr object on-failure', function () {
        it('should trigger fail event', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            spyOn(liteUploader.el, 'trigger');

            liteUploader._onXHRFailure({jqXHR: 'something'});

            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:fail', {jqXHR: 'something'});
        });
    });

    describe('xhr object on-always', function () {
        it('should reset the input', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            spyOn(liteUploader, '_resetInput');

            liteUploader._onXHRAlways();

            expect(liteUploader._resetInput).toHaveBeenCalled();
        });
    });

    describe('cancel upload', function () {
        it('should abort the xhr object, trigger cancelled event and reset the input', function () {
            var liteUploader = new LiteUploader(fileInput, {tester: 'abc', params: {foo: '123'}});
            liteUploader.xhr = {
                abort: jasmine.createSpy()
            };

            spyOn(liteUploader.el, 'trigger');
            spyOn(liteUploader, '_resetInput');
            liteUploader.cancelUpload();

            expect(liteUploader.xhr.abort).toHaveBeenCalled();
            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:cancelled');
            expect(liteUploader._resetInput).toHaveBeenCalled();
        });
    });
});
