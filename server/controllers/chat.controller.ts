import { ApiResponse } from "@/utils/api-response";
import asyncHandler from "@/utils/async-handler";

export const newChat = asyncHandler(async (req, res) => {

    res.json(new ApiResponse({
        statusCode: 200,
        data: null,
        message: 'success'
    }));
});