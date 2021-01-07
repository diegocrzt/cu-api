const { CUApi } = require("./lib/cu_api");
const dotenv = require("dotenv");
const log = require("loglevel");

dotenv.config();

/**
 * Obtains data from the API as an example of this CUApi client
 *
 * @param {CUApi} api - CU API client object
 * @param {string} credential_type - Single character for credential type (currently only "K" is supported).
 * @param {number} credential_number - Account/Credit Card number
 * @param {number|string} document_number - Physical or Juridical person identifier.
 * @param {string} password_checksum - A 32 long string with hashed password. Yet unknown hashing.
 */
async function get_data(
  api,
  credential_type,
  credential_number,
  document_number,
  password_checksum
) {
  const jwt = await api.authenticate(
    credential_type,
    credential_number,
    document_number,
    password_checksum
  );
  log.info(`Authenticated. Details : ${JSON.stringify(jwt, null, 2)}`);

  const person = await api.personal_data();
  log.info(`Person : ${JSON.stringify(person, null, 2)}`);

  const must_change = await api.consulta_cambiar_pin();
  log.info(`Must Change : ${JSON.stringify(must_change, null, 2)}`);

  return "OK";
}

if (require.main === module) {
  const {
    CREDENTIAL_TYPE,
    CREDENTIAL_NUMBER,
    DOCUMENT_NUMBER,
    PASSWORD_CHECKSUM,
    API_USERNAME,
    API_PASSWORD,
    API_URI,
    LOG_LEVEL,
  } = process.env;
  log.setLevel(LOG_LEVEL);

  const api = new CUApi(API_URI, API_USERNAME, API_PASSWORD);

  get_data(
    api,
    CREDENTIAL_TYPE,
    CREDENTIAL_NUMBER,
    DOCUMENT_NUMBER,
    PASSWORD_CHECKSUM
  )
    .then((r) => log.info(`Result was ${r}`))
    .catch((err) => log.error(`Error was ${err}`))
    .finally(() => {
      log.info("Finished!");
      process.exit();
    });
}
