import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri());

await import("./src/models/Order.js");

// Insert a doc to trigger index creation
await mongoose
  .model("Order")
  .create({
    code: "TEST-1",
    customer: { name: "A", phone: "1" },
    items: [],
    fulfilment: "pickup",
    payment: "cash",
    subtotal: 0,
    total: 0,
  });

const Order = mongoose.model("Order");
const indexes = await Order.collection.indexes();
console.log("Order indexes after insert:");
indexes.forEach((idx) => {
  const ttl =
    idx.expireAfterSeconds != null ? ` TTL=${idx.expireAfterSeconds}s` : "";
  console.log(" ", `${idx.key}: ${JSON.stringify(idx.key)}${ttl}`);
});

await mongod.stop();
