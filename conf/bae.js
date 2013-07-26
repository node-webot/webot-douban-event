module.exports = {
  mongo: {
    host: process.env.BAE_ENV_ADDR_MONGO_IP,
    port: +process.env.BAE_ENV_ADDR_MONGO_PORT,
    dbname: 'ATzZvnkLypgEYCuKvARj',
    username: process.env.BAE_ENV_AK,
    password: process.env.BAE_ENV_SK,
  },
};
