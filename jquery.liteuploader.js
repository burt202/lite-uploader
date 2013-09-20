/* liteUploader v1.4.2 | https://github.com/burt202/lite-uploader | Aaron Burtnyk (http://www.burtdev.net) */

$.fn.liteUploader = function (options)
{
	var defaults = {
		script: null,
		allowedFileTypes: null,
		maxSizeInBytes: null,
		customParams: {},
		before: function () {},
		each: function () {},
		progress: function () {},
		success: function () {},
		fail: function () {}
	};

	this.change(function (e)
	{
		LiteUploader.init($, $(e.currentTarget), $.extend(defaults, options));
	});
};

var LiteUploader = {

	attrs: {},

	init: function ($, el, options)
	{
		this.attrs = {
			$: $,
			el: el,
			options: options
		};

		if (!el.attr('name') || !options.script || el.get(0).files.length === 0 || options.before(el.get(0).files) === false || !this.validateFiles())
		{
			this.resetInput();
			return;
		}

		this.performUpload(this.collateFormData());
	},

	resetInput: function ()
	{
		this.attrs.el.replaceWith(this.attrs.el.clone(true));
	},

	validateFiles: function ()
	{
		var that = this,
			errors = false,
			files = that.attrs.el.get(0).files;

		that.attrs.$.each(files, function(i)
		{
			var errorsArray = that.findErrors(files[i]);

			if (that.attrs.options.each(files[i], errorsArray) === false || errorsArray.length > 0)
			{
				errors = true;
			}
		});

		return (errors) ? false : true;
	},

	findErrors: function (file)
	{
		var errorsArray = [];

		if (this.attrs.options.allowedFileTypes && this.attrs.$.inArray(file.type, this.attrs.options.allowedFileTypes.split(',')) === -1)
		{
			errorsArray.push({'type': 'type', 'rule': this.attrs.options.allowedFileTypes, 'given': file.type});
		}

		if (this.attrs.options.maxSizeInBytes && file.size > this.attrs.options.maxSizeInBytes)
		{
			errorsArray.push({'type': 'size', 'rule': this.attrs.options.maxSizeInBytes, 'given': file.size});
		}

		return errorsArray;
	},

	collateFormData: function ()
	{
		var that = this,
			files = that.attrs.el.get(0).files,
			formData = new FormData();

		if (that.attrs.el.attr('id'))
		{
			formData.append('liteUploader_id', that.attrs.el.attr('id'));
		}

		that.attrs.$.each(that.attrs.options.customParams, function(key, value)
		{
			formData.append(key, value);
		});

		that.attrs.$.each(files, function(i)
		{
			formData.append(that.attrs.el.attr('name') + '[]', files[i]);
		});

		return formData;
	},

	performUpload: function (formData)
	{
		var that = this;

		that.attrs.$.ajax(
		{
			xhr: function()
			{
				var xhr = new XMLHttpRequest();

				xhr.upload.addEventListener('progress', function (evt)
				{
					if (evt.lengthComputable)
					{
						that.attrs.options.progress(Math.floor((evt.loaded / evt.total) * 100));
					}
				}, false);

				return xhr;
			},
			url: that.attrs.options.script,
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false
		})
		.always(function ()
		{
			that.resetInput();
		})
		.done(function(response)
		{
			that.attrs.options.success(response);
		})
		.fail(function(jqXHR)
		{
			that.attrs.options.fail(jqXHR);
		});
	}
};