import { createServer } from "http";
import staticHandler from "serve-handler";
import ws from "ws";
import Redis from "ioredis";

const redisSub = new Redis();
const redisPub = new Redis();

// serve static files
const server = createServer((req, res) => {
  return staticHandler(req, res, { public: "www" });
});

const wss = new ws.Server({ server });
wss.on("connection", (client) => {
  console.log("Client connected");
  client.on("message", (msg) => {
    console.log(`Message: ${msg}`);
    redisPub.publish("chat_messages", msg); //2 연결된 클라로부터 새로운 메시지가 수신되면 채널에 메시지를 게시한다.
    //서버가 동일한 채널을 구독하고 있으면서 메시지를 클라이언트에게 직접 브로드캐스트하지 않으므로 Redis를 통해 다시 돌아올 것이다.
    // 그러나 앱의 요구 사항에 따라 메시지르 ㄹ즉시 브로드 캐스트 한 후, Redis에서 수신한 것들 중 현재 서버 인스턴스에서 발신했던 메시지들을 무시해야 할 수도 있음
  });
});

redisSub.subscribe("chat_messages");
redisSub.on("message", (channel, msg) => {
  for (const client of wss.clients) {
    if (client.readyState === ws.OPEN) {
      client.send(msg);
    }
  }
});

server.listen(process.argv[2] || 8080);
