let roles = ['admin', 'editor', 'user']

let users = {
  'eve': {
    _id: 'eve',
    roles: ['user', 'admin']
  },
  'bob': {
    _id: 'bob',
    roles: {
      'group1': ['user'],
      'group2': ['user', 'editor'],
      'group3': ['editor']
    }
  },
  'joe': {
    _id: 'joe',
    roles: {
      '__global_roles__': ['user', 'admin'],
      'group1': ['user', 'editor']
    }
  }
}

// -- restricted --

function testRestrictedUser (test, username, expectedRoles, group) {
  Meteor.connection.setUserId(username)      

  restriction = {roles: ['user']}
  if (group)
    restriction.group = group

  Roles.restrict(restriction)
  
  testUser(test, username, expectedRoles, group)
}

Tinytest.add(
  'roles-restricted - can check if restricted user is in role',
  function (test) {
    testRestrictedUser(test, 'eve', ['user'])
    test.equal(Roles.getRolesForUser(users['eve']), ['user'])
  })

Tinytest.add(
  'roles-restricted - can check if restricted user is in role by group',
  function (test) {
    testRestrictedUser(test, 'bob', ['user'], 'group1')
    testRestrictedUser(test, 'bob', ['user'], 'group2')
    testRestrictedUser(test, 'bob', [], 'group3')
  })

Tinytest.add(
  'roles-restricted - can check if restricted user is in role with Roles.GLOBAL_GROUP',
  function (test) {
    testRestrictedUser(test, 'joe', ['user'], Roles.GLOBAL_GROUP)
    testRestrictedUser(test, 'joe', ['user'], 'group1')
  })

Tinytest.add(
  'roles-restricted - restricted user is in role with Roles.GLOBAL_GROUP when no group given',
  function(test) {
    Roles.restrict({roles: ['user'], group: Roles.GLOBAL_GROUP})
    testUser(test, 'joe', ['user'])
  })


Tinytest.add(
  'roles-restricted - defaults secure when neither restricted nor unrestricted',
  function (test) {
    // clear connection from previous tests
    let conn = Meteor.connection
    delete conn._roles

    conn.setUserId('eve')    

    testUser(test, 'eve', [])
  })
    
Tinytest.add(
  "roles-restricted - uses not-logged-in user's full roles",
  function (test) {
    Meteor.connection.setUserId('foo')    

    restriction = {roles: ['user']}
    Roles.restrict(restriction)
  
    testUser(test, 'eve', ['user', 'admin'])
    test.equal(Roles.getRolesForUser(users['eve']), ['user', 'admin'])
  })


// -- unrestricted --

function testUnrestrictedUser (test, username, expectedRoles, group) {
  Roles._unrestrictConnection()
  Meteor.connection.setUserId(username)
  testUser(...arguments)
}

Tinytest.add(
  'roles-restricted - can check if user is in role',
  function (test) {
    testUnrestrictedUser(test, 'eve', ['admin', 'user'])
  })

Tinytest.add(
  'roles-restricted - can check if user is in role by group',
  function (test) {
    testUnrestrictedUser(test, 'bob', ['user'], 'group1')
    testUnrestrictedUser(test, 'bob', ['user', 'editor'], 'group2')
  })

Tinytest.add(
  'roles-restricted - can check if user is in role with Roles.GLOBAL_GROUP',
  function (test) {
    testUnrestrictedUser(test, 'joe', ['user', 'admin'])
    testUnrestrictedUser(test, 'joe', ['user', 'admin'], Roles.GLOBAL_GROUP)
    testUnrestrictedUser(test, 'joe', ['user', 'editor', 'admin'], 'group1')
  })

Tinytest.add(
  'roles-restricted - passing {unrestricted: true} as the context works',
  function (test) {
    Roles._clearUnrestriction()
    test.isTrue(Roles.userIsInRole(users.joe, 'admin', null, {unrestricted: true}))
  })


// -- from alanning:roles --

function testUser (test, username, expectedRoles, group) {
  var user = users[username]

  // test using user object rather than userId to avoid mocking
  _.each(roles, function (role) {
    var expected = _.contains(expectedRoles, role),
        msg = username + ' expected to have \'' + role + '\' permission but does not',
        nmsg = username + ' had un-expected permission ' + role

    l(role, expected)
    if (expected) {
      test.isTrue(Roles.userIsInRole(user, role, group), msg)
    } else {
      test.isFalse(Roles.userIsInRole(user, role, group), nmsg)
    }
  })
}

