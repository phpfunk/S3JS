var timer = 0;

$(document).ready(function()
{
   $('#file').change(function(e)
   {
        e.preventDefault();
        clearTimeout(timer);
        var obj = $(this);

        if (obj.val() != '') {
          var eyed = obj.attr('id');
          barley.S3.upload('php/getPolicy.php', {
              'file_id'        : eyed,
              'folder'         : 'S3JS',
              'progress_id'    : 'progress-box',
              'max_bytes'      : 10485760,
              'types'          : ['image/png', 'image/gif', 'image/jpeg'],
              'content_type'   : document.getElementById(eyed).files[0].type,
              'acl'            : 'public-read',
              'callback'       : function(url, type)
              {
                  if (url !== false) {
                    var d = new Date();
                    $('html').css('background-image', 'url(' + url + '?' + d.getTime() + ')');
                    barley.S3.writeMsg('Your background image was successfully uploaded.');

                    // Fade message out after 5 seconds
                    timer = setTimeout(function()
                    {
                      progress_bar.fadeOut('fast');
                    }, 5000);
                  }

                  obj.val('');
              }
          });
        }
    });
});