/* global LiteUploader */

describe('Lite Uploader', function () {
    var fileInput = '<input type="file" name="tester" id="foobar" />',
        clickElement = $('<input type="button" />');

    describe('basic instantiation', function () {
        it('should be able to be instantiated', function () {
            spyOn(LiteUploader.prototype, 'init');

            var liteUploader = new LiteUploader(fileInput, {tester:'abc', params: {foo: '123'}});

            expect(liteUploader).toBeTruthy();
            expect(liteUploader.el).toEqual(jasmine.any(Object));
            expect(liteUploader.options).toEqual({tester:'abc', params: {foo: '123'}});
            expect(liteUploader.params).toEqual({foo: '123'});
            expect(liteUploader.init).toHaveBeenCalled();
        });
    });

    describe('start event', function () {
        it('should be called on file input change when changeHandler option is true', function () {
            spyOn(LiteUploader.prototype, 'start');
            var liteUploader = new LiteUploader(fileInput, {changeHandler: true});

            liteUploader.el.triggerHandler('change');

            expect(liteUploader.start).toHaveBeenCalled();
        });

        it('should not be called on file input change when changeHandler option is false', function () {
            spyOn(LiteUploader.prototype, 'start');
            var liteUploader = new LiteUploader(fileInput, {changeHandler: false});

            liteUploader.el.triggerHandler('change');

            expect(liteUploader.start).not.toHaveBeenCalled();
        });

        it('should be called on element click when clickElement option is set', function () {
            spyOn(LiteUploader.prototype, 'start');
            var liteUploader = new LiteUploader(fileInput, {clickElement: clickElement});

            clickElement.triggerHandler('click');

            expect(liteUploader.start).toHaveBeenCalled();
        });
    });

    describe('initial validation', function () {
        it('should not proceed with upload if file input does not have a name attribute', function () {
            spyOn(console, 'error');
            spyOn(LiteUploader.prototype, 'resetInput');
            spyOn(LiteUploader.prototype, 'performUpload');
            var liteUploader = new LiteUploader('<input type="file" />', {});

            liteUploader.start();

            expect(console.error).toHaveBeenCalledWith(jasmine.any(String));
            expect(liteUploader.resetInput).toHaveBeenCalled();
            expect(liteUploader.performUpload).not.toHaveBeenCalled();
        });

        it('should not proceed with upload if the script option has not been set', function () {
            spyOn(console, 'error');
            spyOn(LiteUploader.prototype, 'resetInput');
            spyOn(LiteUploader.prototype, 'performUpload');
            var liteUploader = new LiteUploader(fileInput, {});

            liteUploader.start();

            expect(console.error).toHaveBeenCalledWith(jasmine.any(String));
            expect(liteUploader.resetInput).toHaveBeenCalled();
            expect(liteUploader.performUpload).not.toHaveBeenCalled();
        });

        it('should not proceed with upload if the files do not pass validation', function () {
            spyOn(LiteUploader.prototype, 'validateFiles').and.returnValue(true);
            spyOn(LiteUploader.prototype, 'resetInput');
            spyOn(LiteUploader.prototype, 'performUpload');
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});

            liteUploader.start();

            expect(liteUploader.resetInput).toHaveBeenCalled();
            expect(liteUploader.performUpload).not.toHaveBeenCalled();
        });

        it('should proceed with upload if no errors are found', function () {
            spyOn(LiteUploader.prototype, 'validateFiles').and.returnValue(false);
            spyOn(LiteUploader.prototype, 'resetInput');
            spyOn(LiteUploader.prototype, 'collateFormData').and.returnValue('collated');
            spyOn(LiteUploader.prototype, 'performUpload');
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader.el, 'trigger');

            liteUploader.start();

            expect(liteUploader.resetInput).not.toHaveBeenCalled();
            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:before', jasmine.any(Object));
            expect(liteUploader.performUpload).toHaveBeenCalledWith('collated');
        });
    });

    describe('reset input', function () {
        it('should clear the file input', function () {
            var liteUploader = new LiteUploader(fileInput, {script: 'script'});
            spyOn(liteUploader.el, 'replaceWith');

            liteUploader.resetInput();

            expect(liteUploader.el.replaceWith).toHaveBeenCalledWith(jasmine.any(Object));
        });
    });

    describe('file validation', function () {
        it('should pass errors found to errors event if any are found and return true', function () {
            var files = [{name: 'name'}],
                liteUploader = new LiteUploader(fileInput, {script: 'script'}),
                result;
            spyOn(liteUploader, 'findErrors').and.returnValue([{error: 'here'}]);
            spyOn(liteUploader.el, 'trigger');

            result = liteUploader.validateFiles(files);

            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:errors', [[{name: 'name', errors: [{error: 'here'}]}]]);
            expect(result).toBe(true);
        });

        it('should return false if no files errors are found', function () {
            var files = [{name: 'name'}],
                liteUploader = new LiteUploader(fileInput, {script: 'script'}),
                result;
            spyOn(liteUploader, 'findErrors').and.returnValue([]);
            spyOn(liteUploader.el, 'trigger');

            result = liteUploader.validateFiles(files);

            expect(liteUploader.el.trigger).toHaveBeenCalledWith('lu:errors', [[{name: 'name', errors: []}]]);
            expect(result).toBe(false);
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

            result = liteUploader.findErrors(file);

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

            result = liteUploader.findErrors(file);

            expect(result).toEqual([{'type': 'size', 'rule': 99, 'given': 100}]);
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
            spyOn(liteUploader, 'getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader.collateFormData([]);

            expect(result.get()).toEqual([{'liteUploader_id': 'foobar'}]);
        });

        it('should not add liteUploader_id to form data if the file input does not have an id', function () {
            var liteUploader = new LiteUploader('<input type="file" name="tester" />', {params: {}}),
                result;
            spyOn(liteUploader, 'getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader.collateFormData([]);

            expect(result.get()).toEqual([]);
        });

        it('should add any params to form data', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {tester: 123, another: 'abc'}}),
                result;
            spyOn(liteUploader, 'getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader.collateFormData([]);

            expect(result.get()).toEqual([{ 'liteUploader_id' : 'foobar' }, {tester: 123}, {another: 'abc'}]);
        });

        it('should add any files to form data', function () {
            var liteUploader = new LiteUploader(fileInput, {params: {}}),
                result;
            spyOn(liteUploader, 'getFormDataObject').and.returnValue(formDataObject);

            result = liteUploader.collateFormData(['tester1', 'tester2']);

            expect(result.get()).toEqual([{ 'liteUploader_id' : 'foobar' }, {'tester[]': 'tester1'}, {'tester[]': 'tester2'}]);
        });
    });
});
