import { createServer } from "http";
import httpProxy from "http-proxy";
import consul from "consul";

const routing = [
  // ① 먼저 로드 밸런서 경로를 정의. 각 항목에는 맵핑된 경로에 도착하는 요청을 처리하는데 사용되는 서비스 포함. 인덱스는 서비스 요청을 라운드로빈하는데 사용
  {
    path: "/api",
    service: "api-service",
    index: 0,
  },
  {
    path: "/",
    service: "webapp-service",
    index: 0,
  },
];

const consulClient = consul(); // ② 레지스트리에 액세스할 수 있도록 컨설 클라이언트를 인스턴스화. 다음으로 http-proxy 서버를 인스턴스화
const proxy = httpProxy.createProxyServer();

const server = createServer((req, res) => {
  const route = routing.find((route) => req.url.startsWith(route.path)); // ③ 서버의 요청 핸들러에서 먼저 하는 것은 라우팅 테이블에서 URL 찾기.
  //결과는 서비스 이름이 포함된 설명자
  consulClient.agent.service.list((err, services) => {
    // ④ 컨설로부터 요청 처리하는데 필요한 서비스를 구현한 서버의 목록을 받음. 비어있거나 오류는 클라에 오류 반환
    //tags 속성을 사용해 사용가능하 모든 서비스를 필터링하고 현재 서비스 유형을 구현하고 있는 서버의 주소를 찾는다
    const servers =
      !err &&
      Object.values(services).filter((service) =>
        service.Tags.includes(route.service)
      );

    if (err || !servers.length) {
      res.writeHead(502);
      return res.end("Bad gateway");
    }

    route.index = (route.index + 1) % servers.length; // ⑤ 요청을 대상으로 라우팅. 라운드로빈 방식에 다라 목록에서 다음 서버를 가리키토도록 인덱스 갱신
    // 그 다음 인덱스를 사용해 목록에서 서버를 선택하고 요청 및 응답 객체랑 같이 proxy.web()으로 전달
    const server = servers[route.index];
    const target = `http://${server.Address}:${server.Port}`;
    proxy.web(req, res, { target });
  });
});

server.listen(8080, () => console.log("Load balancer started on port 8080"));
