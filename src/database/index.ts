import { createConnection, getConnectionOptions } from 'typeorm';

(async () => {
  const defaultOptions = await getConnectionOptions();

  if (process.env.NODE_ENV === 'test') {
    Object.assign(defaultOptions, {
      database: 'fin_api_test',
    });
    await createConnection(defaultOptions);
  } else {
    await createConnection();
  }
})();
