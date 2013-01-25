$.fn.liteUploader = function (userOptions)
{
	var defaults = { multi: false, script: null, allowedFileTypes: null, maxSizeInBytes: null, typeMessage: null, sizeMessage: null, beforeFunc: function(){}, afterFunc: function(res){}, displayFunc: function(file, errors){}, cancelFunc: function(){} },
		options = $.extend(defaults, userOptions);

	if (options.multi) { this.attr('multiple', 'multiple'); }

	this.change(function ()
	{
		var i, formData = new FormData(), file, obj = $(this), errors = false, errorsArray = [];

		if (this.files.length === 0) { return; }

		options.beforeFunc();

		for (i = 0; i < this.files.length; i += 1)
		{
			file = this.files[i];

			errorsArray = validateFile(file, options.allowedFileTypes, options.maxSizeInBytes, options.typeMessage, options.sizeMessage);
			if (errorsArray.length > 0) { errors = true; }

			formData.append(obj.attr('name') + '[]', file);

			options.displayFunc(file, errorsArray);
		}

		if (! errors)
		{
			$.ajax(
			{
				url: options.script,
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: function (res)
				{
					obj.replaceWith(obj.val('').clone(true));
					options.afterFunc(res); 
				}
			});
		}
	});

	function validateFile (file, allowedFileTypes, maxSizeInBytes, typeMessage, sizeMessage)
	{
		var errorsArray = [], message;

		if (allowedFileTypes && jQuery.inArray(file.type, allowedFileTypes.split(',')) === -1)
		{
			message = typeMessage || 'Incorrect file type (only ' + allowedFileTypes + ' allowed)';
			errorsArray.push({'type': 'type', 'message': message});
		}

		if (maxSizeInBytes && file.size > maxSizeInBytes)
		{
			message = sizeMessage || 'File size too big (max ' + maxSizeInBytes + ' bytes)';
			errorsArray.push({'type': 'size', 'message': message});
		}

		return errorsArray;
	}
};