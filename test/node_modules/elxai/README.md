# What is elxai?

Private Worker for ELX Web Server

# Installation

`npm i elxai`
or
`npm i elxai --save`

# Usage

## Getting the request

```
const { ELX } = require("elxai");
ELX.listen().then((req) => {
    // Do you stuff
});
```

## Sending the response

```
const { ELX } = require("./elx");
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
            domain: "exvous.io",
        },
    ],
};

ELX.send(body, options).then((result) => {
    // Check the result
});

```

## Warning

* *console.log* is not available in elxai, rather you are required to call `ELX.send(body, { options })` to send response/log.
