## LiteUploader - HTML5 jQuery File Uploader <sup>v2.2.0</sup>

This is a small jQuery plugin (featured in [this jQuery plugin top 10](http://tekbrand.com/jquery/10-best-jquery-file-upload-plugins)) which utilises the HTML5 features ([File API](http://www.html5rocks.com/en/tutorials/file/dndfiles/) and [XHR2](http://www.html5rocks.com/en/tutorials/file/xhr2/)) to make uploading files a doddle.

The aim was to see, at its absolute minimum, how little code do you need to make a small, but very usable and easily expandable jQuery upload plugin. With some useful options including basic validation it turns out not many. After minification it is very small in size and is a good choice for any developer who is not so worried about supporting legacy browsers.

### Bower

`bower install lite-uploader --save`

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
        <td>rules</td>
        <td>Object</td>
        <td>{allowedFileTypes: null, maxSize: null}</td>
        <td>object where you can specify validation rules for the files to be uploaded - current supported rules are:
            <ul>
                <li>allowedFileTypes (list of comma-separated mime-types)</li>
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
        <td>changeHandler</td>
        <td>Boolean</td>
        <td>true</td>
        <td>initiate the upload on file input change</td>
    </tr>
    <tr>
        <td>clickElement</td>
        <td>jQuery Element</td>
        <td>null</td>
        <td>initiate the upload on the click event of the jQuery element passed here</td>
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
* fileInputNameRequired - when there is no name attribute on the file input
* scriptOptionRequired - when no 'script' option is passed to the plugin
* noFilesSelected - when no files have been selected for the file input

### Public API

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

Using [this tool I built](http://browser.burtdev.net) which is based on stats from [gs.statcounter.com](http://gs.statcounter.com), as of April 2015, the browser versions listed above should account for approx 86% of all internet users

### Examples & Tests

There are 3 examples in the `example` directory (using PHP as the server-side language) to help you get on your way and also there is a full suite of Jasmine tests to back the plugin. They can be found in the `tests` directory and run by opening `runner.html`

### Changelog

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
