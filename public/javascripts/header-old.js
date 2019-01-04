

var sideNavWidth;



/*
function reload_config(file) {
  if (!(this instanceof reload_config))
    return new reload_config(file);
  var self = this;
path='http://localhost:3000/';
  self.path = path.resolve(file);

  fs.watchFile(file, function(curr, prev) {
    delete require.cache[self.path];
    _.extend(self, require(file));
  });

  _.extend(self, require(file));
}
var config = reload_config("./app.js");
*/



$('#main').css({"height": window.innerHeight+"px"});






/****************************************************************




  $(document ).ready(function() {
    $("#container > .sk-circle").css({"visibility": "visible"});
    var data = {
      'client_uid': user.uid 
    }
    $.post('/getUserDevicesInfo/', data, function(data) {
      $("#container .sk-circle").css({"visibility": "hidden"});
      if(data.length > 0) {
        $("#container #device-lists").html('');
        data.forEach(function(device) {
          $("#container #device-lists").append(
            '<div class="device">\
                <div>Device Name: '+device.device_name+'</span></div>\
                <div>Company Name: <span>'+device.company_name+'</span></div>\
                <div>Device Ref: <span class="dev-ref">'+device.device_ref+'</span></div>\
              </div>');
        })
      }
      else {
        $("#container #device-lists").append("No Devices To Display");
      }

    }).fail(function(error) {
      $("#container .sk-circle").css({"visibility": "hidden"});
      $('.alert-danger').text('Could not get data').show();
      setTimeout(function() {
        $('.alert-danger').hide();
      }, 1500);
    });
  });



  $(document).on('click', '#device-lists .device', function(event) {
    $('#device-lists .device').removeClass('activeDevice');
    $(this).addClass('activeDevice');
      $("#device-msg .sk-circle").css({"visibility": "visible"});
      var ref = $(this).find('.dev-ref').text();
      var data = {
        'device_ref': ref
      }
      $("#device-msg table tbody").html('')
      $.post('/getmessages/', data, function(data) {
        $("#device-msg .sk-circle").css({"visibility": "hidden"});
        if(data.length > 0) {
            data.forEach(function(msg) {
            $("#device-msg table tbody").append(
              '<tr dataId="'+msg._id+'">\
                <td>'+msg.msg+'</td>\
                <td>'+msg.timestamp+'</td>\
              </tr>');
          })
        }
        else {
          $("#device-msg table tbody").html('<tr><td>No Messages To Display</td></tr>') 
        }
        
      }).fail(function(error) {
        $("#device-msg .sk-circle").css({"visibility": "hidden"});
        $('.alert-danger').text('Could not get data').show();
        setTimeout(function() {
          $('.alert-danger').hide();
        }, 1500);
      });
  });

  $(document).on('click', "#device-msg table tbody tr", function(e) {
    console.log($(this).attr('dataId'));
  });




//****************************************************************/





$(document ).ready(function() {
  sideNavWidth = $(".sidenav").css("width");
  $('.spinner').css({"visibility": "hidden"});
      // [START authstatelistener]
      var user = firebase.auth().currentUser;
      if (user) {
        // User is signed in.
      } else {
        // No user is signed in.
      }

  firebase.auth().onAuthStateChanged(function(user) {
    // [END_EXCLUDE]
    if (user) {
      // User is signed in.
      //window.location.replace("/dashboard/");
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      $("#profile-menu #username").text(displayName);
      $("#profile-menu #useremail").text(email);
      // [START_EXCLUDE]
      if (!emailVerified) {
        sendEmailVerification();
        console.log("not verified");
        $("#alert").show();
      }
      // [END_EXCLUDE]
    } else {
      // User is signed out.
      console.log("signed out");
    }
  });
  // [END authstatelistener]
/* --------------------------------------------------------------- */

  $("#my-admin").hover(function() {
    $("#admin-angle-down").show();
  }, function() {
    $("#admin-angle-down").hide();
  });

/* --------------------------------------------------------------- */

  $('.mainContainer').click(function(event) {
    event.preventDefault();
    $('.spinner').css({"visibility": "visible"});
    var url = $(this).attr('href');
    location.hash = url;
    $('.nav-link').html($(this).html());
    $('.mainContainer').parent().removeClass('active');
    $(this).parent().addClass('active');
    $.post(url, function(data) {
      console.log(data);
	  $("#main").html(data);
      $('.spinner').css({"visibility": "hidden"});
    }).fail(function(error) {
      $("#main").html('Could not Get The WebPage :(</br>Please retray again.');
      $('.spinner').css({"visibility": "hidden"});
    });
  })
});


/* --------------------------------------------------------------- */
function hideEmailnotfy() {
  $("#alert").hide();
}

function profileMenu() {
  $("#profile-menu").toggle();
}

function signOut() {
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    window.location.replace("/signout/");
  }).catch(function(error) {
    // An error happened.
	window.location.replace("/");
  });
}
  /**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
  // [START sendemailverification]
  firebase.auth().currentUser.sendEmailVerification().then(function() {
    // Email Verification sent!
    // [START_EXCLUDE]
    alert("Verification email sent!");
    return true;
    // [END_EXCLUDE]
  });
  // [END sendemailverification]
}

function sideMenuToggle() {
  if(parseInt($(".sidenav").css("width")) > 0) {
    $(".sidenav").css({"width":"0%"});
    $(".navbar").css({"left":"0%", "width": "100%"});
    $("section").css({"margin-left":"0%", "width": "100%"});
    $("footer").css({"margin-left":"0%", "width": "100%"});
  }
  else {
    $(".sidenav").css({"width":sideNavWidth});
    $(".navbar").css({"left":sideNavWidth, "width": String(parseInt(((parseInt(innerWidth) - parseInt(sideNavWidth)) *100 )/ parseInt(innerWidth))+"%")});
    $("section").css({"margin-left":sideNavWidth, "width": String(parseInt(((parseInt(innerWidth) - parseInt(sideNavWidth)) *100 )/ parseInt(innerWidth))+"%")});   
    $("footer").css({"margin-left":sideNavWidth, "width": String(parseInt(((parseInt(innerWidth) - parseInt(sideNavWidth)) *100 )/ parseInt(innerWidth))+"%")});
  }
}

function copyToClipboard(text) {
  var $temp = $("<input>");
  $("body").append($temp);
  $temp.val(text).select();
  document.execCommand("copy");
  $temp.remove();
}

