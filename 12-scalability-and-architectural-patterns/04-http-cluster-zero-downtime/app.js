import { createServer } from "http";
import { cpus } from "os";
import { once } from "events";
import cluster from "cluster";

if (cluster.isMaster) {
  const availableCpus = cpus();
  console.log(`Clustering to ${availableCpus.length} processes`);
  availableCpus.forEach(() => cluster.fork());

  cluster.on("exit", (worker, code) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(
        `Worker ${worker.process.pid} crashed. Starting a new worker`
      );
      cluster.fork();
    }
  });

  process.on("SIGUSR2", async () => {
    // ① 작접자의 재시작은 신호를 수신할 때 트리거. 비동기 작업이므로 이벤트 핸들러 구현하기 위해 비동기 함수 사용
    const workers = Object.values(cluster.workers);
    for (const worker of workers) {
      // ② 수신되면 cluster.workers 객체의 모든 값을 반복.
      console.log(`Stopping worker: ${worker.process.pid}`);
      worker.disconnect(); // ③ 작업자가 현재 요청을 처리하고 있을 경우 작업이 완료된 후 중단됨.
      await once(worker, "exit");
      if (!worker.exitedAfterDisconnect) continue;
      const newWorker = cluster.fork(); // ④ 종료한 프로세스가 종료되면 새로운 작업자를 생성
      await once(newWorker, "listening"); // ⑤ 다음 작업자를 다시 시작하기 전에 새 작업자가 준비되고 새 연결을 수신할 때까지 대기
    }
  });
} else {
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
//잘 알려진 pm2 라이브러리가 클러스터 기반의 작은 유틸리티로 로드 밸런싱, 프로세스 모니터링, 제로 다운 타임 재시작 및 기타 기능들을 제공한다.
