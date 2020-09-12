/*

    ELX Requests / ECS Response Parser / Cookies JAR

*/

const { prependListener } = require("process");
const app = {};
app.title = (str) =>
    str.replace(
        /\w\S*/g,
        (text) => text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()
    );
app.isX = (haystack, needle) =>
    Object.prototype.toString.call(haystack) ==
    `[object ${app.title(needle.toString())}]`;
Object.assign(app, {
    isObj: (o) => app.isX(o, "Object"),
    isArr: (a) => app.isX(a, "Array"),
    isStr: (s) => app.isX(s, "String"),
    obj: (o) => (app.isX(o, "Object") ? o : {}),
    arr: (a) => (app.isX(a, "Array") ? a : []),
});

app.squeeze = (haystack, needle) => {
    if (Object.prototype.toString.call(haystack) !== "[object Object]")
        return false;
    if (haystack.hasOwnProperty(needle.toLowerCase()))
        return haystack[needle.toLowerCase()];
    if (haystack.hasOwnProperty(needle)) return haystack[needle];
    return false;
};

app.digCookie = (cookie) => {
    if (app.isObj(cookie)) {
        if (cookie.hasOwnProperty("name") && cookie.hasOwnProperty("value"))
            return { [cookie.name]: cookie.value };
        else return cookie;
    } else if (app.isStr(cookie)) {
        if (cookie.split("=").length > 1)
            return {
                [cookie.split("=")[0]]: cookie.split("=")[1].split(";")[0],
            };
        else return false;
    } else if (app.isArr(cookie)) {
        Array.prototype.map
            .call(cookie, (c) =>
                c.split("=").length > 1
                    ? {
                          [c.split(";")[0].split("=")[0]]: c
                              .split(";")[0]
                              .split("=")[
                              c.split(";")[0].split("=").length - 1
                          ],
                      }
                    : null
            )
            .filter((c) => c !== null)
            .reduce((i, j) => Object.assign(i, j));
    }
};

class ELX {
    constructor(response) {
        this.response = response;

        if (typeof this.response == "object") {
            this.success =
                this.response.hasOwnProperty("success") && this.response.success
                    ? true
                    : false;
        } else {
            try {
                this.response = JSON.parse(this.response);
                this.success = true;
            } catch (err) {
                this.success = false;
                this.response = null;
            }
        }
    }

    static async stdin() {
        return new Promise((resolve, reject) => {
            const stdin = process.openStdin();
            stdin.addListener("data", (response) => {
                response = JSON.parse(
                    decodeURIComponent(response.toString().trim())
                );
                resolve(response);
            });
        });
    }

    static async listen() {
        const stdout = await ELX.stdin();
        return {
            head: stdout[0],
            headers: stdout[1],
            body: stdout[2],
        };
    }

    validate() {
        if (!this.response || !this.success) return false;
        if (this.response.data == "" || !typeof this.data == "object")
            return false;
        let result = {};
        let url;
        for (url in this.response.data) {
            let data = this.response.data[url];
            result[url] =
                data.hasOwnProperty("success") && data.success ? data : null;
        }

        return result;
    }

    parseCookies() {
        if (!this.validate()) return false;
        let data = this.validate();
        let url;
        let bucket = {};
        for (url in data) {
            if (data[url] == null) continue;

            let nestedCookies = data[url]["cookies"];
            let cookies = Array.prototype.map
                .call(nestedCookies, (i, id) => {
                    return { [i.name]: i.value };
                })
                .reduce((a, b) => Object.assign(a, b), {});
            let dumped = Array.prototype.map
                .call(Object.entries(cookies), (i, id) => i.join("="))
                .join("; ");
            bucket[url] = {
                parsed: cookies,
                dumped: dumped,
            };
        }

        return bucket;
    }

    console() {
        if (!this.validate()) return false;
        let data = this.validate();
        let url;
        let bucket = {};
        for (url in data) {
            if (data[url] == null) continue;

            let val = data[url];
            if (
                val.hasOwnProperty("console") &&
                val.console.hasOwnProperty("success") &&
                val.console.success
            ) {
                bucket[url] = {
                    stdout: val.console.stdout,
                    message: val.message,
                };
            } else bucket[url] = null;
        }

        return bucket;
    }
}

class JAR {
    constructor() {
        this.cookies = {};
    }

    static fromString(cookie) {
        if (!app.isStr(cookie)) return {};
        return cookie.split("=").length > 1
            ? {
                  [cookie.split(";")[0].split("=")[0]]: cookie
                      .split(";")[0]
                      .split("=")[cookie.split(";")[0].split("=").length - 1],
              }
            : {};
    }
    static fromObject(cookie) {
        if (!app.isObj(cookie)) return {};
        if (cookie.hasOwnProperty("name") && cookie.hasOwnProperty("value"))
            return { [cookie.name]: cookie.value };
        return Array.prototype.filter
            .call(Object.keys(cookie), (c, i) => app.isStr(cookie[c]))
            .map((c, i) => {
                return { [c]: cookie[c] };
            })
            .reduce((i, j) => Object.assign(i, j), {});
    }
    static fromArray(cookies) {
        if (!app.isArr(cookies)) return {};
        return Array.prototype.map
            .call(cookies, (cookie) => {
                return app.isObj(cookie)
                    ? JAR.fromObject(cookie)
                    : app.isStr(cookie)
                    ? JAR.fromString(cookie)
                    : {};
            })
            .reduce((i, j) => {
                return Object.assign(i, j);
            });
    }

    get() {
        return Array.prototype.map
            .call(
                Object.keys(this.cookies),
                (key, index) => `${key}=${this.cookies[key]}`
            )
            .join("; ");
    }

    set(cookies, headers = false) {
        if (
            !Object.prototype.toString(cookies) == "[object Object]" ||
            !Object.prototype.toString(cookies) == "[object Array]"
        )
            return false;
        if (headers) {
            if (!app.squeeze(cookies["set-cookie"])) return false;
            else cookies = app.squeeze(cookies["set-cookie"]);
        }
        cookies = app.isObj(cookies)
            ? JAR.fromObject(cookies)
            : JAR.fromArray(cookies);
        this.cookies = Object.assign(this.cookies, cookies);
        return this.cookies;
    }
}

// Exporting as module
exports.ELX = ELX;
exports.JAR = JAR;
exports.listen = ELX.listen;
