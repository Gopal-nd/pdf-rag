'use client'
import Logout from '@/components/Logout'
import { authClient } from '@/lib/auth-client'
import React from 'react'
const Dashbaord = () => {
    const { 
        data: session, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 
  return (
    <div>
        <p>Dashboard</p>
        <hr />
        <p>{JSON.stringify(session, null, 2)}</p>
        <Logout />
    </div>
  )
}

export default Dashbaord