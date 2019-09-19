const express = require('express')
const axios = require('axios')
require('dotenv').config()

const Utils = require('./utils')
const Config = require('./config')
const { Client, PrivateKey } = require('eftg-dsteem')

// creating an express instance
const app = express()

const cookieSession = require('cookie-session')
const bodyParser = require('body-parser')
const passport = require('passport')

// getting the local authentication type
const LocalStrategy = require('passport-local').Strategy

const port = process.env.PORT || 3000

/*app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "X-Requested-With");
   next();
});

app.use(express.static(publicRoot))*/

/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/
app.use(express.static(Config.PUBLIC_ROOT))

app.use(bodyParser.json())
app.use(cookieSession({
    name: 'mysession',
    keys: ['vueauthrandomkey'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours 
  }))

app.use(passport.initialize());
app.use(passport.session());

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/'+Config.DATABASE;

var _mongoClient;
var db;
async function connectDB(url) { 
  if (!_mongoClient){
    _mongoClient = await MongoClient.connect(url);
    db = _mongoClient.db('wallet')
  }

  return { 
    db: _mongoClient.db('wallet'),
    client: _mongoClient
  };
}

function RPCnode_initClient(address = Config.RPC_NODES[0]) {
  let opts = {}
  opts.addressPrefix = Config.STEEM_ADDRESS_PREFIX
  opts.timeout = Config.DSTEEM_TIMEOUT
  if(process.env.VUE_APP_CHAIN_ID) opts.chainId = process.env.VUE_APP_CHAIN_ID
  return new Client(address, opts)
}

connectDB(url)
var steemClient = RPCnode_initClient()

async function getIssuerAPI(issuer){
  var accounts = await steemClient.database.call('get_accounts',[[issuer]])
  if(!accounts || accounts.length == 0)
    return null

  var account = accounts[0]
  if(!account.json_metadata || account.json_metadata.length==0)
    return null

  var metadata = JSON.parse(account.json_metadata)

  if(!metadata.api)
    return null

  return metadata.api
}

async function getUser(query) {
  var user = await db.collection('users').findOne(query)
  return user
}

async function createProof(user, data) {
  var issuer = ''
  var permlink = ''
  
  var url = data.badge_url.trim()
  var permlink = url.substr(url.lastIndexOf('/') + 1);
  var issuer = url.substring(url.lastIndexOf('@') + 1, url.lastIndexOf('/'));
  var content = await steemClient.database.call( 'get_content', [issuer, permlink] )
  if(!content || !content.json_metadata){
    throw new Error('There is no content on @'+issuer+'/'+permlink)
    return
  }
  var metadata = JSON.parse(content.json_metadata)
  if(!metadata || !metadata.assertions){
    throw new Error('@'+issuer+'/'+permlink+' does not corresponds with a badge with assertions')
  }
  var assertion = metadata.assertions.find( 
    (a)=>{
      for(var i in user.keys) if(user.keys[i].public_key === a.recipient.identity) return true 
      return false
    }
  )
  if(!assertion){
    throw new Error('There are not assertions in the badge that match with this private key')
  }

  var privKey = null
  for(var i in user.keys)
    if(user.keys[i].public_key === assertion.recipient.identity)
      privKey = PrivateKey.fromString(user.keys[i].private_key)

  var trx = {
    ref_block_num: 0,
    ref_block_prefix: 0,
    expiration: data.expiration_date,
    operations: [
      ['transfer',
        {
          from: '',
          to: '',
          amount: '0.001 ' + Config.STEEM_ADDRESS_PREFIX,
          memo: data.message
        }
      ]
    ],
    extensions: []
  }
  var sgnTrx = steemClient.broadcast.sign(trx, privKey)
  var presentation = {
    badge: { issuer, permlink },
    proof: sgnTrx
  }
  return presentation
}

app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: publicRoot })
})

app.post("/api/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).send([user, "Cannot log in", info])
    }

    req.login(user, (err) => {
      res.send(user)
    })
  })(req, res, next)
})

app.get('/api/logout', function(req, res){
  req.logout();
  console.log("logged out")
  return res.send();
});

app.post('/api/signup', async (req, res) => {
  var user = await getUser({username:req.body.username})
  if(user){
    return res.status(404).send('Username '+req.body.username+' already exists')
  }
  var newUser = {
    username: req.body.username,
    password: req.body.password,
    profile:  req.body.profile,
    keys: [],
    issuers: []
  }
  await db.collection('users').insertOne(newUser)
  console.log('account created')
  res.send('Account created')
  return
})

const authMiddleware = (req, res, next) => {
  //return next() //todo: remove
  if (!req.isAuthenticated()) {
    console.log('401 not authenticated')
    res.status(401).send('You are not authenticated')
  } else {
    return next()
  }
}

app.get("/api/login", authMiddleware, async (req, res) => {
  console.log('GET /api/login')
  var user = await getUser({_id:ObjectId(req.session.passport.user)})
  res.send(user)
})

app.post("/api/update_profile", authMiddleware, async (req, res, next) => {
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)

  var profile = req.body.profile
  try{
    Utils.validateProfile(profile)
  }catch(error){
    res.status(404).send(error.message)
    console.log(error.message)
    return
  }
  
  var filter = {_id:ObjectId(req.session.passport.user)}
  db.collection('users').updateOne( filter, { $set: { profile: profile } })
  console.log('profile updated')
  res.send('Profile updated')
})

app.post("/api/create_keys", authMiddleware, async (req, res, next) => {
  var university = req.body.university
  var course = req.body.course
  var course_name = req.body.course_name
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)

  var preconditions = []
  var expiration = 24*60*60*1000
  for(var i in req.body.preconditions){
    var dataProof = {
      badge_url: req.body.preconditions[i],
      message: university,
      expiration_date: new Date(Date.now() + expiration).toISOString().slice(0, -5)
    }
    var presentation = await createProof(user, dataProof)
    preconditions.push(presentation)
  }

  var privKey = PrivateKey.fromSeed(user.username + user.password + university + course)
  var pubKey = privKey.createPublic(Config.STEEM_ADDRESS_PREFIX)
  var key = {
    university,
    course,
    course_name,
    preconditions,
    pending: true,
    registration: {
      pending: true,
      accepted: false,
      comments: ''
    },
    badge: {},
    imgUrl: '',
    public_key: pubKey.toString(),
    private_key: privKey.toString()
  }  

  var issuer = user.issuers.find( (i)=> { return i.name === university })
  console.log('issuer')
  console.log(issuer)

  if(!issuer) {
    var api = await getIssuerAPI(university)
    if(!api){
      var msg = `Impossible to get the API of '${university}'`
      console.log(msg)
      res.status(404).send(msg)
      return
    }

    try{
      var result = await axios.post(api + 'register_user', user.profile )
      console.log(`Registration done in ${university}. username: ${result.data.username}`)
    }catch(error){
      res.status(404).send(`Error registering user in ${university}`)
      console.log(`Error registering user in ${university}`)
      return
    }

    issuer = {
      name: university,
      api:  api,
      username: result.data.username,
      password: result.data.password
    }

    db.collection('users').updateOne( filter, { $push: { issuers: issuer } })
  }

  try{
    var login = {
      username: issuer.username,
      password: issuer.password
    }
    console.log('making login to '+issuer.api)
    userInIssuer = await axios.post(issuer.api + 'login', login)

    console.log('logged in univ')
    console.log(userInIssuer.data)
    var data = {
      auth: login,
      request: {
        user_id: userInIssuer.data._id,
        key: pubKey.toString(),
        preconditions: preconditions,
        course: course
      }
    }
    console.log('registering')
    await axios.post(issuer.api + 'request_registration', data)
    console.log('registered')

    // get course image
    var respCourses = await axios.get(issuer.api + 'courses')
    var courseIssuer = respCourses.data.courses.find( (c)=>{ return c._id === course })
    key.imgUrl = courseIssuer.imgUrl

    await db.collection('users').updateOne(filter,{ $push: { keys: key } })
    res.send({ok:true})
    return
  }catch(error){
    console.log('login error')
    console.log(error)
    res.status(404).send(error.message)
    return
  }
  
  res.status(401).send('No issuer data')
  return
})

app.post("/api/update_key", authMiddleware, async (req, res, next) => {
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)

  var issuer = ''
  var permlink = ''
  
  var url = req.body.badge_url.trim()
  var permlink = url.substr(url.lastIndexOf('/') + 1);
  var issuer = url.substring(url.lastIndexOf('@') + 1, url.lastIndexOf('/'));

  var badge = {
    issuer,
    permlink
  }

  var content = await steemClient.database.call( 'get_content', [issuer, permlink] )
  if(!content){
    res.status(404).send('There is no content on @'+issuer+'/'+permlink)
    return
  }

  var key_found = false
  var metadata = JSON.parse(content.json_metadata)
  if(metadata && metadata.assertions && metadata.badge){
    badge.course_id = metadata.badge.id
    user.keys.forEach( (key) => {
      var assertion = metadata.assertions.find( (a)=>{ return a.recipient.identity === key.public_key })
      if(assertion){
        key_found = true
        var filter = {
          _id:ObjectId(req.session.passport.user),
          'keys.public_key': key.public_key
        }
        db.collection('users').updateOne( filter, { $set: { 'keys.$.badge': badge, 'keys.$.pending': false } })
        console.log('badge added')
      }
    })
  }
  if(key_found){
    res.send('Badge added')
    console.log('Badge added')
    return
  }

  res.status(404).send('Nothing to update')
})

app.post("/api/get_key", authMiddleware, async (req, res, next) => {
  var university = req.body.university
  var course = req.body.course
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)
  for(var i in user.keys){
    if(user.keys[i].university === university && user.keys[i].course === course){
      res.send(user.keys[i].public_key)
      return
    }
  }
  res.status(404).send('Public key not found')
  return
})

async function checkIssuerUpdates(user){
  if(!user.keys) return
  if(!user.issuers) return
  // console.log('checkingIssuerUpdates')
  for(var i in user.keys){
    var key = user.keys[i]
    if(key.registration && key.registration.pending){
      // console.log('registration for '+key.course+' is still pending') 
      var issuer = user.issuers.find( (is)=>{ return is.name === key.university })
      if(issuer && issuer.api){
        // console.log('issuer found')
        var data = {
          auth: {
            username: issuer.username,
            password: issuer.password
          }
        }
        try{
          // console.log('quering the university for request update')
          var response = await axios.post( issuer.api + 'requests', data )
          var requests = response.data
          // console.log('there is a response')
          var request = response.data.find( (r)=>{ return r.key === key.public_key })
          console.log('the is status is '+request.status)
          if(request && request.status !== 'pending'){
            var registration = {
              pending: false,
              accepted: request.status === 'approved',
              comments: request.comments
            }
            // console.log('updating registration to: '+JSON.stringify(registration))
            var filter = {
              _id:ObjectId(user._id),
              'keys.public_key': key.public_key
            }
            await db.collection('users').updateOne( filter, { $set: { 'keys.$.registration': registration } })
          }
        }catch(error){
          console.log('error getting requests: '+error.message)
        }
      }
    }
    if(key.registration && key.registration.accepted && !key.badge.permlink){
      // check for badges
      var issuer = user.issuers.find( (is)=>{ return is.name === key.university })
      if(issuer && issuer.api){
        // console.log('issuer found')
        var data = {
          auth: {
            username: issuer.username,
            password: issuer.password
          }
        }
        try{
          // console.log('quering the university for request update')
          var response = await axios.post( issuer.api + 'students', data )
          var students = response.data
          if(students && students.length > 0){
            var student = students[0]
            if(student.badges){
              var badge = student.badges.find( (b)=>{
                if(b.assertion && b.assertion.recipient && b.assertion.recipient.identity)
                  return b.assertion.recipient.identity === key.public_key
                else
                  return false
              })
              if(badge){
                console.log('New badge found')
                var filter = {
                  _id:ObjectId(user._id),
                  'keys.public_key': key.public_key
                }
                badge = {
                  issuer: badge.badge.link.author,
                  permlink: badge.badge.link.permlink
                }
                await db.collection('users').updateOne( filter, { $set: { 'keys.$.badge': badge, 'keys.$.pending': false } })
              }
            }
          }
        }catch(error){
          console.log('error getting badges: '+error.message)
        }
      }
    }
  }
}

app.get("/api/get_keys", authMiddleware, async (req, res, next) => {
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)
  await checkIssuerUpdates(user)
  user = await getUser(filter)
  res.send(user.keys)
  return
})

app.post('/api/update_issuer', authMiddleware, async (req, res, next) => {
  var filter = {
    _id:ObjectId(req.session.passport.user),
    'issuers.name': req.body.issuer.name
  }
  var issuer = await db.collection('users').findOne(filter)
  if(issuer){
    db.collection('users').updateOne( filter, { $set: { 'issuers.$': req.body.issuer } })
    console.log('issuer updated')
  }else{
    var filter = { _id:ObjectId(req.session.passport.user) }
    db.collection('users').updateOne( filter, { $push: { issuers: req.body.issuer } })
    console.log('issuer added')
  }
  res.send('issuer updated')
})

app.post('/api/login_issuer/:issuer', authMiddleware, async (req, res, next) => {
  var filter = {
    _id:ObjectId(req.session.passport.user),
    'issuers.name': req.params.issuer
  }
  var issuer = await db.collection('users').findOne(filter)
  if(issuer && issuer.data && issuer.data.api && issuer.data.username && issuer.data.password) {
    try{
      var login = {
        username: issuer.data.username,
        password: issuer.data.password
      }
      var response = await axios.post(issuer.data.api + 'login', login)
      res.send('login')
      return
    }catch(error){
      console.log('login error')
      console.log(error)
      res.status(404).send(error.message)
      return
    }
  }
  res.status(401).send('No issuer data')
  return
})

app.get('/api/issuers', authMiddleware, async (req, res, next) => {
  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)
  if(user.issuers) res.send(user.issuers)
  else res.send([])
  return
})

app.post("/api/create_proof", authMiddleware, async (req, res, next) => {

  var filter = {_id:ObjectId(req.session.passport.user)}
  var user = await getUser(filter)
  try{
    var presentation = await createProof(user, req.body)
  }catch(error){
    res.status(404).send(error.message)
    return
  }

  res.send(presentation)
})

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  }, 
  (username, password, done) => {
    (async () => {
      var user = await getUser({username:username, password:password})
      if(user)
        done(null, user)
      else
        done(null, false, {message: 'Incorrect username or password'})
    })()
  }
))

passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser((_id, done) => {
  (async () => {
    var o_id = new ObjectId(_id)
    var user = await getUser({_id:o_id})
    done(null, user)
  })()
})

app.get("*", (req, res, next) => {
  res.sendFile("index.html", { root: Config.PUBLIC_ROOT })
})

app.listen(port, () => {
  console.log("Student app listening on port "+port)
})
