// src/lib/axios.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000", 
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

export default axiosInstance;
