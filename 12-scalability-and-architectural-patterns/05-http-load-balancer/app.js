import { createServer } from "http";

const { pid } = process;
const server = createServer((req, res) => {
  let i = 1e7;
  while (i > 0) {
    i--;
  }
  console.log(`Handling request from ${pid}`);
  res.end(`Hello from ${pid}\n`);
});
//여기서는 process.argv[2]를 타켓으로 짠 코드임.
const port = Number.parseInt(process.env.PORT || process.argv[2]) || 8080;
server.listen(port, () => console.log(`Started at ${pid}`));

//여러 원격 서버에 앱 배포 레시피
//1.Node.JS 앱을 실행하는 n개의 백엔드 서버를 프로비저닝한다(forever와 같은 서비스모니터로 여러 인스턴스를 실행하거나 클러스터 모듈을 사용하여 실행)
//2.Nginx가 설치된 로드 밸런서 시스템과 트래픽을 n개의 백엔드 서버로 라우팅 하는데 필요한 모든 설정을 프로비저닝(== 소프트웨어를 시스템에 설치 배포하고 필요한 구성 세팅 작업을해서 실행 가능하도록 준비)
//모든 서버의 모든 프로세스는 네트워크에 있는 다양한 머신의 해당 주소를 사용해 nginx 설정파일 upstream 블록에 나열돼야 함
//브라우저 또는 autocannon과 같은 벤치마킹 도구로 로드 밸런서의 공개 주소로 트래픽을 보낸다
