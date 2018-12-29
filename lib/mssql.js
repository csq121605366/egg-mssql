const assert = require('assert');
const mssql = require('mssql');

let count = 0;

module.exports = app => {
  // 第一个参数 mssql 指定了挂载到 app 上的字段，我们可以通过 `app.mssql` 访问到 Mssql singleton 实例
  // 第二个参数 createMssql 接受两个参数(config, app)，并返回一个 Mssql 的实例
  app.addSingleton('mssql', createOneClient);
};

function createOneClient(config, app) {
  assert(config.host && config.port && config.user && config.database,
    `[egg-mssql] 'host: ${config.host}', 'port: ${config.port}', 'user: ${config.user}', 'database: ${config.database}' are required on config`);

  app.coreLogger.info('[egg-mssql] connecting %s@%s:%s/%s',
    config.user, config.host, config.port, config.database);
  const pool = new mssql.ConnectionPool(config);
  const client = await pool.connect();

  pool.on('error', err => {
    app.coreLogger.error('mssqlpool', err);
  });

  mssql.on('error', err => {
    app.coreLogger.error('mssqlglobal', err);
  });

  app.beforeStart(function* () {
    const request = new mssql.Request(client);
    const rows = await request.query('select getdate() as currentTime;');
    const index = count++;
    app.coreLogger.info(`[egg-mssql] instance[${index}] status OK, mssql  currentTime: ${rows[0].currentTime}`);
  });
  return client;
}