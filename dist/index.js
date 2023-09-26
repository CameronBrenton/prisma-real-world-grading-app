"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
(0, server_1.createServer)()
    .then(server_1.startServer)
    .catch((err) => {
    console.log(err);
});
//# sourceMappingURL=index.js.map