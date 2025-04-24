import axiosInstance from '@/lib/axios';
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Button } from './ui/button';
import Link from 'next/link';
import { json } from 'stream/consumers';

const ChatHistoryOfCollections = ({id}:{id:string}) => {
    const {data,isLoading,error} = useQuery({
        queryKey:["chats",id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/api/chat`,{params:{id}});
            return res.data
        }
    })

    if(isLoading){
        return <p>Loading...</p>
    }
    if(error){
        console.log(error)
        return <p>Something went wrong</p>
    }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
    {/* Header Section */}
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold ">Chat History</h2>
      <Link href={`/dashboard/${id}/new`}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition duration-200">
          + New
        </Button>
      </Link>
    </div>

    <hr className="border-gray-300 mb-4" />

    {/* Chat List */}
    <div className="space-y-4">
      {data && data?.data?.length > 0 ? (
        data.data.map((msg: any) => (
          <Link key={msg.id} href={`/dashboard/${id}/${msg.id}`} className="block">
            <div className=" p-4 rounded-xl shadow-sm  transition duration-150 hover:border">
              <p className=" font-medium line-clamp-1">
                {msg.messages[0].content} {msg?.messages[1]?.content}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-gray-500">No chat history available.</p>
      )}
    </div>
  </div>
  )
}

export default ChatHistoryOfCollections