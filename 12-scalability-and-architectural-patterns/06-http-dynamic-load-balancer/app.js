import { createServer } from "http";
import consul from "consul";
import portfinder from "portfinder";
import { nanoid } from "nanoid";

const serviceType = process.argv[2];
const { pid } = process;

async function main() {
  const consulClient = consul();

  const port = await portfinder.getPortPromise(); // ① 이걸 사용해 시스템에서 사용가능한 포트를 찾는다. 기본적으로 8000에서 검색 시작
  const address = process.env.ADDRESS || "localhost";
  const serviceId = nanoid();

  function registerService() {
    // ② 레지스트리에 새 서비스를 등록하기 위해 저 함수 선언.
    consulClient.agent.service.register(
      {
        id: serviceId,
        name: serviceType,
        address,
        port,
        tags: [serviceType],
      },
      () => {
        console.log(`${serviceType} registered successfully`);
      }
    );
  }

  function unregisterService(err) {
    // ③ 방금 등록한 서비스를 제거하 ㄹ수 있는 함수 선언
    err && console.error(err);
    console.log(`deregistering ${serviceId}`);
    consulClient.agent.service.deregister(serviceId, () => {
      process.exit(err ? 1 : 0);
    });
  }

  process.on("exit", unregisterService); // ④ 종료 됐을 때 서비스가 컨설에서 등록 해제
  process.on("uncaughtException", unregisterService);
  process.on("SIGINT", unregisterService);

  const server = createServer((req, res) => {
    // ⑤ 포트 파인더에서 발견한 포트와 현재 서비스에 대해 설정된 주소에서 서비스용 http 서버 시작. 시작되면 함수 호출 후
    //서비스 검색을 위해 등록
    let i = 1e7;
    while (i > 0) {
      i--;
    }
    console.log(`Handling request from ${pid}`);
    res.end(`${serviceType} response from ${pid}\n`);
  });

  server.listen(port, address, () => {
    registerService();
    console.log(`Started ${serviceType} at ${pid} on port ${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
