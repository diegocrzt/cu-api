const { CUApi } = require("./lib/cu_api");
const dotenv = require("dotenv");
const log = require("loglevel");

/**
 * Obtains data from the API as an example of this CUApi client
 *
 * @param {CUApi} api - CU API client object
 * @param {string} credential_type - Single character for credential type (currently only "K" is supported).
 * @param {number} credential_number - Account/Credit Card number
 * @param {number|string} document_number - Physical or Juridical person identifier.
 * @param {string} password - A 32 long string with hashed password. Yet unknown hashing.
 */
async function get_data(
  api,
  credential_type,
  credential_number,
  document_number,
  password
) {
  const jwt = await api.authenticate(
    credential_type,
    credential_number,
    document_number,
    password
  );
  log.info(`Authenticated. Details : ${JSON.stringify(jwt, null, 2)}`);

  const person = await api.personal_data();
  log.info(`Person : ${JSON.stringify(person, null, 2)}`);

  const must_change = await api.query_pin_change();
  log.info(`Must Change : ${JSON.stringify(must_change, null, 2)}`);

  const exchange_rate = await api.query_exchange();
  log.info(`Exchange : ${JSON.stringify(exchange_rate, null, 2)}`);

  const saving_accounts = await api.saving_accounts();
  log.info(`Saving Accounts : ${JSON.stringify(saving_accounts, null, 2)}`);

  const wheel_savings = await api.wheel_savings();
  log.info(`Wheel Savings : ${JSON.stringify(wheel_savings, null, 2)}`);

  const programmed_saving_accounts = await api.programmed_saving_accounts();
  log.info(
    `Programmed savings : ${JSON.stringify(
      programmed_saving_accounts,
      null,
      2
    )}`
  );

  const certificate_of_deposits = await api.certificate_of_deposits();
  log.info(
    `Certificate of deposits : ${JSON.stringify(
      certificate_of_deposits,
      null,
      2
    )}`
  );

  const contributions = await api.contributions();
  log.info(`Contributions : ${JSON.stringify(contributions, null, 2)}`);

  const solidarity = await api.solidarity();
  log.info(`Solidarity : ${JSON.stringify(solidarity, null, 2)}`);

  const credit_cards = await api.credit_cards();
  log.info(`Credit Cards : ${JSON.stringify(credit_cards, null, 2)}`);

  return "OK";
}

if (require.main === module) {
  dotenv.config();
  const {
    CREDENTIAL_TYPE,
    CREDENTIAL_NUMBER,
    DOCUMENT_NUMBER,
    PASSWORD,
    API_USERNAME,
    API_PASSWORD,
    API_URI,
    LOG_LEVEL,
  } = process.env;
  log.setLevel(LOG_LEVEL);

  const api = new CUApi(API_URI, API_USERNAME, API_PASSWORD);

  get_data(api, CREDENTIAL_TYPE, CREDENTIAL_NUMBER, DOCUMENT_NUMBER, PASSWORD)
    .then((r) => log.info(`Result was ${r}`))
    .catch((err) => log.error(`Error was ${err}`))
    .finally(() => {
      log.info("Finished!");
      process.exit();
    });
}
