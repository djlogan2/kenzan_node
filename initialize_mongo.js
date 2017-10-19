var db = connect('localhost/KenzanDB');

db.dropDatabase();
db.createCollection('employees');

db.employees.insert({
	username: 'djlogan2',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
});

db.employees.insert({
	username: 'kenzan',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25)
});

db.employees.insert({
	username: 'kenzana',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_ADD_EMP']
});

db.employees.insert({
	username: 'kenzanad',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_ADD_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzanau',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP']
});

db.employees.insert({
	username: 'kenzanadu',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzand',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzandu',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzanu',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_UPDATE_EMP']
});

db.employees.insert({
	username: 'kenzanp',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
	dateOfBirth: new Date(1968,11,26),
	dateOfEmployment: new Date(2000,12,25),
	roles: ['ROLE_SET_PASSWORD', 'ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});
