/* liteUploader v1.4.1 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

$.fn.liteUploader = function (userOptions)
{
	"use strict";

	var defaults = {},
		options = {};

	defaults = {
		script: null,
		allowedFileTypes: null,
		maxSizeInBytes: null,
		customParams: {},
		before: function() { return true; },
		each: function(file, errors) {},
		progress: function (percentage) {},
		success: function(response) {},
		fail: function(jqXHR) {}
	};

	options = $.extend(defaults, userOptions);

	function findErrors (file, options)
	{
		var errorsArray = [];

		if (options.allowedFileTypes && $.inArray(file.type, options.allowedFileTypes.split(',')) === -1)
		{
			errorsArray.push({'type': 'type', 'rule': options.allowedFileTypes, 'given': file.type});
		}

		if (options.maxSizeInBytes && file.size > options.maxSizeInBytes)
		{
			errorsArray.push({'type': 'size', 'rule': options.maxSizeInBytes, 'given': file.size});
		}

		return errorsArray;
	}

	function validateFiles (files, options)
	{
		var errors = false;

		$.each(files, function(i)
		{
			var errorsArray = findErrors(files[i], options);
			if (errorsArray.length > 0) { errors = true; }
			options.each(files[i], errorsArray);
		});

		if (errors) { return false; }
		return true;
	}

	function collateFormData (obj, customParams, files)
	{
		var formData = new FormData();

		if (obj.attr('id')) { formData.append('liteUploader_id', obj.attr('id')); }

		$.each(customParams, function(key, value)
		{
			formData.append(key, value);
		});

		$.each(files, function(i)
		{
			formData.append(obj.attr('name') + '[]', files[i]);
		});

		return formData;
	}

	function resetInput (obj)
	{
		obj.replaceWith(obj.clone(true));
	}

	function performUpload (obj, options, formData)
	{
		$.ajax(
		{
			xhr: function()
			{
				var xhr = new XMLHttpRequest();

				xhr.upload.addEventListener('progress', function (evt)
				{
					if (evt.lengthComputable)
					{
						options.progress(Math.floor((evt.loaded / evt.total) * 100));
					}
				}, false);

				return xhr;
			},
			url: options.script,
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false
		})
		.always(function ()
		{
			resetInput(obj);
		})
		.done(function(response)
		{
			options.success(response);
		})
		.fail(function(jqXHR)
		{
			options.fail(jqXHR);
		});
	}

	this.change(function ()
	{
		var obj = $(this);

		if (!obj.attr('name') || !options.script || !options.before() || this.files.length === 0 || !validateFiles(this.files, options))
		{
			resetInput(obj);
			return;
		}

		performUpload(obj, options, collateFormData(obj, options.customParams, this.files));
	});
};