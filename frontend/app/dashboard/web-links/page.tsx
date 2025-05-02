'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const WebPageLoader = () => {
  const [url, setUrl] = useState('')
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!url) return

    setPages([])
    setLoading(true)

    const eventSource = new EventSource(`http://localhost:5000/api/web-links/stream?domain=${encodeURIComponent(url)}`)

    eventSource.onmessage = (event) => {
      setPages(prev => [...prev, event.data])
    }

    eventSource.addEventListener('done', (event) => {
      setLoading(false)
      eventSource.close()
    })

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      eventSource.close()
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className='text-center font-bold text-2xl'>Web Links</h1>
      <Input type="url" value={url} placeholder='https://docs.chaicode.com/' onChange={(e) => setUrl(e.target.value)} />
      <Button onClick={handleSubmit} disabled={!url || loading}>Add</Button>

      {loading && <p className='text-center'>Loading...</p>}
      <h1 className='text-center font-bold text-2xl'>Total Pages: {pages.length}</h1>
      <div className='p-4'>
        {pages.map((url, index) => (
          <p key={index}><span>{index + 1}. </span> <Link  className='underline text-blue-600' href={url} >{url}</Link></p>
        ))}
      </div>
    </div>
  )
}

export default WebPageLoader
