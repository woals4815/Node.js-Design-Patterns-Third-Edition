import { createServer } from "http";
import { cpus } from "os";
import cluster from "cluster";

if (cluster.isMaster) {
  const availableCpus = cpus();
  console.log(`Clustering to ${availableCpus.length} processes`);
  availableCpus.forEach(() => cluster.fork());
  //exit 이벤트 수신
  cluster.on("exit", (worker, code) => {
    //의도적으로 종료됐는지 오류로 인해 종료됐는지 확인
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(
        `Worker ${worker.process.pid} crashed. Starting a new worker`
      );
      cluster.fork();
    }
  });
} else {
  setTimeout(() => {
    throw new Error("Ooops");
  }, Math.ceil(Math.random() * 3) * 1000);
  const { pid } = process;
  const server = createServer((req, res) => {
    let i = 1e7;
    while (i > 0) {
      i--;
    }
    console.log(`Handling request from ${pid}`);
    res.end(`Hello from ${pid}\n`);
  });

  server.listen(8080, () => console.log(`Started at ${pid}`));
}
