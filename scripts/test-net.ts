import net from 'node:net';

const socket = net.connect(
  {
    host: 'ep-lively-star-b39eyvv6-pooler.c-4.ap-southeast-1.aws.neon.tech',
    port: 5432,
    family: 4,
  },
  () => {
    console.log('TCP Connected successfully to Neon over IPv4!');
    socket.end();
  }
);

socket.on('error', (err) => {
  console.error('Socket Error:', err);
});
