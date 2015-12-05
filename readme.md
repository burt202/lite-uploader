## LiteUploader - HTML5 jQuery File Uploader <sup>v3.2.1</sup>

This is a small jQuery plugin which utilises the HTML5 features ([File API](http://www.html5rocks.com/en/tutorials/file/dndfiles/) and [XHR2](http://www.html5rocks.com/en/tutorials/file/xhr2/)) to make uploading files a doddle.

With some useful options including basic validation, it is a good choice for any developer who is not so worried about supporting legacy browsers.

### Bower

`bower install lite-uploader --save`

### Node

This plugin can also be used within node context (with browserify or webpack etc) as a jquery plugin or as a standalone file upload class. See examples for basic usage.

`npm install lite-uploader --save`

### Options

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>script</td>
    <td>String (required)</td>
    <td>null</td>
    <td>the path to the script file that will handle the upload</td>
  </tr>
  <tr>
    <td>ref</td>
    <td>String</td>
    <td>null</td>
    <td>The request argument name for the file form data. Will fallback to the name property of the file input field if not supplied.</td>
  </tr>
  <tr>
    <td>rules</td>
    <td>Object</td>
    <td>{allowedFileTypes: null, maxSize: null}</td>
    <td>object where you can specify validation rules for the files to be uploaded - current supported rules are:
      <ul>
        <li>allowedFileTypes (list of comma-separated mime-types, wildcards such as image/* are also supported)</li>
        <li>maxSize (in bytes)</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>params</td>
    <td>Object</td>
    <td>{}</td>
    <td>object of params to be sent to the server in addition to the files being uploaded</td>
  </tr>
  <tr>
    <td>headers</td>
    <td>Object</td>
    <td>{}</td>
    <td>object of headers to be sent to the server</td>
  </tr>
  <tr>
    <td>singleFileUploads</td>
    <td>Boolean</td>
    <td>false</td>
    <td>set to true to upload each file of a selection using an individual request</td>
  </tr>
  <tr>
    <td>beforeRequest</td>
    <td>Function</td>
    <td colspan="2">Delay the file upload request by returning a promise. Recieves the Files and the FormData. Expected to resolve with the FormData to continue. Reject to stop upload.</td>
  </tr>
</table>

### Events

<table>
  <tr>
    <th>Name</th>
    <th>Parameters</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>lu:errors</td>
    <td>event, errors</td>
    <td>triggered after input and file validation - see 'File Error Types' section for more</td>
  </tr>
  <tr>
    <td>lu:start</td>
    <td>event, files</td>
    <td>triggered before any uploading starts, after the clickElement click event or the change handler - fires once per file selection</td>
  </tr>
  <tr>
    <td>lu:before</td>
    <td>event, files</td>
    <td>triggered before the uploading starts</td>
  </tr>
  <tr>
    <td>lu:progress</td>
    <td>event, percentage</td>
    <td>triggered whilst uploading files</td>
  </tr>
  <tr>
    <td>lu:success</td>
    <td>event, response</td>
    <td>triggered on upload success</td>
  </tr>
  <tr>
    <td>lu:fail</td>
    <td>event, jqXHR</td>
    <td>triggered on upload failure</td>
  </tr>
  <tr>
    <td>lu:cancelled</td>
    <td>event</td>
    <td>triggered on upload abort</td>
  </tr>
</table>

### Error Types

Below is an overview of the error types that can be returned when validating files

* type - when file mime type does not match any mime types supplied in the rule.allowedFileTypes option
* size - when file size is above the size (in bytes) supplied in the rule.maxSize option
* refRequired - when there is no name attribute on the file input and no 'ref' options is passed to the plugin
* scriptRequired - when no 'script' option is passed to the plugin

### Public API

#### startUpload()

Starts the upload

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>files</td>
    <td>FileList (optional)</td>
    <td>null</td>
    <td>a list of files to be uploaded, takes priority over default mechanism if supplied</td>
  </tr>
</table>

#### addParam(key, value)

Allows parameters to be added after plugin instantiation

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>key</td>
    <td>String (required)</td>
    <td>n/a</td>
    <td>name of parameter to be added</td>
  </tr>
  <tr>
    <td>value</td>
    <td>String (required)</td>
    <td>n/a</td>
    <td>value of parameter to be added</td>
  </tr>
</table>

#### cancelUpload()

Allows the upload to be cancelled, triggers `lu:cancelled`

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td colspan="4">No parameters</td>
  </tr>
</table>

### Gotchas

* make sure your uploads directory is writable: `chmod 777`

### Browser Support

The two main HTML5 dependencies for the plugin are the File API and XHR2, and using caniuse ([File API](http://caniuse.com/fileapi), [XHR2](http://caniuse.com/xhr2)) as a reference, if you are using any of the following browser versions you shouldn't have any problem with the code:

* Chrome 13+
* Firefox 4+
* Internet Explorer 10+
* Safari 6+
* Opera 12+

Using [this tool I built](http://browser.burtdev.net) which is based on stats from [gs.statcounter.com](http://gs.statcounter.com), as of October 2015, the browser versions listed above should account for approx 86% of all internet users

### Examples

See [examples.md](https://github.com/burt202/lite-uploader/blob/master/examples.md)

### Tests & Coverage

* `cd to project root`
* `npm i`
* `npm i -g gulp`
* `gulp`

### Changelog

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

* form data construction fix (thanks to [@aFarkas](https://github.com/aFarkas) for spotting this one)

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

### Suggestions, comments and queries welcome, send to aaron@burtdev.net
