const got = require("got");

class CUApi {
  constructor(api_uri, api_username, api_password) {
    this.api_uri = api_uri;
    this.api_username = api_username;
    this.api_password = api_password;
    // TODO, do authentication here
    this.auth_response = undefined;
  }

  async do_authenticated_request(method, path, payload, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    const { access_token: jwt } = this.auth_response;
    // TODO: Validate token expiration
    options.headers["Authorization"] = `Bearer ${jwt}`;
    return this.do_request(method, path, payload, options);
  }

  async do_request(method, path, payload, options) {
    const { headers } = options;
    delete options.headers;
    // if method is get, payload doesn't make any sense

    const { body } = await got(path, {
      method,
      form: payload,
      prefixUrl: this.api_uri,
      username: this.api_username,
      password: this.api_username,
      headers: {
        ...headers,
      },
      ...options,
    });

    return body;
  }

  async authenticate(
    credential_type,
    credential_number,
    document_number,
    password_checksum
  ) {
    const auth_response = await this.do_request(
      "post",
      "oauth/oauth/token",
      {
        grant_type: "password",
        username: document_number,
        password: password_checksum,
        cuenta: credential_number,
        tipoCuenta: credential_type,
        canal: "WEB",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic Y3UyNGhzOkNVI3Jvb3Qh", // TODO: improve this, use api credentials
        },
      }
    );

    this.auth_response = JSON.parse(auth_response);

    return this.auth_response;
  }

  async personal_data() {
    return JSON.parse(
      await this.do_authenticated_request("get", "personas/datos")
    );
  }

  /**
   *
   * @param {string} channel - Application channel, actual purpose currently unknown. (Known values "APP" and "WEB")
   */
  async consulta_cambiar_pin(channel = "WEB") {
    const raw_body = await this.do_authenticated_request(
      "get",
      "transferencias/pines/consultas-cambiar",
      undefined,
      {
        searchParams: {
          canal: channel,
        },
      }
    );
    return JSON.parse(raw_body);
  }

  async query_exchange(channel = "WEB") {
    const raw_body = await this.do_authenticated_request(
      "post",
      "consultas/cotizaciones",
      {
        canal: channel,
      }
    );

    return JSON.parse(raw_body);
  }
}

module.exports = {
  CUApi,
};
