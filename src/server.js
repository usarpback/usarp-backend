require("./database");
const app = require("./app");
const port = process.env.LOCAL_NODE_PORT || 3333;
app.listen(port, () => console.log("Server running at", port));
