# LiteUploader - HTML5 jQuery File Uploader <sup>v1.4.2</sup>

This is a small jQuery plugin (featured in [this jQuery plugin top 10](http://tekbrand.com/jquery/10-best-jquery-file-upload-plugins)) designed to use new HTML5 features ([File API](http://www.html5rocks.com/en/tutorials/file/dndfiles/) and [XHR2](http://www.html5rocks.com/en/tutorials/file/xhr2/)) to make uploading files a doddle. It purposely doesn't support non-HTML5 which I know won't suit everyone because older versions of IE will be around for a while yet, but what I really wanted to see is, at its absolute minimum, how little code do you need to make a small, but very usable and easily expandable jQuery upload plugin. With some useful options including basic validation it turns out not many. After minification it is very small in size and is a good choice for any developer who is not so worried about supporting the older browsers.

## Options Explained

* script: (string, default=null, required) the path to the script file that will handle the upload (see example)
* allowedFileTypes: (string, default=null, optional) a comma delimited string of allowed mime types
* maxSizeInBytes: (integer, default=null, optional) maximum size in bytes allowed per file
* customParams: (object, default={}, optional) an object of custom params to be sent to the server
* before: (function, default=function(files){}, optional) add code here to be executed before the upload, return false if you want to cancel the upload, files = array of files to be uploaded
* each: (function, default=function(file, errors){}, optional) add code here to be executed for every file being uploaded, return false if you want to cancel the upload, file = js file obj, errors = array of errors populated if the file does not pass validation set using allowedFileTypes and maxSizeInBytes options
* progress: (function, default=function(percentage){}, optional) add code here to use the progress percentage
* success: (function, default=function(response){}, optional) add code here to be executed if the upload suceeded, response = output from the script
* fail: (function, default=function(jqXHR){}, optional) add code here to be executed if the upload failed, jqXHR = jQuery XMLHTTPRequest Object

NOTE: make sure your uploads directory is writable (chmod 777) as this sometimes catches people out

## Browser Support

As I have already stated in the description above this was not built for non-HTML5 browsers so it clearly isn't going to be for everyone. The two main HTML5 dependencies are the File API and XHR2, and using caniuse ([File API](http://caniuse.com/fileapi), [XHR2](http://caniuse.com/xhr2)) as a reference, if you are using any of the following browser versions you shouldn't have any problem with the code:

* Chrome 13+
* Firefox 4+
* Internet Explorer 10+
* Safari 6+
* Opera 12+

Using [this tool I built](http://browser.burtdev.net) which is based on stats from [gs.statcounter.com](http://gs.statcounter.com), as of June 2013 the browser versions listed above should account for approx 73% of all internet users

## Changelog

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

## Suggestions, comments and queries welcome, send to aaron@burtdev.net