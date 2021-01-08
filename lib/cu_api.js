const got = require("got");
const md5 = require("md5");

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
    let content = {
      form: payload,
    };
    if ("application/x-www-form-urlencoded" === headers["Content-Type"]) {
      content = {
        form: payload,
      };
    }
    if ("application/json" === headers["Content-Type"]) {
      content = {
        json: payload,
      };
    }

    const { body } = await got(path, {
      method,
      ...content,
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
    password
  ) {
    const buffer = Buffer.from(
      `${this.api_username}:${this.api_password}`,
      "utf-8"
    );
    const basic_auth = buffer.toString('base64');
    const auth_response = await this.do_request(
      "post",
      "oauth/oauth/token",
      {
        grant_type: "password",
        username: document_number,
        password: md5(password),
        cuenta: credential_number,
        tipoCuenta: credential_type,
        canal: "WEB",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basic_auth}`,
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
  async query_pin_change(channel = "WEB") {
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
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return JSON.parse(raw_body);
  }
}

module.exports = {
  CUApi,
};
