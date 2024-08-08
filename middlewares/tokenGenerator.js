import jwt from "jsonwebtoken";

let userId = 1;
let password = "123456";

const secret = "9UbH34lyXTQOqHg+zP8YHbccifDK0qKes9y1Dq36";

console.log(jwt.sign({ userId, password }, secret));
