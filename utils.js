function validateUser(user) {
  if(!user.name) throw new Error('No name defined')
  if(!user.family_name) throw new Error('No family name defined')
  if(!user.address) throw new Error('No address defined')
  if(!user.username) throw new Error('No username defined')
  if(!user.password) throw new Error('No password defined')
  if(!user.role) throw new Error('No role defined')
  
  switch(user.role) {
    case 'student':
    case 'admin':
      break
    default:
      throw new Error('Role '+user.role+' does not exists')
  }
  return user
}

function validateCourse(course) {
  if(!course.name) throw new Error('No name defined')
  if(!course.description) throw new Error('No description defined')
  if(!course.level) throw new Error('No level defined')
  if(!course.preconditions) {}
  return course
}

function validateRequest(request) {
  if(!request.user_id) throw new Error('No _id defined')
  if(!request.key) throw new Error('No key defined')
  if(!request.course) throw new Error('No course defined')
  return request
}

function validateProfile(profile) {
  if(!profile.name) throw new Error('No name defined')
  if(!profile.family_name) throw new Error('No family name defined')
  if(!profile.address) throw new Error('No address defined')
  return profile
}

function createPermlink(title) {
  let permlink
  let noise = Math.random().toString(36).substring(7)
  title = title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]+/g, '')
  return noise + '-' + title
}

function stringToAsset(data){
  var parts = data.split(' ')
  var currency = parts[1]
  var precision = parts[0].length - parts[0].indexOf('.') - 1
  var amount = parseInt(parseFloat(parts[0])*Math.pow(10,precision))
  return {
    amount,
    precision,
    currency
  }
}

function assetToString(a){
  return (a.amount/Math.pow(10,a.precision)).toFixed(a.precision) + ' ' + a.currency
}

function log(msg){
  console.log(new Date().toISOString().slice(0,-5) + ' - ' + msg) 
}

module.exports = {
  validateUser,
  validateCourse,
  validateRequest,
  createPermlink,
  stringToAsset,
  assetToString,
  log
}