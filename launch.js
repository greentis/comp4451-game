const { createServer } = require('node:http');

const hostname = 'localhost';
const port = 8000;

const http = require("http");
const fs = require('fs').promises;

const server = http.createServer((req, res) => {
    fs.readFile(__dirname + "/index.html")
        .then(contents => {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            res.end(contents);
        })
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
