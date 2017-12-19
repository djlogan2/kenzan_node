var db = connect('localhost/KenzanDB');

db.dropDatabase();
db.createCollection('employees');

db.employees.insert({
	username: 'djlogan2',
	firstName: 'David',
   email: 'djlogan2.dl@gmail.com',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP', 'ROLE_SET_PASSWORD']
});

db.employees.insert({
	username: 'kenzan',
   email: 'kenzan@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25)
});

db.employees.insert({
	username: 'kenzana',
   email: 'kenzana@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_ADD_EMP']
});

db.employees.insert({
	username: 'kenzanad',
   email: 'kenzanad@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_ADD_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzanau',
   email: 'kenzan@kenzanau.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP']
});

db.employees.insert({
	username: 'kenzanadu',
   email: 'kenzanadu@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzand',
   email: 'kenzand@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzandu',
   email: 'kenzandu@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});

db.employees.insert({
	username: 'kenzanu',
   email: 'kenzanu@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_UPDATE_EMP']
});

db.employees.insert({
	username: 'kenzanp',
   email: 'kenzanp@kenzan.com',
	firstName: 'David',
	lastName: 'Logan',
	middleInitial: 'J',
	bStatus: 'ACTIVE',
	password: '$2a$10$i51OFodMCqcVjvDyQUt8IeYhtuMH7J6JqUXKwWWPCP00DcgHnIscG',
    dateOfBirth: LocalDate.of(1968, 11, 26),
    dateOfEmployment: LocalDate.of(2000, 12, 25),
	roles: ['ROLE_SET_PASSWORD', 'ROLE_ADD_EMP', 'ROLE_UPDATE_EMP', 'ROLE_DELETE_EMP']
});
