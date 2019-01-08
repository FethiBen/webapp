var browser = navigator.userAgent.toLowerCase();
var mobile = browser.indexOf("mobile")>-1 ? true : false;
if(mobile) {
	$(".icon").css({"visibility":"visible"});
}
var config = {
    apiKey: "AIzaSyDLgsyBBUYmKiDy4WErgoOYi6iKnCY2cMc",
    authDomain: "bennia-itansfo.firebaseapp.com",
    databaseURL: "https://bennia-itansfo.firebaseio.com",
    projectId: "bennia-itansfo",
    storageBucket: "bennia-itansfo.appspot.com",
    messagingSenderId: "608660233491"
};
firebase.initializeApp(config);
/* --------------------------------------------------------------- */
;(function(){
  function id(v){ return document.getElementById(v); }
  function loadbar() {
    var ovrl = id("overlay"),
        prog = id("progress"),
        stat = id("progstat"),
        img = document.images,
        c = 0,
        tot = img.length;
    if(tot == 0) return doneLoading();

    function imgLoaded(){
      c += 1;
      var perc = ((100/tot*c) << 0) +"%";
      prog.style.width = perc;
      stat.innerHTML = "Loading "+ perc;
      if(c===tot) return doneLoading();
    }
    function doneLoading(){
      ovrl.style.opacity = 0;
      setTimeout(function(){ 
        ovrl.style.display = "none";
      }, 1200);
    }
    for(var i=0; i<tot; i++) {
      var tImg     = new Image();
      tImg.onload  = imgLoaded;
      tImg.onerror = imgLoaded;
      tImg.src     = img[i].src;
    }    
  }
  document.addEventListener('DOMContentLoaded', loadbar, false);
}());
/* --------------------------------------------------------------- */
$( document ).ready(function() {
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			var curuser = firebase.auth().currentUser;
			console.log('Signed in as : '+curuser.displayName);
		} else {
			console.log("Non connecté");
		}
	});
	/* --------------------------------------------------------------- */
	$("#tech-used .card").hover(function(e) {
		$(this).find(".techPercent").show().html("");
		var bar = new ProgressBar.Circle("#"+$(this).find(".techPercent").attr("id"), {
		  color: '#FFEA82',
		  trailColor: '#eee',
		  trailWidth: 1,
		  duration: 1400,
		  easing: 'bounce',
		  strokeWidth: 6,
		  from: {color: '#FFEA82', a:0},
		  to: {color: '#ED6A5A', a:1},
		  // Set default step function for all animate calls
		  step: function(state, circle) {
		    circle.path.setAttribute('stroke', state.color);
	        var value = Math.round(circle.value() * 100);
		    if (value === 0) {
		      circle.setText('');
		    } else {
		      circle.setText(value);
		    }
		  }
		});
		bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
		bar.text.style.fontSize = '5rem';
		bar.animate(0.7);  // Number from 0.0 to 1.0
	},
	function(e) {
		$(this).find(".techPercent").hide();
	});
/* --------------------------------------------------------------- */
	document.getElementById("defaultOpen").click();

	$(".modal-body #signin input").focus(function(e) {
		if(!$(this).val()) { 
		    $(this).attr("placeholder", "");
		}
		$(this).css({"border-color": "transparent"});
		$(this).next(".inner").show().css({"width": "100%", "border-radius": "12px"});
	}).focusout(function(e) {
		$(this).css({"border-color": "transparent transparent #ccc transparent"});
		$(this).next(".inner").hide().css({"width": "0%", "border-radius": "0px"});
	});
/* --------------------------------------------------------------- */
    $(".nav-item").hover(function() {
	  $(this).find(".icon").css({"visibility":"visible"});
	},
	function() {
	  $(this).find(".icon").css({"visibility":"hidden"});
	});
/* --------------------------------------------------------------- */
	window.onscroll = function() {
	  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
	  if(winScroll > parseInt($("header").css("height"))-50) {
	  	$("nav").css({"position": "fixed", "top": "0px", "background-color": "#343a40"});
	  }
	  else {
	  	$("nav").css({"position": "relative", "background-color": "transparent"});
	  }
	  if (winScroll > 60) {
	  	document.getElementById("myBar").style.visibility = "visible";
	  }
	  else {
	  	document.getElementById("myBar").style.visibility = "hidden";
	  }
	  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	  var scrolled = (winScroll / height) * 100;
	  document.getElementById("myBar").style.width = scrolled + "%";
	};
/* --------------------------------------------------------------- */
    var signinForm = document.getElementById('sign-in');
	// Loop over them and prevent submission
  	signinForm.addEventListener('submit', function(event) {
	    event.preventDefault();
	    event.stopPropagation();
	    if (validateSigninData() == false) {
	    	$("#wrong").text("Invalid Email or Password").show();
            setTimeout(function(){ $("#wrong").hide(); }, 3000);
	    }
	    else {
	        submitSigninForm();
	    }
	    signinForm.classList.add('was-validated');

	}, false);
/* --------------------------------------------------------------- */
	var signupForm = document.getElementById('sign-up');
	// Loop over them and prevent submission
  	signupForm.addEventListener('submit', function(event) {
	    event.preventDefault();
	    event.stopPropagation();
	    if (validateSignupData() == false) {
	    	$("#wrong").text("Invalid Data").show();
            setTimeout(function(){ $("#wrong").hide(); }, 3000);
	    }
	    else {
	        submitSignupForm();
	    }
	    signupForm.classList.add('was-validated');

	}, false);

});
/* --------------------------------------------------------------- */

function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
/* --------------------------------------------------------------- */

function validateSigninData() {
    var e = $("#InputEmail").val();
    var p = $("#InputPassword").val();
    if(!validateEmail(e)) {
        return false;
    }
    if(p.length <= 5) {
        return false;
    }
    return true;
}

/* --------------------------------------------------------------- */
// submit the form data
function submitSigninForm(){
    $(".modal-body").hide();
    $(".modal-content .spinner").show();
    var email = document.getElementById('InputEmail').value;
    var password = document.getElementById('InputPassword').value;
	firebase.auth().signInWithEmailAndPassword(email, password)
	.catch(function(error) {
		  var errorCode = error.code;
		  var errorMessage = error.message;
		  $("#wrong").text(errorMessage).show();
            setTimeout(function(){ $("#wrong").hide(); }, 3000);
            $(".modal-body").show();
            $(".modal-content .spinner").hide();

	}).then(user => {
	  return firebase.auth().currentUser.getIdToken().then(idToken => {
		return postIdTokenToSessionLogin('/sessionLogin/', idToken, getCookie('csrfToken'));
	  });
	}).catch((error) => {
	    var errorCode = error.code;
	    var errorMessage = error.message;
	    $("#wrong").text(errorMessage).show();
        setTimeout(function(){ $("#wrong").hide(); }, 3000);
        $(".modal-body").show();
        $(".modal-content .spinner").hide();
	});

    return false;
}

/* --------------------------------------------------------------- */

function validateSignupData() {
var firstname = $("#firstname").val(), lastname = $("#lastname").val(), username = $("#username").val(),
	confirm = $("#confirmation").val(), email = $("#email").val(), pass = $("#password").val(), tos=document.getElementById('customCheck1').checked;
    if(!validateEmail(email)) {
        console.log('email');
	return false;
    }
    if(pass.length <= 5) {
	    console.log('pass len');
        return false;
    }
    if(lastname.length <= 3) {
	    console.log('lastnm len');
        return false;
    }
    if(firstname.length <= 3) {
	    console.log('firstnm len');
        return false;
    }
    if(username.length <= 5) {
	    console.log('usernm len');
        return false;
    }
    if(pass != confirm) {
	    console.log('pass != confirm');
        return false;
    }
    if(!tos) {
	    console.log('Prière cochez la case ');
    	return false;
    }
    return true;
}

function submitSignupForm(){
    $(".modal-body").hide();
    $(".modal-content .spinner").show();
    var form = $('#sign-up');
    var url = '/signup/';
    var formData = $(form).serializeArray();
    $.post(url, formData).done(function (data) {
        console.log('***In Post(signup) : 2');
		if(data == 'error') {
			$("#wrong").text("Could Not Register You").show();
            setTimeout(function(){ $("#wrong").hide(); }, 3000);
            $(".modal-body").show();
            $(".modal-content .spinner").hide();
        }
        else {
        	var email = document.getElementById('email').value;
      		var password = document.getElementById('password').value;
      			firebase.auth().signInWithEmailAndPassword(email, password)
				.catch(function(error) {
					var errorCode = error.code;
					var errorMessage = error.message;
					$("#wrong").text(errorMessage).show();
			        setTimeout(function(){ $("#wrong").hide(); }, 3000);
			        $(".modal-body").show();
			        $(".modal-content .spinner").hide();
				}).then(user => {
				  return firebase.auth().currentUser.getIdToken().then(idToken => {
					postIdTokenToSessionLogin('/sessionLogin/', idToken, getCookie('csrfToken'));
				  });
				}).catch((error) => {
				  window.location.assign('/');
				});
        }
    }).fail(function() {
        $(".modal-content .spinner").hide();
    	$(".modal-body").show();
    	$("#wrong").text("Something happend and could not register you").show();
        setTimeout(function(){ $("#wrong").hide(); }, 3000);
  	});
    return false;
}
/* --------------------------------------------------------------- */
function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return v ? v[2] : null;
}
function postIdTokenToSessionLogin(url, id, csrfToken) {
    var email = document.getElementById('InputEmail').value;
    var password = document.getElementById('InputPassword').value;	
	var data = {
		idToken: id,
		csrfToken: csrfToken,
		email:email,
		password:password
	}
	$.post(url, data).done(function (data) {
        if(data == 'UNAUTHORIZED REQUEST!') {
            $("#wrong").text("Invalid Session, Please Signin again").show();
            setTimeout(function(){ $("#wrong").hide(); }, 3000);
            $(".modal-body").show();
            $(".modal-content .spinner").hide();
        }
        else {
			window.location.replace("/dashboard/");			
        }

    }).fail(function() {
        $(".modal-content .spinner").hide();
    	$(".modal-body").show();
    	$("#wrong").text("Something happend and could not log you in").show();
        setTimeout(function(){ $("#wrong").hide(); }, 3000);
  	});

}

/**
 * ReAuth User.
 */
function onIdTokenRevocation() {
  // For an email/password user. Prompt the user for the password again.
  let password = prompt('Please provide your password for reauthentication');
  let credential = firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email, password);
  firebase.auth().currentUser.reauthenticateWithCredential(credential)
    .then(result => {
      // User successfully reauthenticated. New ID tokens should be valid.
    })
    .catch(error => {
      // An error occurred.
    });
}

function sendPasswordReset() {
  var email = prompt('Please provide your email to reset you password');
//document.getElementById('email').value;
  // [START sendpasswordemail]
  firebase.auth().sendPasswordResetEmail(email).then(function() {
    // Password Reset Email Sent!
    // [START_EXCLUDE]
    alert('Password Reset Email Sent!');
    // [END_EXCLUDE]
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/invalid-email') {
      alert(errorMessage);
    } else if (errorCode == 'auth/user-not-found') {
      alert(errorMessage);
    }
    console.log(error);
    // [END_EXCLUDE]
  });
  // [END sendpasswordemail];
}
/* --------------------------------------------------------------- */
function openTab(evt, tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    evt.currentTarget.className += " active";
    $(".tablinks").css("border-color", "#ccc");
    evt.currentTarget.style.borderColor = "#02ccba #02ccba transparent #02ccba";
    if(tab == "signin") {
    	
    	$("#defaultClose").css({"border-bottom-color": "#02ccba"});
    }
    else {
    	$("#defaultOpen").css({"border-bottom-color": "#02ccba"});
    }
    $(".tabcontent").css({"border-color": "#ccc"});
    $("#"+tab).css({"border-color": "#02ccba"});
} 
/* --------------------------------------------------------------- */
