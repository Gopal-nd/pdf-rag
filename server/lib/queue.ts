import { Queue } from "bullmq";

const fileUploadQueue = new Queue("file-upload-queue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});

export default fileUploadQueue;