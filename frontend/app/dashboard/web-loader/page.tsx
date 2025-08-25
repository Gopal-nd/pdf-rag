'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import axiosInstance from '@/lib/axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import React, { useState } from 'react'
import { toast } from 'sonner'

const WebPageLoader = () => {
  const [url, setUrl] = useState('')
  const id= authClient.useSession().data?.user.id
const {data} = useQuery({
  queryKey: ['web-loader',id],
  queryFn: async() => {
    const res = await axiosInstance.get('/api/web-loader')
    return res.data.data
  }
})



  return (
    <div className='p-2'>
      <div className='flex justify-between items-center m-10 '>
      <h1 className='text-2xl font-bold'>Web Page Loader</h1>
      <Link href={`/dashboard/web-loader/new`}>
      <Button>Add</Button>
      </Link>
      </div>
       {
        data && data.length==0 && <p className='text-center'>No data found</p>
       }
        {
          data && data.length!==0 && <div className='flex flex-col gap-2 p-4 rounded-xl'>
            
          {
            data.map((url: any, index: number) => (
              <div key={index} className='p-2 border'>
                <h2>{url.url}</h2>
                  <Link href={`/dashboard/web-loader/${url.id}`}>
                  <Button >Chat</Button>
                  </Link>
              </div>
            ))
          }

                     
          </div>
        }

    </div>
  )
}

export default WebPageLoader