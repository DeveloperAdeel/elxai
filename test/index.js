const { ELX } = require("elxai");
ELX.listen().then((req) => {
    // Do you stuff
});
let body = "Hello World!";
let options = {
    status: 200, // Default is 200
    headers: { "Content-type": "text/html" },
    cookies: [
        {
            name: "foo",
            value: "bar",
            path: "/",
            expiry: new Date(
                new Date().getTime() + 1000 * 60 * 60 * 1
            ).toGMTString(),
        },
    ],
};

ELX.send({ body, options }).then((result) => {
    // Check the result
});
