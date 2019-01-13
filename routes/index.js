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
var db = admin.firestore();
var db1 = admin.database();
db.settings({ timestampsInSnapshots: true });
var router = express.Router();
console.log('-in routes-');
router.use(express.static(path.join(__dirname, '../public')));
router.use('/img', express.static(path.join(__dirname, 'public/imgs')));
router.use('/js', express.static(path.join(__dirname, 'public/javascripts')));
router.use('/css', express.static(path.join(__dirname, 'public/css')));
/* GET home page. */
router.get('/', function(req, res, next) {
    console.log('-in routes-router.get * '+req.session.userId);
	if (req.session.userId) {
        isAdmin=req.session.userdroits;
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
	console.log('In router.post user 1*2 ');
	usersRef.orderByChild('email').equalTo(email).once('value').then(function(snapshot) {
        var user = snapshot.val();
		console.log('In router.post user * '+user);
        if (user) {
            var userKey = Object.keys(user)[0];
            var userEmail = user[userKey].email;
            var userPassword = user[userKey].password;
			console.log('In router.post user OK ');
            if (userPassword == password) {
                var firstName = user[userKey].firstname;
                var lastName = user[userKey].lastname;
                var userName = firstName.toLowerCase() + '-' + lastName.toLowerCase();
				var userdroits = user[userKey].admin;

                req.session.userId = userKey;
                req.session.userName = userName;
				req.session.userdroits = userdroits;
				isAdmin=req.session.userdroits;
				const expiresIn = 60 * 60 * 24 * 5 * 1000;
				admin.auth().createSessionCookie(idToken, {expiresIn})
				var sessionCookie = req.cookies.__session || '';
				 res.setHeader('Content-Type', 'application/json');
				  res.write(JSON.stringify({status: 'success'}));
				  console.log('session login Ok');
				  res.end();
				 return res;
            } else {
                console.log('session login No');
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
        isAdmin=req.session.userdroits;
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
router.post('/signup/', upload.array(), (req, res) => {
	admin.auth().createUser({
		email: req.body.email,
		emailVerified: false,
		password: req.body.password,
		displayName: req.body.username,
		disabled: false
	}).catch((error) => {
		res.send("error");
	}).then((userRecord) => {
		var ref = db1.ref("/");
		var itemsRef = ref.child("users");
		var newItemRef = itemsRef.push();
		newItemRef.set({		
			'firstname': req.body.firstname,
			'lastname': req.body.lastname,
			'username': req.body.username,
			'email': req.body.email,
			'uid': userRecord.uid,
			'appToken': '',
			'company': '',
			'admin': 'false',
			'supervisor': 'false',
			'disabled': 'false'
		}).then(function(docRef) {
			console.log("Document written with ID: ", docRef.id);
		})
		.catch(function(error) {
			console.error("Error adding document: ", error);
		});

		admin.auth().setCustomUserClaims(userRecord.uid, {admin: false, supervisor: false}).then(() => {
			console.log("done");
	        return true;
		}).catch(error => {
		        console.log(error);
		});
		
	    res.send("signedUp");
	    return true;
		
	})
	.catch((error) => {
	    res.send("error");
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
		var device = db.collection('devices').doc(String(req.body.device_ref));
		device.set({
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
			console.log(JSON.stringify(obj));
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
			console.log(JSON.stringify(obj));
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
router.post('/console/disable', isAuthenticated, upload.array(), (req, res) => {
	//--------------	???
	if(req.body.uid === 'JV4B09DOwvbmiYLzfdr9XOVN26q2') {
		return res.status(401).send("UNAUTHORIZED REQUEST!");
	}
	//--------------
	admin.auth().updateUser(req.body.uid, {
	  disabled: true
	})
	  .then((userRecord) => {
	  	db.collection('users').doc(req.body.uid).update({disabled: 'true'});
	    return res.status(200).send("done");
	  })
	  .catch((error) => {
	    return res.status(401).send("error");
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
	var uid = req.body.client_uid;
	//if(res.locals.admin) {
	if (req.session.userId) {
		db.collection('linked_device').where('device_ref', '==', req.body.device_ref )
			.where('client_uid', '==', req.body.client_uid)
			.get().then(docs => {
				var temp = true;
				docs.forEach(doc => {
					temp = false
					return res.status(403).send('Device already linked!').end();
				})
				
				if(temp) {
					db.collection('linked_device').add({
						'device_ref' : req.body.device_ref,
						'client_uid': req.body.client_uid,
						'timestamp': time.format('YYYY-MM-DD HH:mm:ss')
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
			console.log(JSON.stringify(obj));
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
router.post('/console/deletelink', upload.array(), (req, res) => {
	if (req.session.userId) {
		db.collection('linked_device').doc(req.body.docID).delete().then(doc => {
			return res.status(200).send("done");
		}).catch(error => {
			return res.status(403).send('Could not delete link');
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
		console.log(snapshot.key);
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
router.post('/getlatestdata/', upload.array(), (req, res) => {
	/*db.collection('data').find({'device_ref': req.body.device_ref}).limit(1).sort({$natural:-1}).toArray((error, data) => {
		if(error) return res.status(403).send('Could Not Get Data');
		res.setHeader('Content-Type', 'application/json');
    		return res.status(200).send(data[0]);
	})*/
	
	
	var d = [];	
	var devRef = req.body.device_ref;

	var docRef1 = db1.ref("data");
	docRef1.once("value", function(snapshot) {
		console.log(snapshot.key);
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
router.post('/setprameters/', upload.array(), (req, res) => {
	var obj = req.body
	database.collection('devices').where('device_ref', '==', req.body.device_ref).get().then(docs => {
		db.collection('parameters').insertOne(obj, (error, db) => {
			if (error) return res.status(403).send('Could Not set Data');
			return res.status(200).send("done");
		})
	}).catch(error => {
		return res.status(403).send('Could Set Device prameters');
	})
})
/* --------------------------------------------------------------------- */
router.post('/getUserDevices/', (req, res) => {
	var d = []

	var cliUid = req.body.client_uid;
//console.log('--------------------------- '+cliUid+'------------------------');
	var docRef1 = db1.ref("devices");
	docRef1.once("value", function(snapshot) {
		snapshot.forEach(function(doc) {
			//if(doc.val().client_uid == devRef) {
				d.push(doc.val());
			//}
		});
	/*
	database.collection('devices').where('clients.'+req.body.client_uid, '==', 'true').get().then(docs => {
		docs.forEach(function(doc) {
			d.push(doc.data())
		})*/

    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d);
	}).catch(error => {
		console.log(error)
		return res.status(403).send('Could Not Get Devices');
	})
	
})

router.post('/getparameters/', upload.array(), (req, res) => {
	var d = [];
	var devRef = req.body.device_ref;

	var docRef1 = db1.ref("parameters");
	docRef1.once("value", function(snapshot) {
		console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().device_ref == devRef) {
				d.push(doc.val());
			}
		});	
	
	/*
	database.collection('devices').where('device_ref', '==', req.body.device_ref).get().then(docs => {
		db.collection('parameters').find({'device_ref': req.body.device_ref}).toArray((error, data) => {
			if(error) return res.status(403).send('Could Not Get Data');
			res.setHeader('Content-Type', 'application/json');
	    	return res.status(200).send(data);
		})*/
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})
})

router.post('/getdeviceData/', (req, res) => {
	/*db.collection('data').find({'device_ref': req.body.device_ref}).sort({timestamp: -1}).toArray((error, data) => {
		if(error) return res.status(403).send('Could Not Get Data');
		res.setHeader('Content-Type', 'application/json');
    	return res.status(200).send(data);
	})*/
	
	
	var d = [];
	var devRef = req.body.device_ref;
	var docRef1 = db1.ref("data");
	docRef1.once("value", function(snapshot) {
		console.log(snapshot.key);
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

router.post('/getdatedata/', upload.array(), (req, res) => {
	/*db.collection('data').find({device_ref: req.body.device_ref, timestamp: new RegExp(req.body.date)}).sort({timestamp: 1}).toArray((error, data) => {
		if(error) return res.status(403).send('Could Not Get Data');
		res.setHeader('content-type', 'application/json');
		return res.status(200).send(data);
	})*/
	
	var d = [];
	var devRef = req.body.device_ref;
	var docRef1 = db1.ref("data");
	console.log('=============================================',devRef);
	docRef1.once("value", function(snapshot) {
		console.log(snapshot.key);
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
	db.collection('Messages').insertOne(obj, (error, db) => {
			if (error) return false;
			return true;
		})
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

	// Send a message to devices subscribed to the combination of topics
	// specified by the provided condition.
	messages.send(message)
	  .then((response) => {
	    // Response is a message ID string.
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
		db.collection('parameters').find({'device_ref': obj.device_ref}).toArray((error, data) => {
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
					'msg': "Primary Voltage Bypassed its limits"
				}
				resolve(result);
			}
			else if((obj.sec_voltage_p1 >= (400+transfo.sec_voltage) || obj.sec_voltage_p1 <= (400-transfo.sec_voltage)) || (obj.sec_voltage_p2 >= (400+transfo.sec_voltage) || obj.sec_voltage_p2 <= (400-transfo.sec_voltage)) || (obj.sec_voltage_p3 >= (400+transfo.sec_voltage) || obj.sec_voltage_p3 <= (400-transfo.sec_voltage))) {
				result = {
					'status': true,
					'msg': "Secondary Voltage Bypassed its limits"
				}
				resolve(result);
			}
			else if((obj.pri_current_p1 >= (12.12+transfo.pri_current) || obj.pri_current_p1 <= (12.12-transfo.pri_current)) || (obj.pri_current_p2 >= (12.12+transfo.pri_current) || obj.pri_current_p2 <= (12.12-transfo.pri_current)) || (obj.pri_current_p3 >= (12.12+transfo.pri_current) || obj.pri_current_p3 <= (12.12-transfo.pri_current))) {
				result = {
					'status': true,
					'msg': "Primary Current Bypassed its limits"
				}
				resolve(result);
			}
			else if((obj.sec_current_p1 >= (909.35+transfo.sec_current) || obj.sec_current_p1 <= (909.35-transfo.sec_current)) || (obj.sec_current_p2 >= (909.35+transfo.sec_current) || obj.sec_current_p2 <= (909.35-transfo.sec_current)) || (obj.sec_current_p3 >= (909.35+transfo.sec_current) || obj.sec_current_p3 <= (909.35-transfo.sec_current))) {
				result = {
					'status': true,
					'msg': "Secondary Current Bypassed its limits"
				}
				resolve(result);
			}
			else if(obj.internal_temp >= itransfo.internal_temp || obj,external_temp >= itransfo.external_temp) {
				result = {
					'status': true,
					'msg': "Temperature Bypassed its limits"
				}				
				resolve(result);
			}

			resolve(result);
		});
	})
}


async function checkData(obj) {
	console.log("data test started")
	compareData(obj).then(data => {
		console.log(data);
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

router.post('/setdata/', upload.array(), (req, res) => {
	
	database.collection('devices').where('device_ref', '==', req.body.device_ref).get().then(docs => {
		obj = req.body
		obj['timestamp'] = dateTime()
		db.collection('data').insertOne(obj, (error, db) => {
			if (error) return res.status(403).send('Could Not set Data');
			
		})
		checkData(obj).then(data => {
				return res.status(200).send("done");
			}).catch( error => {
				console.log(error);
				return res.status(400).send(error);
			});
		return true;
	}).catch(error => {
		return res.status(403).send('Could Not set Data');
	})
})
/**		
**		
**		Set User Notification Token
**
*/

router.post('/setToken/', upload.array(), (req, res) => {
	var user = database.collection('users').doc(String(req.body.client_uid))
		user.update({
			'appToken': req.body.tokenId
		});
	return res.status(200).send("done");
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
router.post('/devicesub/', upload.array(), (req, res) => {
	var d = [];
	var devRef = req.body.client_uid;
	var docRef1 = db1.ref("linked_device");
	docRef1.once("value", function(snapshot) {
		console.log(snapshot.key);
		snapshot.forEach(function(doc) {
			if(doc.val().client_uid == devRef) {
				d.push(doc.val().device_ref);//d.push(doc.val());
			}
		});	
    	res.setHeader('Content-Type', 'application/json');
		return res.status(200).send(d)		
	}).catch(error => {
		return res.status(403).send('Could Not Get Parameters');
	})
})





router.post('/updateprameters/', upload.array(), (req, res) => {
	database.collection('devices').where('device_ref', '==', req.body.device_ref).get().then(docs => {
		database.collection('users').doc(req.body.uid).then(user => {
			if(user.data().supervisor == "true") {
				db.collection('parameters').update({'device_ref': req.body.device_ref}, {$set:{
					'pri_voltage': req.body.pri_voltage,
				    'sec_voltage': req.body.sec_voltage,
				    'pri_current': req.body.pri_current,
				    'sec_current': req.body.sec_current,
				    'internal_temp': req.body.internal_temp,
				    'external_temp': req.body.external_temp
				}})
				return res.status(200).send('done');
			}
			else {
				return res.status(400).send('error');
			}
			
		}).catch(error => {
			return res.status(400).send('error');
		});
		
	}).catch(error => {
		return res.status(403).send('Could Set Device prameters');
	})
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
	console.log('in Post Settings');
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
