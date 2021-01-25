module.exports = {
  username: 'myuser',
  password: 'myuserpassword',
  database: 'sensors',
  host: 'localhost',
  port: 54325,
  logging: false,
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
