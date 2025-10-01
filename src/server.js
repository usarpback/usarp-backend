const app = require("./app");
const PORT = Number(process.env.DOCKER_NODE_PORT || process.env.PORT || 3333);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running at ${PORT}`);
});
