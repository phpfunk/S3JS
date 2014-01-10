The S3 JS library is a simple tool to allow you to easily upload files directly from the user to S3. You can skip the step of uploading locally then uploading to S3. The one caveat here is that you will need some sort of backend processor to create your policy. The reason for this is because you don't want to expose your secret key. It could be done with all JS but you risk giving away your credentials.

## Requirements
* An Amazon AWS account and active S3
* A correctly formatted CORS Configuration for your upload bucket
* jQuery
* Backend language to create policy (example is in PHP)

## Example File
There is an example file included is this library called `example.html`. It is a simple HTML file including the required JS files for this to work.


## JavaScript Files
All the JavaScript files for this library are in the `/js` folder provided. A brief overview is below:
<table>
    <thead>
        <tr>
            <th>File</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>/js/example.js</td>
            <td>Example file used to show how to call the S3.upload method correctly.</td>
        </tr>
         <tr>
            <td>/js/S3.js</td>
            <td>The actual library that connects, uploads and handles all interactions between you and S3.</td>
        </tr>
    </tbody>
</table>


## PHP Files
Along with this example there are three PHP files which can be found in the `/php` directory. Feel free to use or replace these with whatever you'd like. As long as your policy is correct it doesn't matter what language you use.

<table>
    <thead>
        <tr>
            <th>File</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>/php/config-sample.php</td>
            <td>The file to place your S3 credentials, bucket and URL information. Please rename to `config.php`.</td>
        </tr>
        <tr>
            <td>/php/getPolicy.php</td>
            <td>Simple file that interfaces with the frontend AJAX request to generate and return the S3 policy information for the request.</td>
        </tr>
         <tr>
            <td>/php/S3.php</td>
            <td>Small library to generate the policy.</td>
        </tr>
    </tbody>
</table>


## S3 Library Options
The method `barley.S3.upload` in the `/js/S3.js` file has a few options you can configure for every setup. The arguments are listed below.

<table>
    <thead>
        <tr>
            <th>Argument</th>
            <th>Type</th>
            <th>Required</th>
            <th>Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>endpoint</td>
            <td>String</td>
            <td>Yes</td>
            <td>N/A</td>
            <td>The path to your backend script to create your S3 policy. (IE: /getS3.php).</td>
        </tr>
        <tr>
            <td>options</td>
            <td>Object</td>
            <td>Yes</td>
            <td>N/A</td>
            <td>An object to hold all your configurable properties to generate your policy.</td>
        </tr>
        <tr>
            <td>options.acl</td>
            <td>String</td>
            <td>No</td>
            <td>public-read</td>
            <td>The Amazon ACL type to use for the uploaded file. Choices are: `private`, `public-read`, `public-read-write`, `authenticated-read`, `bucket-owner-read`, `bucket-owner-full-control` or `log-delivery-write`.</td>
        </tr>
        <tr>
            <td>options.callback</td>
            <td>Function</td>
            <td>No</td>
            <td>function(){}</td>
            <td>The function to call on success or failures uploading to S3. We will pass two arguments: the url (false if error) and type (error, complete, canceled or noprogress). On errors we will write the error message and status code to your progress bar.</td>
        </tr>
        <tr>
            <td>options.content_type</td>
            <td>String</td>
            <td>No</td>
            <td>application/octet-stream</td>
            <td>The content type of the file being upload. While not required you should always pass it to give S3 the correct content type of the file.</td>
        </tr>
        <tr>
            <td>options.file_id</td>
            <td>String</td>
            <td>Yes</td>
            <td>N/A</td>
            <td>The id of your input file.</td>
        </tr>
         <tr>
            <td>options.folder</td>
            <td>String</td>
            <td>No</td>
            <td>Null</td>
            <td>The complete folder path to store your files on S3. IE: S3JS/tests.</td>
        </tr>
        <tr>
            <td>options.max_bytes</td>
            <td>Integer</td>
            <td>No</td>
            <td>102400</td>
            <td>The max file size of the upload in bytes.</td>
        </tr>
        <tr>
            <td>options.progress_id</td>
            <td>String</td>
            <td>No</td>
            <td>{}</td>
            <td>The ID of the DOM object to use as your progress bar and write messages to.</td>
        </tr>
        <tr>
            <td>options.types</td>
            <td>Array</td>
            <td>No</td>
            <td>[]</td>
            <td>The mime types to accept for the upload.</td>
        </tr>
    </tbody>
</table>

### Callback Arguments
When you call `barley.S3.upload` with a callback we will return two arguments to your callback function.
<table>
    <thead>
        <tr>
            <th>Argument</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>url</td>
            <td>Mixed</td>
            <td>Will be a string of the S3 URL if successful, or a boolean (false) if error or canceled.</td>
        </tr>
        <tr>
            <td>type</td>
            <td>String</td>
            <td>The response type from the call: `canceled`, `complete`, `error` or `no-progress`.</td>
        </tr>
    </tbody>
</table>

### Examples
Let your users upload png files only of 10 KB or less in size that will be private.

```javascript
$(document).ready(function()
{
   $('#file').change(function(e)
   {
        e.preventDefault();
        var obj = $(this);

        if (obj.val() != '') {
          var eyed = obj.attr('id');
          barley.S3.upload('php/getPolicy.php', {
              'file_id'        : eyed,
              'folder'         : 'S3JS/pngTest',
              'progress_id'    : 'progress-box',
              'max_bytes'      : 10240,
              'types'          : ['image/png'],
              'content_type'   : document.getElementById(eyed).files[0].type,
              'acl'            : 'private',
              'callback'       : function(url, type)
              {
                  if (url !== false) {
                    alert('Thanks for your file!');
                  }

                  obj.val('');
              }
          });
        }
    });
});
```


Public zip, pdf and mp3 files of 10MB or less.

```javascript
$(document).ready(function()
{
   $('#file').change(function(e)
   {
        e.preventDefault();
        var obj = $(this);

        if (obj.val() != '') {
          var eyed = obj.attr('id');
          barley.S3.upload('php/getPolicy.php', {
              'file_id'        : eyed,
              'folder'         : 'S3JS/pngTest',
              'progress_id'    : 'progress-box',
              'max_bytes'      : 10485760,
              'types'          : ['application/zip', 'application/pdf', 'audio/mpeg'],
              'content_type'   : document.getElementById(eyed).files[0].type,
              'acl'            : 'public-read',
              'callback'       : function(url, type)
              {
                  if (url !== false) {
                    alert('Thanks for your file!');
                  }

                  obj.val('');
              }
          });
        }
    });
});
```

## Getting this to work
You will have to finish a few steps in order to get this example up and running.

1. Log into your S3 account and make sure you CORS configuration is set to accept the host you are testing on.
2. Open the `/php/config-sample.php` file and add your `$access_key`, `$secret_key`, `$bucket` and `$cdn_url` and then rename the file to `config.php`.
3. Open your browser and navigate to the example.html file and upload.