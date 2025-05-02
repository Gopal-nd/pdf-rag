'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axiosInstance from '@/lib/axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'sonner'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useParams } from 'next/navigation'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import ChatHistoryOfCollections from '@/components/ChatHistoryOfCollections'
import DocumentUpload from '@/components/DocumentUpload'
import Link from 'next/link'

const WebPageLoader = () => {
    const  params = useParams()
    const id = params.id
    const {data,isLoading,error} = useQuery({
        queryKey:["chats",id],
        queryFn: async () => {
            const res = await axiosInstance.get(`/api/web-chat`,{params:{id}});
            console.log(res.data)
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
<>
    <div className="flex justify-between items-center mb-6 p-4">
      <h2 className="text-2xl font-bold ">Chat History</h2>
      <Link href={`/dashboard/web-loader/${id}/new`}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition duration-200">
          + New
        </Button>
      </Link>
    </div>

    <hr className="border-gray-300 mb-4 m-4" />

    {/* Chat List */}
    <div className="space-y-4 p-4">
      {data && data?.data?.length > 0 ? (
        data.data.map((msg: any) => (
          <Link key={msg.id} href={`/dashboard/web-loader/${id}/${msg.id}`} className="block">
            <div className=" p-4 rounded-xl shadow-sm  transition duration-150 hover:border">
              <p className=" font-medium line-clamp-1">
                {msg?.webMessages[0]?.content} {msg?.webMessages[1]?.content}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-gray-500">No chat history available.</p>
      )}
    </div>
</>


    )
}

export default WebPageLoader


