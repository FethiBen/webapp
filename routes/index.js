const admin = require('firebase-admin');
var express = require('express');
var firebase = require('firebase');
var path = require('path');

var multer = require('multer'); // v1.0.5
var upload = multer(); 

var serviceAccount = require("../bennia-itansfo-firebase-adminsdk-30hx7-a050b7c503.json");

var defaultApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bennia-itansfo.firebaseio.com"
});
var isAdmin;
var db = admin.firestore();
var db1 = admin.database();

db.settings({ timestampsInSnapshots: true });
var router = express.Router();
//console.log('-in routes-');
router.use(express.static(path.join(__dirname, '../public')));
router.use('/img', express.static(path.join(__dirname, 'public/imgs')));
router.use('/js', express.static(path.join(__dirname, 'public/javascripts')));
router.use('/css', express.static(path.join(__dirname, 'public/css')));
/* GET home page. */
router.get('/', function(req, res, next) {
   //console.log('-in routes-router.get * '+req.session.userId);
	if (req.session.userId) {
        //isAdmin=req.session.userdroits;
		//console.log(isAdmin,' = ',req.session.userdroits);
		res.render('dashboard',{admin: isAdmin});
    }
    res.render('index', {page:'Home', menuId:'home'});
});

function isAuthenticated(req, res, next) {
	const sessionCookie = req.cookies.__session || '';
    admin.auth().verifySessionCookie(sessionCookie, true).then((decodedClaims) => {
		try {
			res.locals.admin = (decodedClaims.admin.toString() === 'true')? true: false;
			res.locals.supervisor = (decodedClaims.supervisor.toString() === 'true')? true: false;
			return next();
		}
		catch(error) {
			return next();
		}
		}).catch(error => {
			res.redirect('/');
		});
}
/* --------------------------------------------------------------------- */
router.post('/sessionLogin/', function(req, res, next) {
	var email = req.body.email;
    var password = req.body.password;
	var idToken = req.body.idToken;
    var database = db1;//firebase.database();
    var usersRef = database.ref('/users/');
	//console.log('In router.post user 1*2 ');
	usersRef.orderByChild('email').equalTo(email).once('value').then(function(snapshot) {
        var user = snapshot.val();
		//console.log('In router.post user * '+user);
        if (user) {
            var userKey = Object.keys(user)[0];
            var userEmail = user[userKey].email;
            var userPassword = user[userKey].password;
			//console.log('In router.post user OK ');
            if (userPassword == password) {
                var firstName = user[userKey].firstname;
                var lastName = user[userKey].lastname;
                var userName = firstName.toLowerCase() + '-' + lastName.toLowerCase();
				var userdroits = user[userKey].admin;

                req.session.userId = userKey;
                req.session.userName = userName;
				req.session.userdroits = userdroits;
				isAdmin=userdroits;//req.session.userdroits;
				const expiresIn = 60 * 60 * 24 * 5 * 1000;
				admin.auth().createSessionCookie(idToken, {expiresIn})
				var sessionCookie = req.cookies.__session || '';
				 res.setHeader('Content-Type', 'application/json');
				  res.write(JSON.stringify({status: 'success'}));
				  //console.log('session login Ok');
				  res.end();
				 return res;
            } else {
                //console.log('session login No');
				return res.status(401).send('UNAUTHORIZED REQUEST!');
            }
        } else {
            throw 'User not found!';
            res.redirect('/');
        }
    }).catch(function(error) { console.log(error) });
});	
/* --------------------------------------------------------------------- */
router.get('/dashboard/', function(req, res, next) {
	if (req.session.userId) {
        //isAdmin=req.session.userdroits;
		//console.log(isAdmin,' = ',req.session.userdroits);
		return res.render('dashboard',{admin: isAdmin});
    }
    res.render('index', {page:'Home', menuId:'home'});
})
router.post('/dashboard/', (req, res) => {
	if (req.session.userId) {
		res.redirect('/templates_dashboard/');
    }
    res.render('index', {page:'Home', menuId:'home'});	
})
router.get('/templates_dashboard/', (req, res) => {
	res.render('templates/dashboard');
})
/* --------------------------------------------------------------------- */
router.get('/signout/', function(req, res, next) {
    req.session.userName = null;
    req.session.userId = null;
	req.session.userdroits = null;
    res.redirect('/');
});
router.get('/signup/', function(req, res, next) {
	if (req.session.userId) {
		res.redirect('/dashboard');
    }
    res.redirect('/signup/');
});
/* --------------------------------------------------------------------- */
router.post('/signup/', (req, res) => {
	//console.log('----------------------1');
	admin.auth().createUser({
		email: req.body.email,
		emailVerified: false,
		password: req.body.password,
		displayName: req.body.username,
		disabled: false
	}).catch((error) => {
		//console.log('----------------------2e : ',error);
		res.send("error");
	}).then((userRecord) => {
		//console.log('----------------------3');
		var ref = db1.ref("/");
		var itemsRef = ref.child("users");
		var newItemRef = itemsRef.push();
		newItemRef.set({		
			'firstname': req.body.firstname,
			'lastname': req.body.lastname,
			'username': req.body.username,
			'password': req.body.password,
			'email': req.body.email,
			'uid': userRecord.uid,
			'appToken': '',
			'Company': 'Anonyme',
			'admin': 'false',
			'supervisor': 'false',
			'disabled': 'false'
		}).then(function(docRef) {
			req.session.userdroits=false;
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).send(JSON.stringify({status: 'success'}));
		}).catch(function(error) {
			res.setHeader('Content-Type', 'application/json');
			return res.status(401).send(JSON.stringify({status: 'error'}));
		});
	})
	.catch((error) => {
		//console.log('----------------------7e : ',error);
	    res.setHeader('Content-Type', 'application/json');
		return res.status(401).send(JSON.stringify({status: 'error'}));
		//res.send("error");
	});
})
/* --------------------------------------------------------------------- */
router.get('/console/', (req, res) => {
	if (req.session.userId) {
		  res.render('templates/console');
	}
	else {
		res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* --------------------------------------------------------------------- */
router.post('/console/', (req, res) => {
	if (req.session.userId) {
		  res.render('templates/console');
	}
	else {
		res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* --------------------------------------------------------------------- */
router.post('/console/devices', (req, res) => {
	if (req.session.userId) {
		return res.render('templates/devices');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* ---------------------------------XXX------------------------------------ */
router.post('/console/adddevice', (req, res) => {
	if (req.session.userId) {
		var ref = db1.ref("/");
		var itemsRef = ref.child("devices");
		var newItemRef = itemsRef.push();
		newItemRef.set({
			'company_name': req.body.company_name,
			'device_name': req.body.device_name,
			'device_ref' : req.body.device_ref,
			'device_uid': req.body.device_uid
		});
		return res.status(200).send("done");
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
	
router.post('/console/getdevices', (req, res) => {
if (req.session.userId) {		
		var docRef = db1.ref("devices");
		docRef.once("value", function(snapshot) {
			var obj=[];
			snapshot.forEach(function(data) {
				obj.push(data.val());
			});		  
			//console.log(JSON.stringify(obj));
			res.setHeader('Content-Type', 'application/json');
			res.status(200);
			res.json(obj);
			return res;		
		}).catch(error => {
			return res.status(400).send('error');
		});
		
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
/* --------------------------------------------------------------------- */
router.post('/console/clients', (req, res) => {
	if (req.session.userId) {
		return res.render('templates/clients');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
router.post('/console/getclients', (req, res) => {
	if (req.session.userId) {
		var docRef = db1.ref("users");
		docRef.once("value", function(snapshot) {
			var obj=[];
			snapshot.forEach(function(data) {
				obj.push(data.val());
			});		  
			//console.log(JSON.stringify(obj));
			res.setHeader('Content-Type', 'application/json');
			res.status(200);
			res.json(obj);
			return res;		
		}).catch(error => {
			return res.status(400).send('error');
		});		
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* -------------------------------------XXX-------------------------------- */
router.post('/console/disable', (req, res) => {
	var thisUid=req.body.uid;
	var i=0;
	var docRef = db1.ref("users");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			//console.log(doc.val().uid,' ? ',thisUid);
			var data=doc.val();
			if (doc.val().uid.toString().trim() === thisUid.toString().trim())
			{
				var key = Object.keys(snapshot.val())[i];
				admin.auth().updateUser(thisUid, {
				  disabled: true
				}).catch((error) => {
					res.status(401).send("error");
				}).then((userRecord) => {
					db1.ref("users/"+key).update({ 'disabled': 'true' });
					return res.status(200).send("done");
				});
			}
			i++;
		});	
	}).catch((error) => {
		res.status(401).send("error");
	});	
})
router.post('/console/setadminclaims', (req, res) => {
	if(req.body.uid === 'n5sNJ8LquAftOMl4jEyyBOwBd5v2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}	
	var thisUid=req.body.uid;
	var thisadmin=req.body.admin;
	var i=0;
	var docRef = db1.ref("users");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			var data=doc.val();
			if (doc.val().uid.toString().trim() === thisUid.toString().trim())
			{
				var key = Object.keys(snapshot.val())[i];
				admin.auth().updateUser(thisUid, {
				  admin: thisadmin
				}).catch((error) => {
					res.status(401).send("error");
				}).then((userRecord) => {
					db1.ref("users/"+key).update({ 'admin': thisadmin });
					//res.setHeader('Content-Type', 'application/json');
					return res.status(200).send("done");
				});
			}
			i++;
		});	
	}).catch((error) => {
		//res.setHeader('Content-Type', 'application/json');
		res.status(401).send("error");
	});	
})

router.post('/console/setsupervisorclaims', (req, res) => {
	//console.log('000',req.body.uid)
	if(req.body.uid === 'n5sNJ8LquAftOMl4jEyyBOwBd5v2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}	
	var thisUid=req.body.uid;
	var thissuper=req.body.supervisor;
	//console.log(thisUid,' - ',thissuper);
	var i=0;
	var docRef = db1.ref("users");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			var data=doc.val();
			if (doc.val().uid.toString().trim() === thisUid.toString().trim())
			{
				var key = Object.keys(snapshot.val())[i];
				//console.log('====',key);
				admin.auth().updateUser(thisUid, {
				  supervisor: thissuper
				}).catch((error) => {
					//res.setHeader('Content-Type', 'application/json');
					//console.log('error1====');
					res.status(401).send("error");
				}).then((userRecord) => {
					db1.ref("users/"+key).update({ 'supervisor': thissuper });
					//res.setHeader('Content-Type', 'application/json');
					//console.log('ok1====');
					return res.status(200).send("done");
				});
			}
			i++;
		});	
	}).catch((error) => {
		//console.log('error2====');
		res.status(401).send("error");
	});	
})

/* --------------------------------------------------------------------- */
router.post('/console/linkproducts/', (req, res) => {
	if (req.session.userId) {
		return res.render('templates/linkproducts');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* ----------------------------------XXX----------------------------------- */
router.post('/console/addlink', (req, res) => {
	if (req.session.userId) {
		var d = [];var _ref = [];
		var refUid = req.body.client_uid;
		var refDev = req.body.device_ref;
		//console.log(refUid,' - ',refDev);
		var ref = db1.ref("/");
		var itemsRef = ref.child("linked_device");
		itemsRef.orderByChild('device_ref').equalTo(refDev).once('value').then(function(snapshot) {
			//console.log('1');
			snapshot.forEach(function(doc) {
				//console.log('2');
				if(doc.val().client_uid == refUid) {
					_ref.push(doc.val());
				}
			});
			//console.log('3');
			var temp = true;
			_ref.forEach(doc => {
				temp = false
				return res.status(403).send('Device already linked!').end();
			})
			//console.log('4');
			
			var ts_hms = new Date();
			var thisTimeIs=ts_hms.getFullYear() + '-' + 
				("0" + (ts_hms.getMonth() + 1)).slice(-2) + '-' + 
				("0" + (ts_hms.getDate())).slice(-2) + ' ' +
				("0" + ts_hms.getHours()).slice(-2) + ':' +
				("0" + ts_hms.getMinutes()).slice(-2) + ':' +
				("0" + ts_hms.getSeconds()).slice(-2);
			
			if(temp) {
				var ref = db1.ref("/");
				var itemsRef = ref.child("linked_device");
				var newItemRef = itemsRef.push();
				newItemRef.set({
					'device_ref' : req.body.device_ref,
					'client_uid': req.body.client_uid,
					'timestamp': thisTimeIs//time.format('YYYY-MM-DD HH:mm:ss')
				}).then( ref => {
					return res.status(200).send("done");
				}).catch(error => {
					return res.status(403).send('Could not add data');
				});
			}
			return true;
		}).catch(error => {
			return res.status(403).send('Could not add data');
		});			
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
router.post('/console/getproducts', (req, res) => {
	if (req.session.userId) {
		var docRef = db1.ref("linked_device");
		docRef.once("value", function(snapshot) {
			var obj=[];
			snapshot.forEach(function(data) {
				var dic = data.val();
				dic['docID'] = data.key;
				obj.push(dic);
			});		  
			//console.log(JSON.stringify(obj));
			res.setHeader('Content-Type', 'application/json');
			res.status(200);
			res.json(obj);
			return res;				
			
			
		}).catch(error => {
			return res.status(400).send({msg: 'Could not get Data', error: error});
		});
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
router.post('/console/updateproduct', (req, res) => {
	if (req.session.userId) {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
/* --------------------------------XXX------------------------------------- */
router.post('/console/deletelink', (req, res) => {
	if (req.session.userId) {
	var thisUid = req.body.docID;
	var docRef = db1.ref("linked_device");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			var data=doc.val();
			if (doc.val().device_ref.toString().trim() === thisUid.toString().trim())
			{
				var key = Object.keys(snapshot.val())[i];
				db1.ref("linked_device/"+key).remove().then(function() {
					//console.log("Remove succeeded.")
					return res.status(200).send("done");
				  }).catch(function(error) {
					//console.log("Remove failed: " + error.message)
					return res.status(401).send(error);
				  });
			}
			i++;
		});	
	}).catch((error) => {
		res.status(401).send("error");
	});	
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
})
/* --------------------------------------------------------------------- */
router.post('/console/settings', (req, res) => {
	if (req.session.userId) {
		return res.render('templates/adSettings');
	}
	else {
		return res.status(403).send('UNAUTHORIZED REQUEST!');
	}
});
/* --------------------------------------------------------------------- */
router.post('/getUserDevicesInfo/', (req, res) => {
	var _ref = [];
	var docRef = db1.ref("linked_device");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			_ref.push(doc.val().device_ref)
		});			
			var d = [];	
			var docRef1 = db1.ref("devices");
			docRef1.once("value", function(snapshot) {
				snapshot.forEach(function(doc) {
					if(_ref.indexOf(doc.val().device_ref) != -1) {
						d.push(doc.val());
					}
				});	
			res.setHeader('Content-Type', 'application/json');
			return res.status(200).send(d);
		}).catch(error => {
			return res.status(403).send('Could Not Get Devices');
		})
		return true;
	}).catch(error => {
		console.log(error)
		return res.status(403).send('Could Not Get Devices');
	})
	
})
/* --------------------------------------------------------------------- */
router.post('/getmessages/', (req, res) => {
	var d = [];	
	var devRef = req.body.device_ref;

	var docRef1 = db1.ref("Messages");
	docRef1.once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});
		res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d);
	}).catch(error => {
		return res.status(403).send('Could Not Get Devices');
	})
})
//upload.array(), 
router.post('/getlatestdata/', (req, res) => {
	
	var d = [];	
	var devRef = req.body.device_ref;

	var docRef1 = db1.ref("data");
	//docRef1.once("value", function(snapshot) {
	docRef1.orderByKey().limitToLast(4).once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});
		res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d[0]);
	}).catch(error => {
		return res.status(403).send('Could Not Get Data');
	})	
	
	
	
})
router.post('/setprameters/', (req, res) => {
		obj = req.body
		var ref = db1.ref("/");
		var itemsRef = ref.child("parameters");
		var newItemRef = itemsRef.push();
		newItemRef.set(obj).then(function(docRef) {
			res.status(200).send("done");
		})
		.catch(function(error) {
			res.status(403).send('Could Not set Data');
		});


	
})
/* --------------------------------------------------------------------- */
router.post('/getUserDevices/', (req, res) => {
	var d = []

	var cliUid = req.body.client_uid;
	var docRef1 = db1.ref("devices");
	docRef1.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			//if(doc.val().client_uid == devRef) {
				d.push(doc.val());
			//}
		});
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d);
	}).catch(error => {
		console.log(error)
		return res.status(403).send('Could Not Get Devices');
	})
	
})

router.post('/getparameters/', (req, res) => {
	var d = [];
	var devRef = req.body.device_ref;

	var docRef1 = db1.ref("parameters");
	docRef1.once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});	
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})
})

router.post('/getdeviceData/', (req, res) => {

	var d = [];
	var devRef = req.body.device_ref;
	var docRef1 = db1.ref("data");
	docRef1.once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});	
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})	
	
	
	
	
})

router.post('/getdatedata/', (req, res) => {

	var d = [];
	var devRef = req.body.device_ref;
	var docRef1 = db1.ref("data");
	docRef1.once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});	
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})	
})


function dateTime() {
	var currentdate = new Date(); 
	return  currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
}
function setMessages(obj) {
		var ref = db1.ref("/");
		var itemsRef = ref.child("Messages");
		var newItemRef = itemsRef.push();
		newItemRef.set(obj).then(function(docRef) {
			return true;
		})
		.catch(function(error) {
			return false;
		});		
		
}
function sendNotification(title, msg, ref) {
	var message = {
		 android: {
		    ttl: 604800 * 1000, // 1 hour in milliseconds
		    priority: 'normal',
		    notification: {
		        title: title,
		        body: msg,
		    },
		    data: {
				device_ref: ref
			}
		  },

		topic: ref
	};

	messages.send(message)
	  .then((response) => {
	    console.log('message sent!');
	    return true;
	  })
	  .catch((error) => {
	  	console.log('could not send message :( '+  error);
	    return false;
	  });
} 

function compareData(obj) {
	return new Promise((resolve, reject) => {
			var data = [];
			var devRef = req.body.device_ref;
			var docRef1 = db1.ref("parameters");
			docRef1.once("value", function(snapshot) {
				snapshot.forEach(function(doc) {
					if(doc.val().device_ref == devRef) {
						data.push(doc.val());
					}
				});

				if(error) {
					reject(null)
				}
				var params = data[0];
				var result = {
					'status': false,
					'msg': ""
				}
				var transfo = {
					'pri_voltage': (30000*parseInt(params.pri_voltage)/100),
					'sec_voltage': (400*parseInt(params.sec_voltage)/100),
					'pri_current': (12.12*parseInt(params.pri_current)/100),
					'sec_current': (909.35*parseInt(params.sec_current)/100),
					'internal_temp': params.internal_temp,
					'external_temp': params.external_temp
				}

				if((obj.pri_voltage_p1 >= (30000+transfo.pri_voltage) || obj.pri_voltage_p1 <= (30000-transfo.pri_voltage)) || (obj.pri_voltage_p2 >= (30000+transfo.pri_voltage) || obj.pri_voltage_p2 <= (30000-transfo.pri_voltage)) || (obj.pri_voltage_p3 >= (30000+transfo.pri_voltage) || obj.pri_voltage_p3 <= (30000-transfo.pri_voltage))) {
					result = {
						'status': true,
						'msg': "Primary Voltage Dépassement des seuils"
					}
					resolve(result);
				}
				else if((obj.sec_voltage_p1 >= (400+transfo.sec_voltage) || obj.sec_voltage_p1 <= (400-transfo.sec_voltage)) || (obj.sec_voltage_p2 >= (400+transfo.sec_voltage) || obj.sec_voltage_p2 <= (400-transfo.sec_voltage)) || (obj.sec_voltage_p3 >= (400+transfo.sec_voltage) || obj.sec_voltage_p3 <= (400-transfo.sec_voltage))) {
					result = {
						'status': true,
						'msg': "Secondary Voltage Dépassement des seuils"
					}
					resolve(result);
				}
				else if((obj.pri_current_p1 >= (12.12+transfo.pri_current) || obj.pri_current_p1 <= (12.12-transfo.pri_current)) || (obj.pri_current_p2 >= (12.12+transfo.pri_current) || obj.pri_current_p2 <= (12.12-transfo.pri_current)) || (obj.pri_current_p3 >= (12.12+transfo.pri_current) || obj.pri_current_p3 <= (12.12-transfo.pri_current))) {
					result = {
						'status': true,
						'msg': "Primary Current Dépassement des seuils"
					}
					resolve(result);
				}
				else if((obj.sec_current_p1 >= (909.35+transfo.sec_current) || obj.sec_current_p1 <= (909.35-transfo.sec_current)) || (obj.sec_current_p2 >= (909.35+transfo.sec_current) || obj.sec_current_p2 <= (909.35-transfo.sec_current)) || (obj.sec_current_p3 >= (909.35+transfo.sec_current) || obj.sec_current_p3 <= (909.35-transfo.sec_current))) {
					result = {
						'status': true,
						'msg': "Secondary Current Dépassement des seuils"
					}
					resolve(result);
				}
				else if(obj.internal_temp >= itransfo.internal_temp || obj,external_temp >= itransfo.external_temp) {
					result = {
						'status': true,
						'msg': "Temperature Dépassement des seuils"
					}				
					resolve(result);
				}

				resolve(result);

			}).catch(error => {
				return res.status(403).send('Could Not Get Parameters');
			})
	})
}


async function checkData(obj) {
	//console.log("data test started")
	compareData(obj).then(data => {
		//console.log(data);
		if(data.status) {
			d = {
				'msg': data.msg,
				'data_id': obj._id,
				'device_ref': obj.device_ref,
				'timestamp': dateTime()
			};
			console.log("Send alarm msg")
			setMessages(d);
			sendNotification("smarTTransfo: Device Warning", "Device Warning - "+obj.device_ref+" \n"+data.msg, obj.device_ref);
			return "done";
		}
		else {
			console.log("status: No Error");
		}
	}).catch( error => {
		return "Compare Error: "+error
	});
	
}


/*
*
*	Receive data from device
*
/* --------------------------------------------------------------------- */

router.post('/setdata/', (req, res) => {
		obj = req.body
		obj['timestamp'] = dateTime()
		var ref = db1.ref("/");
		var itemsRef = ref.child("data");
		var newItemRef = itemsRef.push();
		newItemRef.set(obj).then(function(docRef) {
			//console.log('----------------------4e');
			console.log("Document written");
			checkData(obj).then(data => {
				return res.status(200).send("done");
			}).catch( error => {
				console.log(error);
				return res.status(400).send(error);
			});
		})
		.catch(function(error) {
			//console.log('----------------------5e');
			console.error(error);
		});	
})
/**		
**		
**		Set User Notification Token
**
*/

router.post('/setToken/', (req, res) => {

	var thisUid=req.body.client_uid;
	var thisToken=req.body.tokenId;
	var i=0;
	var docRef = db1.ref("users");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			var data=doc.val();
			if (doc.val().uid.toString().trim() === thisUid.toString().trim())
			{
				var key = Object.keys(snapshot.val())[i];
				admin.auth().updateUser(thisUid, {
				  appToken: thisToken
				}).catch((error) => {
					res.status(401).send("error");
				}).then((userRecord) => {
					db1.ref("users/"+key).update({ 'appToken': thisToken });
					return res.status(200).send("done");
				});
			}
			i++;
		});	
	}).catch((error) => {
		res.status(401).send("error");
	});		
	
	
	
	
	
})
/* --------------------------------------------------------------------- */
router.get('/devicesub/', (req, res) => {
	res.redirect('/devicesub/');
});
/**		
**		
**		return device_ref of the User devices
**
*/
router.post('/devicesub/', (req, res) => {
	var d = [];
	var devRef = req.body.client_uid;
	var docRef1 = db1.ref("linked_device");
	docRef1.once("value", function(snapshot) {
		//console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			//if(doc.val().client_uid == devRef) {
				d.push(doc.val().device_ref);//d.push(doc.val());
			//}
		});	
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})
})





router.post('/updateprameters/',(req, res) => {
	var thisUid=req.body.uid;
	var thisDevRef=req.body.device_ref;
	var i=0;
	var docRef = db1.ref("users");
	docRef.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			var data=doc.val();
			if (doc.val().uid.toString().trim() === thisUid.toString().trim() && doc.val().supervisor == "true")
			{
				
				var docRefp = db1.ref("parameters");
				docRefp.once("value", function(snapshot) {
					snapshot.forEach(function(doc) {
						var data=doc.val();
						var key = Object.keys(snapshot.val())[i];
						if (doc.val().device_ref.toString().trim() === thisDevRef.toString().trim() && doc.val().supervisor == "true")
						{				
							db1.ref("parameters/"+key).update({
								'pri_voltage': req.body.pri_voltage,
								'sec_voltage': req.body.sec_voltage,
								'pri_current': req.body.pri_current,
								'sec_current': req.body.sec_current,
								'internal_temp': req.body.internal_temp,
								'external_temp': req.body.external_temp
							});
						}
						i++;
					});
					res.setHeader('Content-Type', 'application/json');
					return res.status(200).send("done");
				}).catch(error => {
					return res.status(403).send('Could Set Device prameters');
				});
			}
			else {
				res.setHeader('Content-Type', 'application/json');
				return res.status(400).send('error');
			}
		}).catch(error => {
			return res.status(403).send('Could Set Device prameters');
		});
	}).catch(error => {
		return res.status(403).send('Could Set Device prameters');
	});	
})
/* --------------------------------------------------------------------- */
router.post('/transformer/', (req, res) => {
	res.render('templates/transformer');
});
/* --------------------------------------------------------------------- */
router.post('/statistic/', (req, res) => {
	res.render('templates/statistic');
});
/* --------------------------------------------------------------------- */
router.post('/services/', (req, res) => {
	res.render('templates/services');
});
/* --------------------------------------------------------------------- */
router.post('/products/', (req, res) => {
	res.render('templates/products');
});
/* --------------------------------------------------------------------- */
router.get('/settings/', (req, res) => {
	res.render('templates/settings');
});
/* --------------------------------------------------------------------- */
router.post('/settings/', (req, res) => {
	//console.log('in Post Settings');
	res.render('templates/settings');
});
/* --------------------------------------------------------------------- */
router.post('/support/', (req, res) => {
	res.render('templates/support');
});
/* --------------------------------------------------------------------- */
router.post('/account/', (req, res) => {
	res.render('templates/account');
});
/* --------------------------------------------------------------------- */





router.get('**', (req, res) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);	
})

router.get('**', (req, res) => {
	return res.redirect('https://br-webapp.herokuapp.com')
})

/* --------------------------------------------------------------------- */
module.exports = router;
