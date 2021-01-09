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

  /**
   * Perform a request that is previously authenticated.
   *
   * @param {string} method - HTTP method name.
   * @param {string} path - API path.
   * @param {object} payload - HTTP body to be sent
   * @param {object} options - Additional HTTP options. See https.options in node documentation
   */
  async do_authenticated_request(method, path, payload, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    const { access_token: jwt } = this.auth_response;
    // TODO: Validate token expiration
    options.headers["Authorization"] = `Bearer ${jwt}`;
    return this.do_request(method, path, payload, options);
  }

  /**
   * Perform a request.
   *
   * @param {string} method - HTTP method name.
   * @param {string} path - API path.
   * @param {object} payload - HTTP body to be sent
   * @param {object} options - Additional HTTP options. See https.options in node documentation
   */
  async do_request(method, path, payload, options) {
    const { headers } = options;
    delete options.headers;
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
    if (method === "get") {
      content = undefined;
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

  /**
   * Perform a get request to the API, and returns JSON parsed response body
   *
   * @param {string} path - API path.
   * @param {{searchParams:object, ...}} options - Addition HTTP options.
   */
  async get(path, options) {
    return JSON.parse(
      await this.do_authenticated_request("get", path, undefined, options)
    );
  }

  /**
   * Performa a post request with JSON body, and return JSON parsed response body.
   *
   * @param {string} path - API path.
   * @param {object} payload - Any JSON serializable object.
   * @param {object} options - Additiona HTTP options.
   */
  async post(path, payload, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Content-Type"] = "application/json";
    return JSON.parse(
      await this.do_authenticated_request("post", path, payload, options)
    );
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
    const basic_auth = buffer.toString("base64");
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
    return this.get("personas/datos");
  }

  /**
   *
   * @param {string} channel - Application channel, actual purpose currently unknown. (Known values "APP" and "WEB")
   */
  async query_pin_change(channel = "WEB") {
    return this.get("transferencias/pines/consultas-cambiar", {
      searchParams: {
        canal: channel,
      },
    });
  }

  async query_exchange(channel = "WEB") {
    return this.post("consultas/cotizaciones", {
      canal: channel,
    });
  }

  async saving_accounts(channel = "WEB") {
    return this.post("cuentas/resumen/ahorros", {
      canal: channel,
    });
  }

  async programmed_saving_accounts(channel = "WEB") {
    return this.post("cuentas/resumen/ahorros-programados", { canal: channel });
  }

  /**
   * TODO: can we find a better name ?
   *
   * @param {string} channel - A string
   */
  async wheel_savings(channel = "WEB") {
    return this.post("cuentas/resumen/ahorros-ruedas", { canal: channel });
  }

  async certificate_of_deposits(channel = "WEB") {
    return this.post("cuentas/resumen/ahorros-plazos-fijos", {
      canal: channel,
    });
  }

  async contributions(
    year_exercise = new Date().getFullYear(),
    channel = "WEB"
  ) {
    return this.get("compromisos-socio/aporte", {
      searchParams: { canal: channel, anhoEjercicio: year_exercise },
    });
  }

  async solidarity(year_exercise = new Date().getFullYear(), channel = "WEB") {
    return this.get("compromisos-socio/solidaridad", {
      searchParams: { canal: channel, anhoEjercicio: year_exercise },
    });
  }

  async loans(channel = "WEB") {
    return this.post("creditos/creditos/resumen", { canal: channel });
  }

  async loans_requested(channel = "WEB") {
    return this.post("creditos/creditos/resumen/creditos-solicitados", {
      canal: channel,
    });
  }

  async credit_cards(channel = "WEB") {
    return this.get("tarjetas/tarjeta", { searchParams: { canal: channel } });
  }

  /**
   *
   * @param {string} channel
   * @param {string} period - MMYYYY
   * @param {*} account_number
   * @param {*} account_type
   */
  async saving_account_details(
    period,
    account_number,
    account_type,
    channel = "WEB"
  ) {
    return this.post("cuentas/movimiento/ahorros", {
      canal: channel,
      fecha: period,
      cuenta: account_number,
      tipoCuenta: account_type,
    });
  }

  async refresh_token() {
    const auth = await this.do_request("get", "oauth/oauth/token", undefined, {
      searchParams: {
        grant_type: "refresh_token",
        refresh_token: this.refresh_token,
      },
    });

    
  }

  /**
   *
   * @param {string} channel - WEB or APP
   * @param {number} credit_card_number - Credit Card Number (this is not OK, but is how CU actually works)
   */
  async credit_card_cicles(credit_card_number, channel = "WEB") {
    return this.post("tarjetas/extractos/ciclos", {
      canal: channel,
      numeroTarjeta: credit_card_number,
    });
  }

  async master_card_current_details(credit_card_number, channel = "WEB") {
    return this.post("tarjetas/extractos/master-actual", {
      canal: channel,
      numeroTarjeta: credit_card_number,
    });
  }

  /**
   *
   * @param {*} channel
   * @param {*} credit_card_number
   * @param {string} date - DDMMYYYY
   */
  async master_card_history(credit_card_number, date, channel = "WEB") {
    return this.post("tarjetas/extractos/master-actual", {
      canal: channel,
      numeroTarjeta: credit_card_number,
      fecha: date,
    });
  }

  async panal_cabal(credit_card_number, channel = "WEB") {
    return this.post("tarjetas/extractos/panal-cabal", {
      canal: channel,
      numeroTarjeta: credit_card_number,
    });
  }
}

module.exports = {
  CUApi,
};
