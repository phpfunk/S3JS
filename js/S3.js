var barley                = barley || {};
barley.S3                 = {};
barley.S3.callback        = '';
barley.S3.file            = '';
barley.S3.progress_object = '';
barley.S3.special_chars   = {'\\+': '&#43;'};
barley.S3.url             = '';
barley.S3.xhr             = {};

barley.S3.hasType = function(types, type)
{
    if (types.length < 1) {
        return true;
    }

    for (var i = 0; i < types.length; i++) {
        if (type.toLowerCase() == types[i].toLowerCase()) {
            return true;
        }
    }
    return false;
};


barley.S3.phoneHome = function(url, type)
{
    if ($.isFunction(barley.S3.callback)) {
        barley.S3.callback(url, type);
    }
};

barley.S3.replaceSpecial = function(str)
{
    if (str !== undefined && str !== null) {
        var regex = null;
        for (var i in barley.special_chars) {
            regex = new RegExp(i, 'gi');
            str   = str.replace(regex, barley.special_chars[i]);
        }
    }
    return str;
};

barley.S3.upload = function(endpoint, options)
{
    var file_id               = options.file_id || '';
    var folder                = options.folder || '';
    folder                    = (folder.substr(0, 1) == '/' && folder.length > 1) ? folder.substr(1) : (folder.substr(0, 1) == '/') ? '' : folder;
    var max_bytes             = (options.max_bytes !== undefined && ! isNaN(options.max_bytes)) ? options.max_bytes : 102400;
    var types                 = (options.types !== undefined && Object.prototype.toString.call(options.types) === '[object Array]') ? options.types : [];
    var content_type          = options.content_type || '';
    var acl                   = options.acl || '';
    barley.S3.callback        = (options.callback === undefined || ! $.isFunction(options.callback)) ? function(){} : options.callback;
    barley.S3.progress_object = (options.progress_id !== undefined) ? $('#' + options.progress_id) : {};

    // Reset progress bar & message
    barley.S3.progress_object.css('width', '10%').html('Starting...').slideDown('fast');

    $.ajax({
        'dataType': 'json',
        'cache': false,
        'url': endpoint,
        'type': 'GET',
        'data': 'fs=' + max_bytes.toString() + '&ct=' + barley.S3.urlEncode(content_type) + '&acl=' + barley.S3.urlEncode(acl),
        'async': true,
        'success': function (res)
        {
            if (res.bucket) {
                var file       = document.getElementById(file_id).files[0];
                var fd         = new FormData();
                barley.S3.file = file.name;
                barley.S3.url  = res.cdn_url + '/' + folder + '/' + file.name;

                // Check filesize
                if (file.size > max_bytes) {
                    var sizes  = {'GB': 1073741824, 'MB': 1048576, 'KB': 1024};
                    var size   = max_bytes;
                    var type   = 'Bytes';
                    for (var uom in sizes) {
                        if (max_bytes >= sizes[uom]) {
                            size = Math.round((max_bytes / sizes[uom]) * 100) / 100;
                            type = uom;
                            break;
                        }
                    }
                    barley.S3.writeMsg('File is larger than ' + size.toString() + ' ' + type + '. Please try again.');
                    barley.S3.callback(false, '');
                }
                else if (barley.S3.hasType(types, file.type) === false) {
                    barley.S3.writeMsg('File type can only be: ' + types.join(', ') + '. Please try again.');
                    barley.S3.callback(false, '');
                }
                else {
                    fd.append('key', folder + '/' + file.name);
                    fd.append('acl', res.acl);
                    fd.append('AWSAccessKeyId', res.AWSAccessKeyId);
                    fd.append('success_action_status', '201');
                    fd.append('policy', res.policy)
                    fd.append('signature', res.signature);
                    fd.append('Content-Type', file.type);
                    fd.append('file', file);

                    // Format request
                    barley.S3.XHR();
                    barley.S3.xhr.upload.addEventListener('progress', barley.S3.uploadProgress, false);
                    barley.S3.xhr.addEventListener('load', barley.S3.uploadComplete, false);
                    barley.S3.xhr.addEventListener('error', barley.S3.uploadFailed, false);
                    barley.S3.xhr.addEventListener('abort', barley.S3.uploadCanceled, false);
                    barley.S3.xhr.open('POST', 'https://' + res.bucket + '.s3.amazonaws.com/', true);
                    barley.S3.xhr.send(fd);
                }
            }
            else {
                barley.S3.writeMsg('There was an internal error. Please try again.');
                barley.S3.callback(false, '');
            }
        },
        'error': function(xhr, status, error)
        {
            barley.S3.callback({
                'error': error,
                'status': status,
                'request': xhr
            });
        }
    });
};

barley.S3.uploadCanceled = function(e)
{
    barley.S3.writeMsg('Upload was canceled.');
    barley.S3.phoneHome(false, 'canceled');
};

barley.S3.uploadComplete = function(e)
{
    if (barley.S3.xhr.readyState == 4 && barley.S3.xhr.status == 201) {
        barley.S3.writeMsg('100% - Upload is complete.');
        barley.S3.phoneHome(barley.S3.url, 'complete');
    }
    else if (barley.S3.xhr.readyState == 4 && barley.S3.xhr.status != 201) {
        barley.S3.writeMsg('Error: ' + barley.S3.xhr.statusText + '(' + barley.S3.xhr.status + ')');
        barley.S3.phoneHome(false, 'error');
    }
};

barley.S3.uploadFailed = function(e)
{
    var origin = (window.location.origin !== undefined) ? window.location.origin : window.location.protocol + '//' + window.location.host;
    barley.S3.writeMsg('Connection Error. Please check your CORS configuration and make sure `' + origin + '` has access and try again.');
    barley.S3.phoneHome(false, 'failed');
};

barley.S3.uploadProgress = function(e)
{
    if (e.lengthComputable) {
        var percent = Math.round(e.loaded * 100 / e.total);
        barley.S3.progress_object.html(percent.toString() + '%');
        if (percent > 10 && percent <= 95) {
            barley.S3.progress_object.css('width', percent.toString() + '%');
        }
        else if (percent == 100) {
            barley.S3.writeMsg('Processing file...');
        }
    }
    else {
        barley.S3.progress_object.html('Uploading...');
        barley.S3.phoneHome(false, 'noprogress');
    }
};

barley.S3.urlEncode = function(str)
{
    return encodeURIComponent(barley.S3.replaceSpecial(str));
};

barley.S3.writeMsg = function(msg)
{
    barley.S3.progress_object.css('width', '95%').html(msg);
};

barley.S3.XHR = function()
{
    if (window.XMLHttpRequest) {
        barley.S3.xhr = new XMLHttpRequest();
    }
    else {
        try {
            barley.S3.xhr = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (e) {
            try {
                barley.S3.xhr = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (e) {}
        }
    }
};