const clientIo = io("http://localhost:3000", {
  auth: {
    token: `user ${localStorage.getItem("token")}`,
  },
});

clientIo.emit("sayHi", "Hi everyOne");

// clientIo.on("hiBack", (data) => {
//   console.log(data);
// });
clientIo.on("connect_error", (error) => {
  console.log(error);
});
