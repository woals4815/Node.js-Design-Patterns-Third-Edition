import { createServer } from "http";
import { cpus } from "os";
import cluster from "cluster";

if (cluster.isMaster) {
  // ①
  //초기 실행 시 실제로 마스터 프로세스가 실행됨.
  //여기서 true면 해야하는 작업은 cluster.fork()를 사용해 현재 프로세스를 포크하는 것.
  //사용가능한 모든 처리능력을 활용하기 위해 시스템의 논리적인 CPU 코어 수만큼 많은 작업자를 시작시킨다.
  const availableCpus = cpus();
  console.log(`Clustering to ${availableCpus.length} processes`);
  availableCpus.forEach(() => cluster.fork());
} else {
  // ②
  //마스터 프로세스에서 포크를 실행하면 현재 모듈 app.js 가 다시 실행되지만 이번에는 작업자 모드에서 실행됨.
  //앱이 작업자로 실행되면 실제 작업을 처리할 수 있음
  const { pid } = process;
  //새로운 작업 처리하는 모습
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
