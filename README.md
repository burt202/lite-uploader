# LiteUploader - HTML5 jQuery File Uploader <sup>v1.2.0</sup>

This is a small jQuery plugin (loosely based on [this nettuts tutorial](http://net.tutsplus.com/tutorials/javascript-ajax/uploading-files-with-ajax/)) designed to use new HTML5 features ([File API](http://www.html5rocks.com/en/tutorials/file/dndfiles/) and [XHR2](http://www.html5rocks.com/en/tutorials/file/xhr2/)) to make uploading files a doddle. It purposely doesn't support older browsers because I don't know about you, but I'm sick of seeing snippets of JavaScript with double the code and logic just to make it work in HTML4-only browsers that have ever diminishing percentage of users. I know practically this is not helpful because browsers like IE9 will be around for a while but what I really wanted to see is, at its absolute minimum, how little code do you need to make a small, but very usable and easily expandable jQuery upload plugin. With some useful options including basic validation it turns out not many. With less than 100 lines of code and being < 2kb in size, it is a good choice for any developer who is not so worried about supporting the older browsers.

## Options Explained

* script: (string, default=null, required) the path to the script file that will handle the upload (see example)
* allowedFileTypes: (string, default=null, optional) a comma delimited string of allowed mime types
* maxSizeInBytes: (integer, default=null, optional) maximum size in bytes allowed per file
* before: (function, default=function(){}, optional) add code here to be executed before the upload
* each: (function, default=function(file, errors){}, optional) add code here to be executed for every file being uploaded, file = js file obj, errors = array of errors populated if the file does not pass validation set using allowedFileTypes and maxSizeInBytes options
* success: (function, default=function(response){}, optional) add code here to be executed if the upload suceeded, response = output from the script
* fail: (function, default=function(jqXHR){}, optional) add code here to be executed if the upload failed, jqXHR = jQuery XMLHTTPRequest Object
* typeMessage: (string, default=null, options) to override the type validation message
* sizeMessage: (string, default=null, options) to override the size validation message

NOTE: make sure your uploads directory is writable (chmod 777) as this sometimes catches people out

## Browser Support

As I have already stated in the description above this was not built for non-HTML5 browsers so it cleary isn't going to be for everyone. The two main HTML5 dependencies are the File API and XHR2, and using caniuse ([File API](http://caniuse.com/fileapi), [XHR2](http://caniuse.com/xhr2)) as a reference, if you are using any of the following browser versions you shouldn't have any problem with the code:

* Chrome 13+
* Firefox 4+
* Internet Explorer 10+
* Safari 6+
* Opera 12+

According to [gs.statcounter.com](http://gs.statcounter.com), as of Jan 2012 the browser versions listed above should account for approx 60% of all internet users

## Changelog

1.3.0

* removed multi option, this can be achieved by adding the multiple attribute to the file input instead
* if an ID attribute is set on file input, it is now sent through as POST data to the server script
* example improved to show how to handle multiple lite-uploader inputs on a single page