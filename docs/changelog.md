### Changelog

5.3.0 (04 April 2019)

* Add method option

5.2.0 (04 April 2019)

* Add withCredentials option
* Expand success status codes to be anything within 200 range

5.1.0 (27 September 2018)

* Add lu:finish event

5.0.3 (16 September 2017)

* Fix use when using node/jquery
* documentation improvements

5.0.2 (05 December 2016)

* correct 'main' property in package.json and bower.json
* fix issue that stopped the uploader working using jQuery within node

5.0.1 (01 November 2016)

* add travis build badge
* remove gulp in favour of npm scripts

5.0.0 (06 September 2016)

* pass FileList to progress event

4.0.0 (14 July 2016)

* remove jquery dependency
* add custom validators
* remove support for older browsers by using Promises and Object.assign

3.3.3 (15 May 2016)

* only wrap error data for jquery

3.3.2 (29 March 2016)

* fix promise chain by using .then()

3.3.1 (27 March 2016)

* become less reliant on jQuery methods

3.3.0 (26 March 2016)

* return errors in one array param rather than as an individual param for each error

3.2.2 (05 December 2015)

* fixes how the plugin deals with undefined files

3.2.1 (05 December 2015)

* fixes how the fileList is iterated through on validation

3.2.0 (02 December 2015)

* adds ability to pass a FileList into 'startUpload' method
* removes 'noFilesSelected' error
* removes outer array for errors
* renames 'scriptOptionRequired' to 'scriptRequired'
* renames general errors from '_general' to '_options'

3.1.0 (29 November 2015)

* adds support for wildcard type validation
* adds ref option
* adds node context support

3.0.0 (24 November 2015)

* adds 'startUpload' public method
* removes 'changeHandler' option (use 'startUpload' method instead)
* removes 'clickElement' option (use 'startUpload' method instead)
* removes addition of 'liteUploader_id' param to form data, add unique identifier externally using 'params' option
* removes all handling of resetting the input, this should be managed externally from now on
* renames 'fileInputNameRequired' error to 'refRequired'

2.3.0 (18 November 2015)

* adds singleFileUploads and beforeRequest options (thanks to [@Zmetser](https://github.com/Zmetser))
* adds headers option (thanks to [@malthe](https://github.com/malthe))
* tests and coverage now run from command line

2.2.0 (23 April 2015)

* error handling more consistent
* better test coverage

2.1.2 (29 October 2014)

* adds bower support

2.1.1 (09 June 2014)

* form data construction fix

2.1.0 (12 May 2014)

* adds ability to abort the upload
* adds blanket.js for test coverage reports
* adds more tests for better test coverage

2.0.0 (09 Apr 2014)

* complete rewrite - THIS VERSION IS NOT BACKWARDS COMPATIBLE
* you can now add params after instantiation
* you can now control when the uploader starts (on file input change or click of a element or both)
* callback functions have been replaced with triggered events

1.4.2 (20 Sept 2013)

* decouples main uploader functionality from jquery plugin instantiation
* adds mechanism to cancel upload within 'each' function
* files array now passed into 'before' function

1.4.1 (25 July 2013)

* adds progress option

1.4.0 (24 July 2013)

* a complete code overhaul
* adds 'customParams' option
* adds mechanism to cancel upload within 'before' function
* removes 'typeMessage' option
* removes 'sizeMessage' option
* the errors param for the 'each' function has changed format, it now returns {type, given, rule} rather than {type, message}

1.3.1 (28 Feb 2013)

* adds version and link at the top of un-minified js

1.3.0 (23 Feb 2013)

* removed multi option, this can be achieved by adding the multiple attribute to the file input instead
* if an ID attribute is set on file input, it is now sent through as POST data to the server script
* example improved to show how to handle multiple lite-uploader inputs on a single page

1.2.0 (30 Jan 2013)

* adds 'fail' function option
* updates ajax call to use new jquery methods (always, done, fail etc)
