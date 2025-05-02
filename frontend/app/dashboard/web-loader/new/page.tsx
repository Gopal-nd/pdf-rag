'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import axiosInstance from '@/lib/axios'
import { useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import { toast } from 'sonner'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
const WebPageLoader = () => {
    const [url, setUrl] = useState('')
    const mutation = useMutation({
        mutationFn: async (url: string) => {
            const res = await axiosInstance.post('/api/web-loader', { domain: url })
            console.log(res.data)
            return res.data
        },
        onSuccess: (data) => {
            setUrl('')
            toast.success(data.message)
        },
        onError: (error) => {
            console.log(error)
            toast.error((error as any).response?.data?.message || 'Something went wrong')
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return
        mutation.mutate(url)

    }

    return (
        <div>
            <h1 className='text-center m-2'>Web Page Loader</h1>
            <form onSubmit={handleSubmit} className='flex gap-2 max-w-xl mx-auto'>

                <Input type="url" value={url} placeholder='https://docs.chaicode.com/' onChange={(e) => setUrl(e.target.value)} />
                <Button type='submit' disabled={!url || mutation.isPending}>Add</Button>
            </form>
            {
                mutation.isPending && <p className='text-center'>Loading...</p>
            }
            {
                mutation.data && <p>
                    <h1 className='text-center font-bold text-2xl'>Total Pages: {mutation.data.data.length}</h1>
                    <div className='p-4 '>
                   
                        {       mutation.data.data.length > 0 &&
                                 <Accordion type="single" collapsible>
                                 <AccordionItem value="item-1">
                                     <AccordionTrigger>See List of URLs</AccordionTrigger>
                                     <AccordionContent>{
                                     mutation.data.data.map((url: string, index: number) => (
                                  <p key={index}><span>{index + 1}. </span> <a className='underline text-blue-600' href={url} target='_blank' rel='noreferrer'>{url}</a></p>
                                    ))}
                                     </AccordionContent>
                                 </AccordionItem>
                             </Accordion>
                     
                        }
                    </div>
                </p>
            }
        </div>
    )
}

export default WebPageLoader